import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { units } from '../data/units';
import { Lock, Unlock, AlertTriangle, KeyRound, BarChart3, Presentation, Timer, ClipboardCheck, BarChart3 as ChartIcon, Download, Volume2, Award, Users } from 'lucide-react';
import { SKILL_LABELS, LEVEL_LABELS, SKILL_COLORS, type Level, type Skill, type LevelTiming, type SelfAssessmentRecord, type ProgressData } from '../types';
import { computeSkillAccuracy } from '../lib/skillAccuracy';
import { buildSelfCheckCsv, selfCheckFlag } from '../lib/selfCheckCsv';
import { VoicePicker } from '../components/VoicePicker';
import { loadAudioSettings, saveAudioSettings, onAudioSettingsChange } from '../lib/audio';
import { PacingExportTab } from '../components/teacher/PacingExportTab';
import { ClassOverview, LearnerCard } from '../components/teacher/ClassOverview';
import { SelfCheckTab as SelfCheckTabV2 } from '../components/teacher/SelfCheckTab';
import { CapstoneTab as CapstoneTabV2 } from '../components/teacher/CapstoneTab';
import {
  gateCodeMatches, setGateCode, unlockSession, touchSession, isSessionUnlocked,
  getTeacherName, setTeacherName, loadRoster, saveRoster, loadLinks, saveLink,
  normaliseName, proposeLinks, matchIdentity,
} from '../lib/teacherStore';
import { importFiles, clearAllImported, importedStoreCounts } from '../lib/teacherMerge';
import { buildTeacherDataset, loadSampleClassData, type TeacherDataset } from '../lib/teacherOverview';
import { mergedRows } from '../lib/pacingExport';

