import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { SKILLS, bandFor, type MergedSelfck, type TeacherDataset } from '../../lib/teacherOverview';
import { SELFCK_HEADER } from '../../lib/teacherMerge';

const LEVEL_LABELS: Record<string, string> = { easy: 'Easy', core: 'Core', challenging: 'Challenging' };
const DOTS: Record<string, string> = { Strong: '●●●', Secure: '●●●', Developing: '●●○', Emerging: '●○○' };

const csvCell = (v: string | number | undefined | null): string => {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** The Phase 12 exact header (Part E2). */
function rowsToCsv(rows: MergedSelfck[]): string {
  const lines: string[] = [SELFCK_HEADER];
  for (const r of rows) {
    if (r.skipped) continue;
    const flag = Object.values(r.flags).find(f => f) ?? '';
    const cells: Array<string | number | undefined> = [
      r.learner, r.unit, r.level,
      new Date(r.completedAt).toISOString().slice(0, 10),
    ];
    for (const skill of SKILLS) {
      cells.push(r.ratings[skill] ?? '', r.accuracy[skill] ?? '');
    }
    cells.push(flag, r.hardest ?? '', r.note);
    lines.push(cells.map(c => csvCell(c)).join(','));
  }
  return lines.join('\n');
}

/**
 * PHASE 12 — Self-check tab. Bands replace the percentage column (Part E2);
 * flags first by default; the generated sentence about the most-flagged
 * learner is the reason the tab exists.
 */
export function SelfCheckTab({ dataset, flagOnlyDefault, onOpenLearner, learnerFilter }: { dataset: TeacherDataset; flagOnlyDefault: boolean; onOpenLearner?: (name: string) => void; learnerFilter?: string[] | null }) {
  const [showEveryone, setShowEveryone] = useState(!flagOnlyDefault);
  const [search, setSearch] = useState('');

  const flaggedLearners = useMemo(() => {
    const counts = new Map<string, { high: number; low: number }>();
    for (const r of dataset.selfck) {
      for (const f of Object.values(r.flags)) {
        if (!f) continue;
        const slot = counts.get(r.learner) ?? { high: 0, low: 0 };
        slot[f]++;
        counts.set(r.learner, slot);
      }
    }
    return counts;
  }, [dataset]);

  const rows = useMemo(() => {
    let base = dataset.selfck;
    if (learnerFilter && learnerFilter.length > 0) {
      base = base.filter(r => learnerFilter.includes(r.learner) || learnerFilter.includes(r.displayName));
    }
    const filtered = base.filter(r => {
      if (showEveryone) return true;
      return Object.values(r.flags).some(f => f);
    });
    if (search.trim() === '') return filtered;
    const q = search.trim().toLowerCase();
    return filtered.filter(r => r.displayName.toLowerCase().includes(q) || r.learner.toLowerCase().includes(q));
  }, [dataset, showEveryone, search]);

  const misjudged = [...flaggedLearners.values()].filter(s => s.high > 0 || s.low > 0).length;
  const over = [...flaggedLearners.values()].filter(s => s.high > 0).length;
  const under = [...flaggedLearners.values()].filter(s => s.low > 0).length;

  const exportCsv = () => {
    const blob = new Blob([rowsToCsv(dataset.selfck)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hangout2-selfcheck-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const printView = () => window.print();

  return (
    <div className="space-y-4 teacher-print-view">
      <p className="print-caption text-xs font-semibold text-muted print:block hidden">
        Self-check records — Hangout 2 English Quest
      </p>

      {/* The sentences (Part E2) */}
      <div className="surface-card p-5 sm:p-6">
        {misjudged > 0 ? (
          <p className="text-sm font-bold text-ink">
            {misjudged} learner{misjudged === 1 ? '' : 's'} misjudge{misjudged === 1 ? 's' : ''} themselves.{' '}
            {over} tend{over === 1 ? 's' : ''} to think she know{over === 1 ? 's' : ''} more than she does;{' '}
            {under} think{under === 1 ? 's' : ''} they know less.
          </p>
        ) : (
          <p className="text-sm text-muted">No self-check flags — nobody is far off their own assessment.</p>
        )}
        {dataset.overview.misjudgeSentence && (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-ink">
            {dataset.overview.misjudgeSentence}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 print:hidden">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="checkbox"
              checked={showEveryone}
              onChange={e => setShowEveryone(e.target.checked)}
              className="h-4 w-4 accent-teal-700"
            />
            Show everyone (default: flagged learners only)
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by learner…"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
              style={{ minHeight: 40, width: 180 }}
              aria-label="Filter self-check records by learner name"
            />
          </label>
          <button onClick={exportCsv} className="action-secondary text-sm" style={{ minHeight: 44 }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={printView} className="action-secondary text-sm" style={{ minHeight: 44 }}>
            <Printer size={15} /> Print this view
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="surface-card p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="print-table-head">
              <tr className="text-[10px] uppercase text-muted">
                <th className="pb-2 pr-2 font-bold">Learner</th>
                <th className="pb-2 pr-2 font-bold tnum">Unit</th>
                <th className="pb-2 pr-2 font-bold">Level</th>
                {SKILLS.map(s => (
                  <th key={s} className="pb-2 pr-2 font-bold capitalize">{s.slice(0, 4)}</th>
                ))}
                <th className="pb-2 pr-2 font-bold">Hardest</th>
                <th className="pb-2 font-bold">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={`${r.learner}-${r.unit}-${r.level}-${r.completedAt}`} className="border-t border-slate-100 align-top">
                  <td className="py-2 pr-2 font-semibold text-ink whitespace-nowrap">{onOpenLearner ? (<button onClick={() => onOpenLearner(r.learner)} className="underline decoration-dotted">{r.displayName}</button>) : r.displayName}</td>
                  <td className="py-2 pr-2 tnum text-muted">U{r.unit}</td>
                  <td className="py-2 pr-2 text-muted">{LEVEL_LABELS[r.level]}</td>
                  {SKILLS.map(skill => {
                    const rating = r.ratings[skill];
                    const pct = r.accuracy[skill] ?? 0;
                    const flag = r.flags[skill];
                    const band = rating ? bandFor(pct) : null;
                    const dots = band ? DOTS[band] : '';
                    return (
                      <td key={skill} className="py-2 pr-2 whitespace-nowrap">
                        {rating ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="tnum text-muted">{dots}</span>
                            <span className="font-semibold text-ink">{band}</span>
                            {flag === 'high' && (
                              <span className="rounded-md bg-amber-100 px-1 py-0.5 text-[9px] font-extrabold text-amber-700">high</span>
                            )}
                            {flag === 'low' && (
                              <span className="rounded-md bg-emerald-100 px-1 py-0.5 text-[9px] font-extrabold text-mint">low</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 pr-2 text-muted capitalize">{r.hardest ?? '—'}</td>
                  <td className="py-2 text-ink italic">{r.note ? `“${r.note}”` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Bands: Emerging &lt;50 · Developing 50–69 · Secure 70–84 · Strong ≥85. Flags: high = rated
          "Yes" while scoring under 50; low = rated "Not yet" while scoring over 70. Percentages stay
          in the CSV and the learner card.
        </p>
      </div>
    </div>
  );
}
