import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Award, CheckCircle2, ChevronRight, Circle, Flag, Lock, Play } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { getUnit, getUnitRitual } from '../data/units';
import { StationBadge } from '../components/Illustrations';
import { MissionBrief } from '../components/ritual/MissionBrief';
import { durationLabel } from '../lib/pacing';
import { LEVEL_LABELS, SKILL_LABELS, type Level, type Station } from '../types';

type MapNode =
  | { kind: 'station'; station: Station; registryIndex: number }
  | { kind: 'checkpoint'; xp: number };

export function QuestMap() {
  const { unitId, level } = useParams();
  const navigate = useNavigate();
  const { isStationCompleted, markMissionBriefSeen, getLevelProgress, settings } = useProgress();
  const [briefDismissed, setBriefDismissed] = useState(false);
  const unit = getUnit(parseInt(unitId || '0'));
  const levelKey = (level || 'easy') as Level;

  if (!unit || unit.status === 'placeholder') {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Unit not available</h1>
        <Link to="/" className="mt-4 inline-block font-bold text-brand">Back to dashboard</Link>
      </div>
    );
  }

  const ritual = getUnitRitual(unit.id);
  const missionBrief = ritual?.missionBrief?.content;
  const missionBriefSeen = getLevelProgress(unit.id, levelKey)?.missionBriefSeen ?? false;

  // Ritual: MISSION_BRIEF — once at level start, before station 1.
  const showMissionBrief = !!missionBrief && !missionBriefSeen && !briefDismissed;

  // Route nodes: the CP1 milestone sits between Grammar and Listening.
  const checkpointActivity = unit.bossActivities?.[levelKey]?.find(a => a.type === 'checkpoint');
  const nodes: MapNode[] = [];
  unit.stations.forEach((station, i) => {
    nodes.push({ kind: 'station', station, registryIndex: i });
    if (station.skill === 'grammar' && checkpointActivity) {
      nodes.push({ kind: 'checkpoint', xp: checkpointActivity.xp || 0 });
    }
  });

  const nodeDone = (node: MapNode) =>
    isStationCompleted(unit.id, levelKey, node.kind === 'station' ? node.station.id : 'checkpoint');
  const firstIncomplete = nodes.findIndex(n => !nodeDone(n));
  const nodeStates = nodes.map((node, i) => {
    const completed = nodeDone(node);
    const previousNode = i > 0 ? nodes[i - 1] : null;
    const previousCompleted = !previousNode || nodeDone(previousNode);
    const current = !completed && previousCompleted && i === firstIncomplete;
    // Teacher Mode "Unlock all units" opens every station, not just units.
    const locked =
      !completed && !previousCompleted && !current && !settings.teacherUnlockAllUnits;
    return { node, completed, current, locked, i };
  });
  const completedCount = nodeStates.filter(n => n.completed).length;
  const percent = Math.round((completedCount / nodes.length) * 100);

  // Calibrated duration — empty string for legacy packs, so no label renders.
  const duration = durationLabel(
    [...unit.levels[levelKey], ...(unit.bossActivities?.[levelKey] ?? [])],
    levelKey,
  );

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="font-semibold hover:text-brand">Dashboard</Link>
        <ChevronRight size={14} />
        <Link to={`/unit/${unit.id}`} className="font-semibold hover:text-brand">Unit {unit.id}</Link>
        <ChevronRight size={14} />
        <span className="font-semibold text-ink">{LEVEL_LABELS[levelKey]}</span>
      </nav>

      <section className="surface-card mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-1">Unit {unit.id} learning path</p>
            <h1 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">{unit.islandName}</h1>
            <p className="mt-1 text-sm font-semibold text-muted">
              {LEVEL_LABELS[levelKey]} · {unit.stations.length} stations{duration ? ` · ${duration}` : ''}
            </p>
          </div>
          <div className="min-w-52 sm:text-right">
            <p className="mb-2 text-sm font-bold text-ink"><span className="tnum">{percent}%</span> complete</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="stations-heading">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-1">Your route</p>
            <h2 id="stations-heading" className="font-heading text-xl font-extrabold text-ink">Complete stations in order</h2>
          </div>
          <span className="text-sm font-semibold text-muted">{completedCount} of {nodes.length} done</span>
        </div>

        <div className="relative space-y-3 before:absolute before:bottom-8 before:left-[31px] before:top-8 before:w-px before:bg-slate-200 sm:before:left-[35px]">
          {nodeStates.map(({ node, completed, current, locked, i }) =>
            node.kind === 'checkpoint' ? (
              /* CHECKPOINT 1 — milestone node between Grammar and Listening */
              <button
                key="checkpoint"
                onClick={() => !locked && navigate(`/unit/${unit.id}/${levelKey}/checkpoint`)}
                disabled={locked}
                className={`relative flex w-full items-center gap-4 rounded-card border-2 border-dashed p-4 text-left transition-all sm:p-5 ${
                  locked
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : current
                      ? 'border-brand/50 bg-teal-50/30 ring-2 ring-brand/10 hover:shadow-cardhover'
                      : completed
                        ? 'border-emerald-300 bg-teal-50/40 hover:shadow-cardhover'
                        : 'border-brand/30 bg-white hover:shadow-cardhover'
                }`}
                aria-label={`Halfway Checkpoint milestone. Quick mixed review. ${completed ? 'Completed — badge earned.' : current ? 'Current milestone.' : locked ? 'Locked.' : 'Available.'}`}
              >
                <div className={`relative z-10 flex h-13 w-13 shrink-0 items-center justify-center rounded-xl ${completed ? 'bg-mint text-white' : 'bg-white text-brand ring-1 ring-brand/20'}`} style={{ width: 52, height: 52 }}>
                  {completed ? <Award size={26} /> : <Flag size={24} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-brand">Milestone</span>
                    {current && <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-brand">NEXT</span>}
                    {completed && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-mint">BADGE EARNED</span>}
                  </div>
                  <h3 className={`font-heading text-base font-extrabold sm:text-lg ${locked ? 'text-slate-500' : 'text-ink'}`}>Halfway Checkpoint</h3>
                  <p className="mt-1 text-sm text-muted">Quick mixed review — not a full station. Earn its badge.</p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs font-bold text-muted">Mixed skills</p>
                  <p className="mt-1 text-sm font-extrabold text-ink">{node.xp} XP</p>
                </div>

                {!locked && <ChevronRight size={20} className={current ? 'text-brand' : 'text-slate-400'} />}
              </button>
            ) : (
              <button
                key={node.station.id}
                onClick={() => !locked && navigate(`/unit/${unit.id}/${levelKey}/${node.station.id}`)}
                disabled={locked}
                className={`relative flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all sm:p-5 ${
                  locked
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : current
                      ? 'border-brand/40 bg-white shadow-card ring-2 ring-brand/10 hover:shadow-cardhover'
                      : completed
                        ? 'border-emerald-200 bg-white shadow-card hover:border-emerald-300 hover:shadow-cardhover'
                        : 'border-slate-200 bg-white shadow-card hover:shadow-cardhover'
                }`}
                aria-label={`${node.station.name}. ${node.station.description}. ${completed ? 'Completed.' : current ? 'Current station.' : locked ? 'Locked.' : 'Available.'}`}
              >
                <div className="relative z-10 shrink-0 rounded-xl bg-white">
                  <StationBadge skill={node.station.id === 'boss' ? 'boss' : node.station.skill} size={52} />
                  <span className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${completed ? 'bg-mint text-white' : current ? 'bg-brand text-white' : locked ? 'bg-slate-300 text-white' : 'bg-white text-slate-300'}`}>
                    {completed ? <CheckCircle2 size={13} /> : current ? <Play size={11} /> : locked ? <Lock size={11} /> : <Circle size={11} />}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold uppercase text-muted">Station {node.registryIndex + 1}</span>
                    {current && <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-brand">NEXT</span>}
                    {completed && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-mint">DONE</span>}
                  </div>
                  <h3 className={`font-heading text-base font-extrabold sm:text-lg ${locked ? 'text-slate-500' : 'text-ink'}`}>{node.station.name}</h3>
                  <p className="mt-1 text-sm text-muted">{node.station.description}</p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs font-bold text-muted">{node.station.id === 'boss' ? 'Mixed skills' : SKILL_LABELS[node.station.skill]}</p>
                  <p className="mt-1 text-sm font-extrabold text-ink">{node.station.id === 'boss' ? 'Checkpoint' : `${getStationXP(node.station.skill)} XP`}</p>
                </div>

                {!locked && <ChevronRight size={20} className={current ? 'text-brand' : 'text-slate-400'} />}
              </button>
            )
          )}
        </div>
      </section>

      {/* Ritual: MISSION_BRIEF — shown once at level start */}
      {showMissionBrief && missionBrief && (
        <MissionBrief
          content={missionBrief}
          unitTitle={unit.title}
          levelLabel={LEVEL_LABELS[levelKey]}
          onContinue={() => {
            setBriefDismissed(true);
            markMissionBriefSeen(unit.id, levelKey);
          }}
        />
      )}
    </div>
  );
}

function getStationXP(skill: string): number {
  const weights: Record<string, number> = {
    speaking: 25, vocabulary: 25, listening: 10, reading: 15, writing: 10, grammar: 15,
  };
  return weights[skill] || 0;
}