export function TeacherMode() {
  const { profile, progress, settings, updateSettings, resetProgress } = useProgress();
  const navigate = useNavigate();
  const [pinEntered, setPinEntered] = useState(isSessionUnlocked());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinChecking, setPinChecking] = useState(false);
  const [toggles, setToggles] = useState({
    unlockAllUnits: settings.teacherUnlockAllUnits ?? false,
    unlockChallenging: settings.teacherUnlockChallenging ?? false,
    lockToOneLevel: settings.teacherLockToOneLevel ?? false,
  });
  const [tab, setTab] = useState<'class' | 'levels' | 'pacing' | 'selfcheck' | 'audio' | 'capstone'>('class');
  // Front-page cards open a tab filtered to the learners they counted.
  const [learnerFilter, setLearnerFilter] = useState<string[] | null>(null);
  const [learnerCard, setLearnerCard] = useState<string | null>(null);
  // Re-read the imported stores whenever something changes them.
  const [refreshKey, setRefreshKey] = useState(0);
  // Last Teacher Mode visit — drives the quiet "lessons were timed" line.
  const [lastVisit, setLastVisit] = useState<number | null>(null);
  const dataset = useMemo(
    () => buildTeacherDataset(progress, profile?.name ?? 'Learner'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, profile?.name, refreshKey],
  );
  const teacherName = getTeacherName();
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [importReport, setImportReport] = useState<string | null>(null);
  const storeCounts = useMemo(() => { void refreshKey; return importedStoreCounts(); }, [refreshKey]);
  const handleImportFiles = async (files: FileList | null) => {
    const report = await importFiles(files);
    setImportReport(report.timingFiles + ' timing / ' + report.selfckFiles + ' self-check / ' + report.capstoneFiles + ' capstone files — ' + (report.timingRows + report.selfckRows + report.capstoneRows) + ' new records.');
    refresh();
  };

  // Part G — the session ends after 20 idle minutes; every click refreshes it.
  useEffect(() => {
    if (!pinEntered) return;
    const touch = () => touchSession();
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    return () => {
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
    };
  }, [pinEntered]);

  // The quiet line: timing rows newer than the last Teacher Mode visit.
  useEffect(() => {
    if (!pinEntered) return;
    try {
      const last = Number(sessionStorage.getItem('h2eq.teacher.lastVisit.v1') ?? 0);
      setLastVisit(last || null);
      sessionStorage.setItem('h2eq.teacher.lastVisit.v1', String(Date.now()));
    } catch { /* ignore */ }
  }, [pinEntered, refreshKey]);
  const timedInWindow = useMemo(() => {
    if (lastVisit === null) return 0;
    return mergedRows(progress, profile?.name ?? 'Learner').filter(r => r.startedAt > lastVisit).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, profile?.name, lastVisit, refreshKey]);

  // Toggles are real settings: they persist and every page reads them.
  const SETTING_KEYS = {
    unlockAllUnits: 'teacherUnlockAllUnits',
    unlockChallenging: 'teacherUnlockChallenging',
    lockToOneLevel: 'teacherLockToOneLevel',
  } as const;
  const handleToggle = (key: keyof typeof SETTING_KEYS, value: boolean) => {
    setToggles(prev => ({ ...prev, [key]: value }));
    updateSettings({ [SETTING_KEYS[key]]: value });
  };

  // Part G — the gate: hashed code + sessionStorage session. Migration: a
  // legacy plain-text settings.teacherPin is hashed into the gate on first
  // unlock, then cleared from settings.
  const handlePinSubmit = async () => {
    setPinChecking(true);
    try {
      let ok = await gateCodeMatches(pinInput);
      if (!ok && !localStorage.getItem('h2eq.teacher.gate.v1') && settings.teacherPin && pinInput === settings.teacherPin) {
        await setGateCode(settings.teacherPin); // migrate the legacy PIN once
        updateSettings({ teacherPin: '' });
        ok = true;
      }
      if (ok) {
        unlockSession();
        // Finish the migration: no plain-text code stays on the device.
        if (settings.teacherPin) updateSettings({ teacherPin: '' });
        setPinEntered(true);
        setPinError('');
      } else {
        setPinError('Incorrect code. Try again. (Default: teacher)');
      }
    } finally {
      setPinChecking(false);
    }
  };

  const openTab = (next: 'pacing' | 'selfcheck' | 'capstone', filter: string[] | null) => {
    setLearnerFilter(filter);
    setTab(next);
    setRefreshKey(k => k + 1);
  };
  const refresh = () => setRefreshKey(k => k + 1);

  if (!pinEntered) {
    return (
      <div className="mx-auto max-w-[440px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow mb-2 text-center">Restricted area</p>
        <h1 className="mb-6 text-center font-heading text-3xl font-extrabold text-ink">Teacher mode</h1>
        <div className="surface-card p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
              <KeyRound size={28} className="text-brand" />
            </div>
          </div>
          <label htmlFor="teacher-pin" className="mb-2 block text-center text-sm font-bold text-ink">
            Enter PIN to continue
          </label>
          <input
            id="teacher-pin"
            type="password"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            placeholder="PIN"
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            style={{ minHeight: 44 }}
            aria-describedby={pinError ? 'pin-error' : undefined}
          />
          {pinError && (
            <p id="pin-error" className="mt-2 text-sm text-coral text-center" role="alert">
              {pinError}
            </p>
          )}
          <button
            onClick={handlePinSubmit}
            className="action-primary mt-4 w-full"
            style={{ minHeight: 44 }}
          >
            Enter
          </button>
          <p className="text-xs text-muted text-center mt-3">
            Default PIN is "teacher". You can change it in Settings.
          </p>
        </div>
      </div>
    );
  }

  // Calculate per-level accuracy and weakest skill
  const levelStats: { level: Level; accuracy: number; weakestSkill: Skill | null; errors: { activityId: string; correctAnswer: string; rule: string }[] }[] = [];

  for (const level of ['easy', 'core', 'challenging'] as Level[]) {
    const lp = progress.units[1]?.[level];
    if (!lp) continue;

    let total = 0;
    let correct = 0;
    const skillErrors: Record<Skill, number> = {
      speaking: 0, vocabulary: 0, listening: 0, reading: 0, writing: 0, grammar: 0,
    };
    const allErrors: { activityId: string; correctAnswer: string; rule: string }[] = [];

    for (const [stationId, station] of Object.entries(lp.stations)) {
      for (const [activityId, isCorrect] of Object.entries(station.attempts)) {
        total++;
        if (isCorrect) correct++;
        else {
          const stationObj = units[0].stations.find(s => s.id === stationId);
          if (stationObj) {
            skillErrors[stationObj.skill]++;
          }
        }
      }
      allErrors.push(...station.errors);
    }

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const weakestSkill = (Object.entries(skillErrors) as [Skill, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    levelStats.push({ level, accuracy, weakestSkill, errors: allErrors });
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
          <BarChart3 size={20} className="text-brand" />
        </div>
        <div className="flex-1">
          <p className="eyebrow mb-0.5">Classroom tools</p>
          <h1 className="font-heading text-2xl font-extrabold text-ink">Teacher mode</h1>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-pill bg-slate-100 p-1 print:hidden">
          <button
            onClick={() => setTab('class')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'class' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'class'}
          >
            <ChartIcon size={14} /> Class
          </button>
          <button
            onClick={() => setTab('levels')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'levels' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'levels'}
          >
            <ChartIcon size={14} /> Overview
          </button>
          <button
            onClick={() => setTab('pacing')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'pacing' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'pacing'}
          >
            <Timer size={14} /> Pacing
          </button>
          <button
            onClick={() => setTab('selfcheck')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'selfcheck' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'selfcheck'}
          >
            <ClipboardCheck size={14} /> Self-check
          </button>
          <button
            onClick={() => setTab('audio')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'audio' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'audio'}
          >
            <Volume2 size={14} /> Audio
          </button>
          <button
            onClick={() => setTab('capstone')}
            className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold transition-colors ${tab === 'capstone' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            aria-pressed={tab === 'capstone'}
          >
            <Award size={14} /> Capstone
          </button>
        </div>
      </div>

      {/* FRONT PAGE (Part B) — above the tabs, always visible */}
      <ClassOverview dataset={dataset} onOpenTab={openTab} timingNewerThanLastVisit={timedInWindow} />

      {/* Identity status (Part C.4) — visible on every tab */}
      <div className="surface-card mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            {dataset.identity.total} learners · {dataset.identity.unmatched} name{dataset.identity.unmatched === 1 ? '' : 's'} not matched
            {importReport && <span className="ml-2 block w-full font-normal text-muted">{importReport}</span>}
            <span className="block w-full font-normal text-muted">
              imported: {storeCounts.timings} timings · {storeCounts.selfcheck} self-checks · {storeCounts.capstone} capstone
            </span>
          </p>
          <button onClick={refresh} className="action-secondary text-sm" style={{ minHeight: 44 }}>
            <Users size={15} /> Learners &amp; roster
          </button>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <input ref={importFileRef} type="file" accept=".csv,text/csv" multiple className="hidden" onChange={e => { void handleImportFiles(e.target.files); e.target.value = ''; }} />
            <button onClick={() => importFileRef.current?.click()} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              <Download size={15} /> Import CSVs
            </button>
            <button onClick={async () => { await loadSampleClassData(); refresh(); }} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Load sample class data
            </button>
            <button onClick={() => { if (confirm('Clear all imported and sample data? Local recordings are not touched.')) { clearAllImported(); refresh(); } }} className="action-secondary text-sm" style={{ minHeight: 44 }}>
              Clear imported data
            </button>
          </div>
        </div>
        {tab === 'class' && (
          <RosterPanel
            dataset={dataset}
            onLink={(raw, id) => { saveLink(raw, id); refresh(); }}
            onAdd={(name, cls) => { saveRoster([...loadRoster(), { id: normaliseName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''), name: name.trim(), class: cls, addedAt: Date.now() }]); refresh(); }}
            onRemove={id => { saveRoster(loadRoster().filter(r => r.id !== id)); refresh(); }}
            onOpenLearner={setLearnerCard}
          />
        )}
      </div>

      <div className="mt-4">
      {tab === 'pacing' && (
        <PacingExportTab progress={progress} learner={profile?.name ?? 'Learner'} resolveName={n => dataset.resolve(n).displayName} onOpenLearner={setLearnerCard} />
      )}
      {tab === 'selfcheck' && (
        <SelfCheckTabV2 dataset={dataset} flagOnlyDefault onOpenLearner={setLearnerCard} learnerFilter={learnerFilter} />
      )}
      {tab === 'audio' && <AudioTab />}
      {tab === 'capstone' && (
        <div className='space-y-4'>
          <ReleaseDetailsCard teacherName={teacherName} onSetName={setTeacherName} schoolName={settings.schoolName ?? ''} onSchoolName={v => updateSettings({ schoolName: v })} />
          <CapstoneTabV2
            dataset={dataset}
            teacherName={teacherName}
            onOpenLearner={setLearnerCard}
            onRelease={async (learner) => {
              await releaseMergedAttempt(learner, teacherName);
              refresh();
            }}
            onReturn={(learner, note) => { returnMergedAttempt(learner, note); refresh(); }}
            onChanged={refresh}
          />
        </div>
      )}
      {tab === 'levels' && (
        <>

      {/* Controls */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Classroom controls</h3>
        <div className="space-y-3">
          <ToggleRow
            label="Unlock all units"
            description="Make Units 3–9 openable for preview (they are coming-soon placeholders)"
            checked={toggles.unlockAllUnits}
            onChange={v => handleToggle('unlockAllUnits', v)}
            icon={Unlock}
          />
          <ToggleRow
            label="Unlock Challenging level"
            description="Remove the Core completion requirement"
            checked={toggles.unlockChallenging}
            onChange={v => handleToggle('unlockChallenging', v)}
            icon={Unlock}
          />
          <ToggleRow
            label="Lock students to one level"
            description="Prevent switching between Easy and Core"
            checked={toggles.lockToOneLevel}
            onChange={v => handleToggle('lockToOneLevel', v)}
            icon={Lock}
          />
        </div>
      </div>

      {/* Present mode */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Present mode</h3>
        <p className="text-sm text-muted mb-4">
          Show one activity per screen for the whole class — large text, answer options revealed
          with the number keys 1–4, and a big Next button. No XP, nothing is saved.
        </p>
        <button
          onClick={() => navigate('/teacher/present')}
          className="action-primary"
          style={{ minHeight: 44 }}
        >
          <Presentation size={18} /> Start presenting
        </button>
      </div>

      {/* Reset progress */}
      <div className="surface-card mb-4 border-red-200 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Danger zone</h3>
        <p className="text-sm text-muted mb-4">
          This will permanently delete all progress for the current student.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure? This will delete all progress and cannot be undone.')) {
              resetProgress();
            }
          }}
          className="action-accent"
          style={{ minHeight: 44 }}
        >
          <AlertTriangle size={18} /> Reset this student's progress
        </button>
      </div>
        </>
      )}
      </div>

      {/* Part F — the learner card, a drawer over whichever tab is active */}
      {learnerCard && (
        <LearnerCard
          dataset={dataset}
          learner={learnerCard}
          localLearner={profile?.name ?? 'Learner'}
          localProgress={progress}
          onClose={() => setLearnerCard(null)}
        />
      )}
    </div>
  );
}

