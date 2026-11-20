import type { Skill } from '../../types';
import { capstoneCertificate } from '../../data/capstone';
import { bandFor } from '../../lib/capstone';

/**
 * Part H — one component, two renderings: on screen, and print-ready A4 via
 * @media print (no PDF library). Bands only — the certificate never prints a
 * percentage, never says passed/graduated, never claims a CEFR level.
 */
export function Certificate({
  learnerName,
  schoolName,
  issuedAt,
  skillScores,
  selfCheckLine,
  verification,
}: {
  learnerName: string;
  schoolName: string;
  issuedAt: number;
  skillScores: Record<Skill, number>;
  /** Prebuilt Phase 7 self-check sentence, or null to omit the line entirely. */
  selfCheckLine: string | null;
  verification: string;
}) {
  const skills = Object.keys(skillScores) as Skill[];
  const dateText = new Date(issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const canDo: string[] = (capstoneCertificate.canDoStatements as string[]) ?? [];

  return (
    <div className="certificate-doc mx-auto max-w-[720px] rounded-card border-2 border-brand/30 bg-white p-6 sm:p-10">
      <p className="certificate-school text-center text-xs font-bold uppercase tracking-[0.2em] text-muted">
        {schoolName}
      </p>
      <h1 className="certificate-title mt-6 text-center font-heading text-3xl font-extrabold text-ink sm:text-4xl">
        {capstoneCertificate.title}
      </h1>
      <p className="certificate-course mt-2 text-center text-sm font-bold text-brand">
        {capstoneCertificate.courseName}
      </p>

      <p className="certificate-name mt-8 text-center font-heading text-4xl font-extrabold text-ink sm:text-5xl">
        {learnerName}
      </p>
      <p className="certificate-statement mx-auto mt-3 max-w-[480px] text-center text-sm leading-6 text-ink">
        {capstoneCertificate.statement}
      </p>

      {/* Six-skill profile — band words, never percentages (Part K rule 2) */}
      <div className="certificate-skills mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {skills.map(skill => (
          <div key={skill} className="text-center">
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-brand"
                style={{ width: `${Math.max(8, skillScores[skill])}%` }}
                aria-hidden
              />
            </div>
            <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wide text-muted">{skill}</p>
            <p className="text-xs font-bold text-ink">{bandFor(skillScores[skill])}</p>
          </div>
        ))}
      </div>

      {selfCheckLine && (
        <p className="certificate-selfcheck mx-auto mt-6 max-w-[520px] text-center text-xs italic leading-5 text-muted">
          {selfCheckLine}
        </p>
      )}

      {/* The course's promise, in plain words — what a parent reads */}
      <div className="certificate-cando mt-8 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {canDo.map((line, i) => (
          <p key={i} className="text-[11px] leading-5 text-ink">
            <span className="mr-1 font-bold text-brand">✓</span>{line}
          </p>
        ))}
      </div>

      <div className="certificate-footer mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Date</p>
          <p className="text-xs font-semibold text-ink">{dateText}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Verification</p>
          <p className="tnum text-xs font-semibold text-ink">{verification}</p>
        </div>
      </div>
      <p className="certificate-claim mt-4 text-center text-[10px] leading-4 text-muted">
        {capstoneCertificate.subtitle}
      </p>
      {/* The motivational cliff — there is always something after the summit */}
      <p className="certificate-next mt-2 text-center text-xs font-bold text-brand">
        {capstoneCertificate.nextStepLine}
      </p>
      <p className="certificate-print-hint mt-4 text-center text-[10px] text-muted print:hidden">
        Print this page for a paper copy — it fits one A4 sheet.
      </p>
    </div>
  );
}
