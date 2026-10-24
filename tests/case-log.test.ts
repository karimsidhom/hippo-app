// First tests for the case log: create, edit and export, run against the real
// route handlers. Auth, Prisma and the audit log are replaced by an in-memory
// fake so the tests need no database and no network.
import ExcelJS from 'exceljs';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown> & { id: string; userId: string; caseDate: Date };

const store = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  cases: new Map<string, Record<string, unknown>>(),
  feed: [] as unknown[],
  seq: 0,
}));

vi.mock('@/lib/api-auth', async () => {
  const { NextResponse } = await import('next/server');
  return {
    requireAuth: async () =>
      store.user
        ? { user: store.user, error: null }
        : { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) },
  };
});

vi.mock('@/lib/audit', () => ({ logAudit: async () => {} }));

vi.mock('@/lib/db', () => {
  const byDateDesc = (a: Record<string, unknown>, b: Record<string, unknown>) =>
    (b.caseDate as Date).getTime() - (a.caseDate as Date).getTime();
  return {
    db: {
      caseLog: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `case-${++store.seq}`, createdAt: new Date(), updatedAt: new Date(), ...data };
          store.cases.set(row.id, row);
          return row;
        },
        findUnique: async ({ where }: { where: { id: string } }) => store.cases.get(where.id) ?? null,
        findMany: async ({ where }: { where: { userId: string } }) =>
          [...store.cases.values()].filter((c) => c.userId === where.userId).sort(byDateDesc),
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = { ...store.cases.get(where.id), ...data, updatedAt: new Date() };
          store.cases.set(where.id, row);
          return row;
        },
      },
      feedEvent: {
        create: async ({ data }: { data: unknown }) => {
          store.feed.push(data);
          return data;
        },
      },
      milestone: { findMany: async () => [] },
      personalRecord: { findMany: async () => [] },
      user: { findUnique: async () => ({ name: 'Test Resident', email: 'resident@example.test' }) },
      profile: {
        findUnique: async () => ({
          roleType: 'RESIDENT', specialty: 'Urology', subspecialty: null, institution: 'Test University',
          trainingCountry: 'CA', pgyYear: 4, trainingYearLabel: 'PGY-4',
        }),
      },
    },
  };
});

const { POST: createCase } = await import('@/app/api/cases/route');
const { PATCH: editCase } = await import('@/app/api/cases/[id]/route');
const { POST: exportCases } = await import('@/app/api/export/route');

