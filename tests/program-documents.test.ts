import { describe, expect, it } from 'vitest';
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_SIZE, safeFileName, validateUpload } from '@/lib/program-documents';

describe('validateUpload', () => {
  it.each([
    ['pdf', 'application/pdf'],
    ['doc', 'application/msword'],
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['xls', 'application/vnd.ms-excel'],
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['ppt', 'application/vnd.ms-powerpoint'],
    ['pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ['png', 'image/png'],
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['txt', 'text/plain'],
    ['csv', 'text/csv'],
  ])('accepts .%s and its matching MIME type', (extension, mimeType) => {
    expect(validateUpload(`teaching.${extension}`, mimeType, 100)).toEqual({ valid: true, mimeType });
    expect(DOCUMENT_ACCEPT.split(',')).toContain(`.${extension}`);
  });

  it('accepts the exact 20 MB boundary, but rejects larger files', () => {
    expect(validateUpload('slides.pdf', 'application/pdf', MAX_DOCUMENT_SIZE).valid).toBe(true);
    expect(validateUpload('slides.pdf', 'application/pdf', MAX_DOCUMENT_SIZE + 1).valid).toBe(false);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects an invalid file size: %s', (size) => {
    expect(validateUpload('slides.pdf', 'application/pdf', size).valid).toBe(false);
  });

  it.each(['', 'application/octet-stream'])('falls back to the extension for a missing or generic browser type', (type) => {
    expect(validateUpload('SLIDES.PDF', type, 5)).toEqual({ valid: true, mimeType: 'application/pdf' });
  });

  it('normalizes browser MIME casing and parameters', () => {
    expect(validateUpload('notes.txt', 'Text/Plain; charset=utf-8', 5)).toEqual({ valid: true, mimeType: 'text/plain' });
  });

  it('accepts common CSV browser aliases and stores the canonical type', () => {
    expect(validateUpload('calendar.csv', 'application/vnd.ms-excel', 5)).toEqual({ valid: true, mimeType: 'text/csv' });
  });

  it.each(['script.html', 'vector.svg', 'archive.zip', 'noextension', 'notes.pdf.exe', 'file.constructor', 'file.__proto__'])('rejects an unsupported extension: %s', (name) => {
    expect(validateUpload(name, '', 5).valid).toBe(false);
  });

  it('rejects a MIME type that conflicts with the extension', () => {
    expect(validateUpload('lecture.pdf', 'text/html', 5).valid).toBe(false);
    expect(validateUpload('lecture.pdf', 'image/png', 5).valid).toBe(false);
  });
});

describe('safeFileName', () => {
  it('removes Unix and Windows directory traversal paths', () => {
    expect(safeFileName('../../lectures/week1.pdf')).toBe('week1.pdf');
    expect(safeFileName('..\\..\\lectures\\week1.pdf')).toBe('week1.pdf');
  });

  it('normalizes accents, spaces and unsafe characters', () => {
    expect(safeFileName('Résumé notes #1.pdf')).toBe('Resume_notes_1.pdf');
    expect(safeFileName('...hidden\u0000<script>.pdf')).toBe('hidden_script_.pdf');
    expect(safeFileName('／nested／notes.pdf')).not.toContain('/');
  });

  it('provides a nonempty fallback', () => {
    expect(safeFileName('../')).toBe('document');
    expect(safeFileName('')).toBe('document');
    expect(safeFileName('...')).toBe('document');
  });

  it('bounds long filenames while preserving the extension', () => {
    const name = safeFileName(`${'a'.repeat(300)}.pptx`);
    expect(name).toHaveLength(180);
    expect(name.endsWith('.pptx')).toBe(true);
  });
});
