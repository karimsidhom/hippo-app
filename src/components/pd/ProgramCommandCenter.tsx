"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Circle,
  Download,
  FileSpreadsheet,
  Users,
  X,
} from "lucide-react";
import type { ProgramCommandCenterData, SignalLevel } from "@/lib/pd-command-center/types";
import styles from "./ProgramCommandCenter.module.css";

interface ProgramCommandCenterProps {
  data: ProgramCommandCenterData;
  onProgramChange?: (programId: string) => void;
}

const signalLabel: Record<SignalLevel, string> = {
  critical: "Action needed",
  watch: "Watch",
  good: "On track",
};

export function ProgramCommandCenter({ data, onProgramChange }: ProgramCommandCenterProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  const maxTrend = Math.max(1, ...data.trend.map((point) => point.cases));
  const setupComplete = data.setup.filter((item) => item.complete).length;
  const setupPercent = Math.round((setupComplete / data.setup.length) * 100);
  const residentRows = data.residents.slice(0, 8);

  return (
    <main className={styles.commandCenter}>
      {data.synthetic && (
        <div className={styles.demoNotice}>
          <span>Synthetic demonstration</span>
          <p>Every name and metric on this page is fictional. No resident or patient information is shown.</p>
        </div>
      )}

      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Program director command center</div>
          <div className={styles.titleRow}>
            <h1>{data.program.name}</h1>
            {!data.synthetic && data.programs.length > 1 && (
              <select
                aria-label="Select program"
                value={data.program.id}
                onChange={(event) => onProgramChange?.(event.target.value)}
              >
                {data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
              </select>
            )}
          </div>
          <p>{data.program.institution} · {data.program.specialty}</p>
        </div>
        <div className={styles.pilotStatus}>
          <span>30-day pilot</span>
          <strong>Day {data.program.pilotDay}</strong>
          <div><i style={{ width: `${Math.round((data.program.pilotDay / data.program.pilotLengthDays) * 100)}%` }} /></div>
          <button type="button" onClick={() => setGuideOpen(true)}><BookOpenCheck size={14} /> Implementation guide</button>
        </div>
      </header>

      <section className={styles.setupBand} aria-label="Pilot setup progress">
        <div className={styles.setupIntro}>
          <span>Implementation</span>
          <strong>{setupPercent}% configured</strong>
        </div>
        <div className={styles.setupSteps}>
          {data.setup.map((item) => {
            const content = <><i data-complete={item.complete}>{item.complete ? <Check size={13} /> : null}</i><span>{item.label}</span></>;
            return data.synthetic ? <div key={item.id} className={styles.setupStep}>{content}</div> : <Link key={item.id} href={item.href} className={styles.setupStep}>{content}</Link>;
          })}
        </div>
      </section>

      <section className={styles.metrics} aria-label="Program metrics">
        <Metric icon={<ClipboardCheck size={18} />} label="Cases · 30 days" value={String(data.metrics.cases30)} detail={`${data.metrics.caseDeltaPercent >= 0 ? "+" : ""}${data.metrics.caseDeltaPercent}% vs prior 30 days`} tone="teal" />
        <Metric icon={<BarChart3 size={18} />} label="EPA completion" value={`${data.metrics.epaCompletionPercent}%`} detail={`${data.metrics.pendingSignoffs} awaiting completion`} tone="green" />
        <Metric icon={<Users size={18} />} label="Resident adoption" value={`${data.metrics.adoptionPercent}%`} detail={`${data.metrics.activeResidents} of ${data.program.residentCount} active`} tone="blue" />
        <Metric icon={<AlertTriangle size={18} />} label="Median sign-off" value={data.metrics.medianSignoffDays === null ? "—" : `${data.metrics.medianSignoffDays}d`} detail={data.metrics.medianSignoffDays === null ? "No signed EPAs yet" : "Request to signature"} tone="amber" />
      </section>

      <div className={styles.primaryGrid}>
        <section className={styles.trendPanel}>
          <div className={styles.sectionHeading}>
            <div><span>Training activity</span><h2>Case volume by week</h2></div>
            <small>Last 8 weeks</small>
          </div>
          <div className={styles.chart} aria-label="Weekly case volume chart">
            {data.trend.map((point) => (
              <div className={styles.barColumn} key={point.label}>
                <span>{point.cases}</span>
                <div><i style={{ height: `${Math.max(5, (point.cases / maxTrend) * 100)}%` }} /></div>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
          <div className={styles.stageList}>
            {data.stages.map((stage) => (
              <div key={stage.id} className={styles.stageRow}>
                <div><strong>{stage.id}</strong><span>{stage.label}</span></div>
                <div className={styles.progress}><i style={{ width: `${stage.percent}%` }} /></div>
                <span>{stage.signed}/{stage.total} · {stage.percent}%</span>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.briefPanel}>
          <div className={styles.sectionHeading}>
            <div><span>This week</span><h2>Director brief</h2></div>
          </div>
          <h3>{data.weeklyBrief.headline}</h3>
          <p>{data.weeklyBrief.summary}</p>
          <ul>{data.weeklyBrief.bullets.map((bullet) => <li key={bullet}><Check size={14} />{bullet}</li>)}</ul>
          <div className={styles.briefActions}>
            {data.synthetic ? (
              <Link href="/signup">Start a program pilot <ArrowRight size={15} /></Link>
            ) : (
              <>
                <a href={`/api/pd/pilot-report?programId=${encodeURIComponent(data.program.id)}`}><Download size={15} /> Pilot report</a>
                <Link href="/pd-dashboard/reports"><FileSpreadsheet size={15} /> Accreditation reports</Link>
              </>
            )}
          </div>
        </aside>
      </div>

      <div className={styles.secondaryGrid}>
        <section className={styles.alertPanel}>
          <div className={styles.sectionHeading}><div><span>Action queue</span><h2>Needs attention</h2></div><small>{data.alerts.length} signals</small></div>
          {data.alerts.length ? data.alerts.map((alert) => (
            data.synthetic ? (
              <div className={styles.alertRow} key={alert.id} data-level={alert.level}>
                <i /><div><strong>{alert.title}</strong><span>{alert.detail}</span></div><small>{signalLabel[alert.level]}</small>
              </div>
            ) : (
              <Link className={styles.alertRow} key={alert.id} data-level={alert.level} href={alert.href}>
                <i /><div><strong>{alert.title}</strong><span>{alert.detail}</span></div><small>{signalLabel[alert.level]}</small>
              </Link>
            )
          )) : <div className={styles.emptySignal}><Check size={20} /><span>No urgent program signals</span></div>}
        </section>

        <section className={styles.rosterPanel}>
          <div className={styles.sectionHeading}>
            <div><span>Cohort</span><h2>Resident pulse</h2></div>
            {!data.synthetic && <Link href="/pd-dashboard">Full cohort <ArrowRight size={14} /></Link>}
          </div>
          <div className={styles.rosterTable}>
            <div className={styles.rosterHeader}><span>Resident</span><span>Cases</span><span>EPAs</span><span>Status</span></div>
            {residentRows.map((resident) => {
              const content = <><div><strong>{resident.name}</strong><span>{resident.trainingYear}</span></div><span>{resident.cases30}</span><span>{resident.epaSigned}/{resident.epaTotal}</span><small data-level={resident.signal}>{signalLabel[resident.signal]}</small></>;
              return data.synthetic
                ? <div id={`resident-${resident.userId}`} className={styles.rosterRow} key={resident.userId}>{content}</div>
                : <Link href={`/pd-dashboard/${resident.userId}`} className={styles.rosterRow} key={resident.userId}>{content}</Link>;
            })}
          </div>
        </section>
      </div>

      <footer className={styles.privacyFooter}>
        Program-scoped training data only. No patient names, MRNs, or clinical notes are included in this command center.
        <span>Generated {new Date(data.generatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</span>
      </footer>

      {guideOpen && (
        <div className={styles.guideBackdrop} role="presentation" onMouseDown={() => setGuideOpen(false)}>
          <section className={styles.guide} role="dialog" aria-modal="true" aria-labelledby="implementation-guide-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span>Pilot launch path</span><h2 id="implementation-guide-title">Implementation guide</h2></div>
              <button type="button" aria-label="Close implementation guide" onClick={() => setGuideOpen(false)}><X size={18} /></button>
            </header>
            <p>Complete these six steps to give your program a measurable baseline and a useful first weekly brief.</p>
            <ol>
              {data.setup.map((item, index) => (
                <li key={item.id} data-complete={item.complete}>
                  {item.complete ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  <div><strong>{index + 1}. {item.label}</strong><span>{setupDescription[item.id] ?? "Complete this item for pilot readiness."}</span></div>
                  {data.synthetic ? <small>{item.complete ? "Complete" : "Next"}</small> : <Link href={item.href}>{item.complete ? "Review" : "Set up"}<ArrowRight size={13} /></Link>}
                </li>
              ))}
            </ol>
            <footer><div><i style={{ width: `${setupPercent}%` }} /></div><span>{setupComplete} of {data.setup.length} complete</span></footer>
          </section>
        </div>
      )}
    </main>
  );
}

const setupDescription: Record<string, string> = {
  profile: "Confirm institution, specialty, and program details.",
  residents: "Invite the pilot cohort and verify training years.",
  faculty: "Add supervisors and assign the people they oversee.",
  rotations: "Load the current blocks so activity has context.",
  forms: "Publish the assessment forms your program already uses.",
  activity: "Have residents log a case or request an EPA observation.",
};

function Metric({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={styles.metric} data-tone={tone}><div>{icon}<span>{label}</span></div><strong>{value}</strong><p>{detail}</p></article>;
}
