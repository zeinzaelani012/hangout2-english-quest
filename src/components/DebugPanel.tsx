import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { units } from '../data/units';
import { ACTIVITY_COUNTS, LEVEL_LABELS, SKILL_LABELS, type Level, type Skill } from '../types';
import { auditLevelPacing, formatPacingReport, isInstrumentedUnit } from '../lib/pacingAudit';

const SKILL_ORDER: Skill[] = ['speaking', 'vocabulary', 'listening', 'reading', 'writing', 'grammar'];
const EXPECTED_TOTAL = 20;
const EXPECTED_XP = 100;

interface LevelReport {
  level: Level;
  total: number;
  xp: number;
  ok: boolean;
  boss: number;
  perSkill: { skill: Skill; expected: number; actual: number; xpEach: number }[];
}

type Tab = 'weighting' | 'pacing';

/**
 * Dev-only audits, shown when the URL contains ?debug=1.
 * Weighting tab: legacy 20-activity / 100-XP split per station.
 * Pacing tab: the expanded pack's pacing rules (counts, minutes, skill
 * shares, XP, depth moves) per level, with a copy-report button.
 */
export function DebugPanel() {
  const location = useLocation();
  const enabled = new URLSearchParams(location.search).get('debug') === '1';
  const [tab, setTab] = useState<Tab>('weighting');
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    return units
      .filter(u => u.status === 'playable')
      .map(unit => ({
        unit,
        levels: (['easy', 'core', 'challenging'] as Level[]).map((level): LevelReport => {
          const acts = unit.levels[level];
          const perSkill = SKILL_ORDER.map(skill => ({
            skill,
            expected: ACTIVITY_COUNTS[skill],
            actual: acts.filter(a => a.skill === skill).length,
            xpEach: acts.find(a => a.skill === skill)?.xp ?? 0,
          }));
          const total = acts.length;
          const xp = acts.reduce((sum, a) => sum + a.xp, 0);
          const ok =
            total === EXPECTED_TOTAL &&
            xp === EXPECTED_XP &&
            perSkill.every(p => p.actual === p.expected);
          return { level, total, xp, ok, boss: unit.bossActivities?.[level]?.length ?? 0, perSkill };
        }),
      }));
  }, []);

  const pacingLevels: Level[] = ['easy', 'core', 'challenging'];
  const pacingReport = useMemo(() => {
    return units
      .filter(u => u.status === 'playable')
      .map(unit => ({ unit, instrumented: isInstrumentedUnit(unit) }));
  }, []);
  const instrumentedUnits = pacingReport.filter(u => u.instrumented);

  if (!enabled) return null;

  const copyReport = () => {
    const text = instrumentedUnits
      .map(({ unit }) => formatPacingReport(unit, pacingLevels))
      .join('\n\n———\n\n');
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {
        // Clipboard blocked — select-and-copy fallback
        window.prompt('Copy the pacing report:', text);
      },
    );
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-card bg-ink text-white shadow-2xl p-4 text-xs"
      role="status"
      aria-label="Debug panel"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('weighting')}
            className={`rounded-pill px-2.5 py-1 font-medium ${tab === 'weighting' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
          >
            Weighting
          </button>
          <button
            onClick={() => setTab('pacing')}
            className={`rounded-pill px-2.5 py-1 font-medium ${tab === 'pacing' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
          >
            Pacing
          </button>
        </div>
        <span className="text-white/50 tnum">?debug=1</span>
      </div>

      {tab === 'weighting' && (
        <div className="space-y-3">
          {report.map(({ unit, levels }) => (
            <div key={unit.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
              <p className="font-medium mb-1.5 text-white/80">
                Unit {unit.id}: {unit.title}
              </p>
              {levels.map(({ level, total, xp, ok, boss, perSkill }) => (
                <div key={level} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{LEVEL_LABELS[level]}</span>
                    <span className="tnum">
                      {total} activities · {xp} XP
                      <span className={`ml-1.5 font-bold ${ok ? 'text-mint' : 'text-coral'}`}>
                        {ok ? 'PASS' : 'FAIL'}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {perSkill.map(({ skill, expected, actual, xpEach }) => (
                      <span
                        key={skill}
                        className={`px-1.5 py-0.5 rounded-pill tnum ${
                          actual === expected ? 'bg-mint/20 text-mint' : 'bg-coral/25 text-coral font-bold'
                        }`}
                        title={`${xpEach} XP each`}
                      >
                        {SKILL_LABELS[skill]} {actual}/{expected}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-white/40 tnum">boss station: {boss} activities (excluded)</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'pacing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60">
              {instrumentedUnits.length === 0 ? 'No instrumented unit found' : 'Expanded pack rules per level'}
            </span>
            {instrumentedUnits.length > 0 && (
              <button
                onClick={copyReport}
                className="flex items-center gap-1.5 rounded-pill bg-white/10 px-2.5 py-1 font-medium text-white/80 hover:bg-white/20"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy report'}
              </button>
            )}
          </div>
          {pacingReport.map(({ unit, instrumented }) => (
            <div key={unit.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
              <p className="font-medium mb-1.5 text-white/80">
                Unit {unit.id}: {unit.title}
              </p>
              {!instrumented ? (
                <p className="text-white/40">Legacy pack — pacing not instrumented.</p>
              ) : (
                pacingLevels.map(level => {
                  const rows = auditLevelPacing(unit, level);
                  const allPass = rows.every(r => r.pass);
                  return (
                    <div key={level} className="mb-2.5 last:mb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{LEVEL_LABELS[level]}</span>
                        <span className={`font-bold ${allPass ? 'text-mint' : 'text-coral'}`}>
                          {allPass ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {rows.map(row => (
                          <p key={row.label} className={row.pass ? 'text-white/50' : 'font-bold text-coral'}>
                            {row.pass ? '·' : '✗'} {row.label}: <span className="tnum">{row.detail}</span>
                            {row.offending?.length ? <span className="block pl-3 text-coral/80">[{row.offending.join(', ')}]</span> : null}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