const RESIDENT = { id: 'user-a', email: 'resident@example.test' };
const OTHER = { id: 'user-b', email: 'other@example.test' };

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(`https://hippomedicine.com${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const validCase = {
  procedureName: 'Ureteroscopy with laser lithotripsy',
  procedureCategory: 'Endourology',
  role: 'PRIMARY_SURGEON',
  surgicalApproach: 'ENDOSCOPIC',
  difficultyScore: 3,
  operativeDurationMinutes: 55,
  attendingLabel: 'Attending A',
  institutionSite: 'Test Hospital',
  notes: 'Left proximal stone. MRN: 12345678 dusted fully.',
  caseDate: '2026-09-14',
};

async function logCase(body: Record<string, unknown> = validCase): Promise<Row> {
  const res = await createCase(jsonRequest('/api/cases', 'POST', body));
  expect(res.status).toBe(201);
  return (await res.json()) as Row;
}

beforeEach(() => {
  store.user = RESIDENT;
  store.cases.clear();
  store.feed.length = 0;
  store.seq = 0;
});

describe('creating a case (POST /api/cases)', () => {
  it('saves the case to the signed-in resident with schema defaults', async () => {
    const res = await createCase(jsonRequest('/api/cases', 'POST', { ...validCase, userId: 'intruder' }));
    expect(res.status).toBe(201);
    const body = await res.json();

    const saved = store.cases.get(body.id)!;
    expect(saved.userId).toBe(RESIDENT.id);
    expect(saved.procedureName).toBe(validCase.procedureName);
    expect(saved.caseDate).toBeInstanceOf(Date);
    expect((saved.caseDate as Date).toISOString().slice(0, 10)).toBe('2026-09-14');
    expect(saved.autonomyLevel).toBe('SUPERVISOR_PRESENT');
    expect(saved.outcomeCategory).toBe('UNCOMPLICATED');
    expect(saved.isPublic).toBe(false);
    expect(store.feed).toHaveLength(0);
  });

  it('rejects a case with no procedure name', async () => {
    const { procedureName: _omit, ...missing } = validCase;
    const res = await createCase(jsonRequest('/api/cases', 'POST', missing));
    expect(res.status).toBe(400);
    expect(store.cases.size).toBe(0);
  });

  it('rejects an out-of-range difficulty score', async () => {
    const res = await createCase(jsonRequest('/api/cases', 'POST', { ...validCase, difficultyScore: 9 }));
    expect(res.status).toBe(400);
    expect(store.cases.size).toBe(0);
  });

  it('refuses when signed out', async () => {
    store.user = null;
    const res = await createCase(jsonRequest('/api/cases', 'POST', validCase));
    expect(res.status).toBe(401);
    expect(store.cases.size).toBe(0);
  });

  it('posts a feed event only for public cases', async () => {
    await logCase({ ...validCase, isPublic: true });
    expect(store.feed).toHaveLength(1);
    expect(store.feed[0]).toMatchObject({ userId: RESIDENT.id, eventType: 'CASE_LOGGED' });
  });
});

describe('editing a case (PATCH /api/cases/:id)', () => {
  it('updates allowed fields and converts the date', async () => {
    const created = await logCase();
    const res = await editCase(
      jsonRequest(`/api/cases/${created.id}`, 'PATCH', {
        procedureName: 'Flexible ureteroscopy',
        difficultyScore: 4,
        caseDate: '2026-09-15',
      }),
      params(created.id),
    );
    expect(res.status).toBe(200);
    const saved = store.cases.get(created.id)!;
    expect(saved.procedureName).toBe('Flexible ureteroscopy');
    expect(saved.difficultyScore).toBe(4);
    expect((saved.caseDate as Date).toISOString().slice(0, 10)).toBe('2026-09-15');
  });

  it('ignores fields outside the whitelist, such as the owner', async () => {
    const created = await logCase();
    await editCase(
      jsonRequest(`/api/cases/${created.id}`, 'PATCH', { userId: OTHER.id, id: 'case-999', notes: 'edited' }),
      params(created.id),
    );
    const saved = store.cases.get(created.id)!;
    expect(saved.userId).toBe(RESIDENT.id);
    expect(saved.id).toBe(created.id);
    expect(saved.notes).toBe('edited');
  });

  it("returns 404 for someone else's case and leaves it unchanged", async () => {
    const created = await logCase();
    store.user = OTHER;
    const res = await editCase(
      jsonRequest(`/api/cases/${created.id}`, 'PATCH', { procedureName: 'Hijacked' }),
      params(created.id),
    );
    expect(res.status).toBe(404);
    expect(store.cases.get(created.id)!.procedureName).toBe(validCase.procedureName);
  });
});

describe('exporting the case log (POST /api/export)', () => {
  async function exportWorkbook(body: unknown = {}) {
    const res = await exportCases(jsonRequest('/api/export', 'POST', body));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('spreadsheetml');
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="Hippo-CaseLog-.+\.xlsx"/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await res.arrayBuffer());
    return workbook;
  }

  function sheetText(ws: ExcelJS.Worksheet) {
    const out: string[] = [];
    ws.eachRow((row) => row.eachCell((cell) => out.push(String(cell.text ?? ''))));
    return out.join('\n');
  }

  it('builds the workbook with every case and the expected sheets', async () => {
    await logCase();
    await logCase({ ...validCase, procedureName: 'Cystoscopy', caseDate: '2026-10-01' });
    const workbook = await exportWorkbook();

    const names = workbook.worksheets.map((ws) => ws.name);
    expect(names[0]).toBe('Cover');
    expect(names).toEqual(expect.arrayContaining(['Case Log', 'Annual Summary', 'Milestones & PRs']));

    const log = sheetText(workbook.getWorksheet('Case Log')!);
    expect(log).toContain('Ureteroscopy with laser lithotripsy');
    expect(log).toContain('Cystoscopy');
  });

  it('scrubs identifiers: no attending, site or MRN reaches the file', async () => {
    await logCase();
    const workbook = await exportWorkbook({ includeNotes: true });
    const all = workbook.worksheets.map(sheetText).join('\n');
    expect(all).not.toContain('Attending A');
    expect(all).not.toContain('Test Hospital');
    expect(all).not.toContain('12345678');
    expect(all).toContain('[MRN-REDACTED]');
  });

  it('only exports cases from the requested year', async () => {
    await logCase({ ...validCase, procedureName: 'Case from 2025', caseDate: '2025-06-01' });
    await logCase({ ...validCase, procedureName: 'Case from 2026', caseDate: '2026-06-01' });
    const log = sheetText((await exportWorkbook({ year: 2026 })).getWorksheet('Case Log')!);
    expect(log).toContain('Case from 2026');
    expect(log).not.toContain('Case from 2025');
  });

  it("never includes another resident's cases", async () => {
    store.user = OTHER;
    await logCase({ ...validCase, procedureName: 'Other resident case' });
    store.user = RESIDENT;
    await logCase();
    const log = sheetText((await exportWorkbook()).getWorksheet('Case Log')!);
    expect(log).not.toContain('Other resident case');
  });
});