// ── Identity: roster panel + unmatched linking (Part C) ───────────────────────

function RosterPanel({
  dataset, onLink, onAdd, onRemove, onOpenLearner,
}: {
  dataset: TeacherDataset;
  onLink: (rawName: string, rosterId: string) => void;
  onAdd: (name: string, cls: string) => void;
  onRemove: (id: string) => void;
  onOpenLearner: (name: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');

  // Unmatched raw names across both record types, with proposals.
  const rawNames = new Set<string>([...dataset.selfck.map(r => r.learner), ...dataset.attempts.map(a => a.learner)]);
  const unmatched = [...rawNames]
    .filter(n => !matchIdentity(n, dataset.roster, loadLinks()).entry)
    .map(name => ({
      name,
      count: dataset.selfck.filter(r => r.learner === name).length + dataset.attempts.filter(a => a.learner === name).length,
      proposals: proposeLinks(name, dataset.roster).slice(0, 3),
    }));

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Unmatched names + one-click links */}
        <div>
          <p className="eyebrow mb-2">Not matched ({unmatched.length})</p>
          {unmatched.length === 0 ? (
            <p className="text-xs text-muted">Every name resolves to the roster.</p>
          ) : (
            <div className="space-y-2">
              {unmatched.map(u => (
                <div key={u.name} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-bold text-ink">“{u.name}” · {u.count} record{u.count === 1 ? '' : 's'}</p>
                  {u.proposals.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {u.proposals.map(p => (
                        <button
                          key={p.id}
                          onClick={() => onLink(u.name, p.id)}
                          className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-[11px] font-bold text-brand hover:bg-teal-50"
                          style={{ minHeight: 36 }}
                        >
                          Link to {p.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted">No near-match found — add her to the roster below.</p>
                  )}
                  <button onClick={() => onOpenLearner(u.name)} className="mt-1 text-[11px] font-bold text-brand underline">
                    Open learner card
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The roster itself */}
        <div>
          <p className="eyebrow mb-2">Roster ({dataset.roster.length})</p>
          <div className="mb-2 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Learner name"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
              style={{ minHeight: 40 }}
              aria-label="New roster learner name"
            />
            <input
              type="text"
              value={newClass}
              onChange={e => setNewClass(e.target.value)}
              placeholder="Class"
              className="w-16 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
              style={{ minHeight: 40 }}
              aria-label="New roster learner class"
            />
            <button
              onClick={() => { if (newName.trim().length >= 2) { onAdd(newName.trim(), newClass.trim()); setNewName(''); setNewClass(''); } }}
              className="action-secondary text-xs"
              style={{ minHeight: 40 }}
            >
              Add
            </button>
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {dataset.roster.map(entry => (
              <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                <p className="text-xs text-ink">
                  {entry.name}
                  {entry.class && <span className="ml-1 text-muted">· {entry.class}</span>}
                  {entry.sample && <span className="ml-1 rounded bg-slate-100 px-1 text-[9px] font-bold text-slate-500">SAMPLE</span>}
                </p>
                <button onClick={() => onRemove(entry.id)} className="text-[10px] text-muted hover:text-coral" aria-label={`Remove ${entry.name} from the roster`}>
                  remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Release details + the merged-release/return bridge ────────────────────────

function ReleaseDetailsCard({
  teacherName, onSetName, schoolName, onSchoolName,
}: {
  teacherName: string;
  onSetName: (v: string) => void;
  schoolName: string;
  onSchoolName: (v: string) => void;
}) {
  return (
    <div className="surface-card p-5 sm:p-6">
      <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Release details</h3>
      <p className="mb-3 text-xs leading-5 text-muted">
        Every certificate release records your name — no name, no release. The school name prints
        on the certificate.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="tm-teacher-name">Your name</label>
          <input
            id="tm-teacher-name"
            type="text"
            value={teacherName}
            onChange={e => onSetName(e.target.value)}
            placeholder="Teacher name"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
            style={{ minHeight: 44 }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="tm-school-name">School name</label>
          <input
            id="tm-school-name"
            type="text"
            value={schoolName}
            onChange={e => onSchoolName(e.target.value)}
            placeholder="Hangout 2 — English Quest"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
            style={{ minHeight: 44 }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Release / return against the MERGED attempt set. A local attempt releases
 * through lib/capstone (Phase 9 machinery, certificate id deterministic); an
 * imported attempt releases in the imported store with the same rules. There
 * is no self-service bypass: these functions are only reachable from the
 * teacher session.
 */
async function releaseMergedAttempt(learner: string, teacherName: string): Promise<void> {
  const { releaseAttempt } = await import('../lib/capstone');
  const released = await releaseAttempt(learner, teacherName);
  if (released) return;
  // Not a local attempt — release in the imported store with the same rules.
  const raw = localStorage.getItem('h2eq.capstone.imported.v1');
  if (!raw) return;
  const rows = JSON.parse(raw) as Array<any>;
  const attempt = rows.find(a => a.learner === learner && a.outcome === 'pending');
  if (!attempt) return;
  const { verificationCode } = await import('../lib/capstone');
  const issuedAt = Date.now();
  const id = await verificationCode(learner, issuedAt, attempt.overall ?? 0);
  attempt.outcome = 'issued';
  attempt.issuedAt = issuedAt;
  attempt.releasedBy = teacherName || 'teacher';
  attempt.certificateId = id;
  localStorage.setItem('h2eq.capstone.imported.v1', JSON.stringify(rows));
}

async function returnMergedAttempt(learner: string, note: string): Promise<void> {
  const { returnAttempt } = await import('../lib/capstone');
  if (returnAttempt(learner, note)) return;
  const raw = localStorage.getItem('h2eq.capstone.imported.v1');
  if (!raw) return;
  const rows = JSON.parse(raw) as Array<any>;
  const attempt = rows.find(a => a.learner === learner && a.outcome === 'pending');
  if (!attempt) return;
  attempt.outcome = 'not_issued';
  attempt.retakeNote = note.trim();
  localStorage.setItem('h2eq.capstone.imported.v1', JSON.stringify(rows));
}

/**
 * PACING TAB — timing telemetry per unit and level (localStorage only).
 * Median total minutes, median seconds per station, the two fastest stations
 * (the ones to deepen), and the attempts flagged fast_completion.
 */
interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

function ToggleRow({ label, description, checked, onChange, icon: Icon }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? 'bg-emerald-50' : 'bg-slate-200/60'}`}>
          <Icon size={18} className={checked ? 'text-mint' : 'text-muted'} />
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-mint' : 'bg-slate-300'}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        style={{ minWidth: 44 }}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

/**
 * SELF-CHECK TAB — the prediction-vs-work report. One row per skill per
 * self-assessment record: the learner's rating (dots) beside their actual
 * accuracy, a flag column (high/low), the hardest choice and the note as
 * written. Plain table, no charts library.
 */
const SELF_CHECK_SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'];

function RatingDots({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" role="img" aria-label={`${rating} of 3`}>
      {[1, 2, 3].map(d => (
        <span key={d} className={`h-2.5 w-2.5 rounded-full ${d <= rating ? 'bg-brand' : 'bg-slate-300'}`} aria-hidden />
      ))}
    </span>
  );
}

function SelfCheckTab({ progress }: { progress: ProgressData }) {
  const learnerName = 'this learner';
  const resolveSkill = (unitId: number, stationId: string): Skill | undefined =>
    units.find(u => u.id === unitId)?.stations.find(s => s.id === stationId)?.skill;

  const records = Object.entries(progress.selfAssessments ?? {})
    .map(([key, record]) => ({ key, record }))
    .sort((a, b) => a.record.completedAt - b.record.completedAt);

  const isOver = (r: SelfAssessmentRecord): boolean =>
    !r.skipped && SELF_CHECK_SKILLS.some(skill => {
      const pct = computeSkillAccuracy(units.find(u => u.id === r.unit)!, r.level, progress)[skill].pct;
      return r.ratings[skill] === 3 && pct < 50;
    });
  const isUnder = (r: SelfAssessmentRecord): boolean =>
    !r.skipped && SELF_CHECK_SKILLS.some(skill => {
      const pct = computeSkillAccuracy(units.find(u => u.id === r.unit)!, r.level, progress)[skill].pct;
      return r.ratings[skill] === 1 && pct >= 70;
    });

  const overCount = records.filter(({ record }) => isOver(record)).length;
  const underCount = records.filter(({ record }) => isUnder(record)).length;

  const downloadCsv = () => {
    const csv = buildSelfCheckCsv(progress, 'learner', resolveSkill);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'self-check.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (records.length === 0) {
    return (
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Self-check</h3>
        <p className="text-sm text-muted">
          No self-assessments yet. Learners rate themselves after each level's BOSS, before they see
          their score — that is what makes the rating a prediction worth comparing.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card mb-4 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-extrabold text-ink">Self-check</h3>
        <button onClick={downloadCsv} className="action-secondary text-sm" style={{ minHeight: 40 }}>
          <Download size={15} className="inline" /> Export CSV
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="tnum font-heading text-2xl font-extrabold text-ink">{overCount}</p>
          <p className="text-xs font-semibold text-muted">rated themselves higher than their work, in at least one skill</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="tnum font-heading text-2xl font-extrabold text-ink">{underCount}</p>
          <p className="text-xs font-semibold text-muted">rated themselves lower than their work, in at least one skill</p>
        </div>
      </div>

      <div className="space-y-5">
        {records.map(({ key, record }) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-heading font-extrabold text-ink">
                Unit {record.unit} · {LEVEL_LABELS[record.level]}
              </p>
              <p className="text-xs font-semibold text-muted">
                {record.skipped
                  ? 'Skipped'
                  : `Completed ${new Date(record.completedAt).toLocaleDateString()}`}
              </p>
            </div>
            {record.skipped ? (
              <p className="text-sm text-muted">This attempt skipped the self-check.</p>
            ) : (
              <>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-muted">
                      <th className="pb-2 pr-2 font-bold">Skill</th>
                      <th className="pb-2 pr-2 font-bold">Self rating</th>
                      <th className="pb-2 pr-2 font-bold tnum">Accuracy</th>
                      <th className="pb-2 font-bold">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SELF_CHECK_SKILLS.map(skill => {
                      const rating = record.ratings[skill];
                      const unitObj = units.find(u => u.id === record.unit);
                      const pct = unitObj
                        ? computeSkillAccuracy(unitObj, record.level, progress)[skill].pct
                        : 0;
                      const flag = selfCheckFlag(rating, pct);
                      return (
                        <tr key={skill} className="border-t border-slate-200">
                          <td className="py-2 pr-2 font-semibold text-ink">{SKILL_LABELS[skill]}</td>
                          <td className="py-2 pr-2">{rating ? <RatingDots rating={rating} /> : <span className="text-muted">—</span>}</td>
                          <td className="py-2 pr-2 tnum text-ink">{pct}%</td>
                          <td className="py-2">
                            {flag === 'high' && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">high</span>}
                            {flag === 'low' && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">low</span>}
                            {flag === '' && <span className="text-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-sm text-muted">
                  Hardest today: <span className="font-semibold text-ink">{record.hardest ? SKILL_LABELS[record.hardest] : '—'}</span>
                  {record.note && (
                    <>
                      {' '}· Note: <span className="italic text-ink">“{record.note}”</span>
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * F8 — the teacher picks the class voice here and can lock it. When locked,
 * the learner-facing pickers (Settings, station launcher) go read-only, so a
 * room of devices can't each drift to a different voice mid-lesson.
 */
function AudioTab() {
  const [audio, setAudio] = useState(() => loadAudioSettings());

  // The picker in this tab saves through the same settings object.
  useEffect(() => onAudioSettingsChange(() => setAudio({ ...loadAudioSettings() })), []);

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Class voice</h3>
        <p className="mb-4 text-xs leading-5 text-muted">
          Lessons read aloud with a voice the browser already has — nothing to install. Choose the
          one your class hears best.
        </p>
        <VoicePicker />
      </div>

      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${audio.voiceLocked ? 'bg-orange-50' : 'bg-emerald-50'}`}>
              <Volume2 size={18} className={audio.voiceLocked ? 'text-coral' : 'text-mint'} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Lock voice for this class</p>
              <p className="text-xs text-muted">
                {audio.voiceLocked
                  ? 'Learners see the voice picker read-only.'
                  : 'Learners can change the voice in Settings.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => saveAudioSettings({ voiceLocked: !audio.voiceLocked })}
            className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${audio.voiceLocked ? 'bg-coral' : 'bg-slate-300'}`}
            role="switch"
            aria-checked={audio.voiceLocked}
            aria-label="Lock voice for this class"
            style={{ minWidth: 44 }}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                audio.voiceLocked ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
