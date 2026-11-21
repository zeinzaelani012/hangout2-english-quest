import { useMemo, useRef, useState } from 'react';
import { Download, ClipboardPaste, FileUp, Trash2, Search } from 'lucide-react';
import type { ProgressData } from '../../types';
import {
  clearImportedRows, csvToRows, loadSampleData, loadImportedStore, mergeImportedRows,
  mergedRows, rowsToCsv, rowsToTsv, summarise, type TimingRow,
} from '../../lib/pacingExport';
import { STATION_ORDER } from '../../lib/pacingExport';

const LEVEL_LABELS: Record<string, string> = { easy: 'Easy', core: 'Core', challenging: 'Challenging' };
const STATION_HEADS: Record<string, string> = {
  vocabulary: 'Vocab', grammar: 'Gram', listening: 'Listen', reading: 'Read',
  writing: 'Write', speaking: 'Speak', checkpoint: 'CP1', boss: 'Boss',
};

const todayStamp = (): string => new Date().toISOString().slice(0, 10);

function downloadText(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * PHASE 11a — the Pacing export tab. Reads every LevelTiming on this device,
 * merges imported CSV rows, computes the calibration against the RAW
 * projection (never the label), and exports the whole thing as CSV.
 */
export function PacingExportTab({ progress, learner, resolveName, onOpenLearner }: { progress: ProgressData; learner: string; resolveName?: (raw: string) => string; onOpenLearner?: (name: string) => void }) {
  const [showTestRuns, setShowTestRuns] = useState(false);
  const [search, setSearch] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importNote, setImportNote] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<Array<{ line: number; reason: string }>>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  void refreshKey; // imported-store writes re-read on every render

  const allRows = useMemo(
    () => mergedRows(progress, learner),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, learner, refreshKey],
  );
  const rows = allRows.filter(r => showTestRuns || !r.isTestRun)
    .filter(r => search.trim() === '' || r.learner.toLowerCase().includes(search.trim().toLowerCase()));
  const summary = useMemo(
    () => summarise(allRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRows],
  );
  // Merged counts per (unit, level) — the teacher's at-a-glance sample size.
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of allRows.filter(r => !r.isTestRun)) {
      const key = `U${r.unit} · ${LEVEL_LABELS[r.level]}`;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allRows]);

  const refresh = () => setRefreshKey(k => k + 1);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let added = 0;
    let duplicates = 0;
    const errors: Array<{ line: number; reason: string }> = [];
    for (const file of Array.from(files)) {
      const text = await file.text();
      const result = csvToRows(text, file.name);
      errors.push(...result.errors.map(e => ({ ...e, line: e.line })));
      const merge = mergeImportedRows(result.imported);
      added += merge.added;
      duplicates += merge.duplicates;
    }
    setImportErrors(errors);
    setImportNote(`${added} new row${added === 1 ? '' : 's'} imported, ${duplicates} already present.`);
    refresh();
  };

  const handlePaste = () => {
    const result = csvToRows(pasteText, 'pasted');
    const merge = mergeImportedRows(result.imported);
    setImportErrors(result.errors);
    setImportNote(`${merge.added} new row${merge.added === 1 ? '' : 's'} imported, ${merge.duplicates} already present.`);
    setPasteText('');
    setPasteOpen(false);
    refresh();
  };

  const exportCsv = () => {
    downloadText(`hangout2-pacing-${todayStamp()}.csv`, rowsToCsv(allRows, summary), 'text/csv');
  };
  const copyTable = async () => {
    try {
      await navigator.clipboard.writeText(rowsToTsv(allRows, summary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const loadSample = () => {
    loadSampleData();
    setImportNote('Sample data loaded — 11 rows, marked as sample and clearable.');
    refresh();
  };
  const clearImported = () => {
    if (confirm('Clear all imported and sample data? This device\'s own recordings are not touched.')) {
      clearImportedRows();
      setImportNote('Imported and sample data cleared.');
      refresh();
    }
  };

  const importedCount = loadImportedStore().rows.length;

  if (allRows.length === 0) {
    return (
      <div className="mx-auto max-w-[720px]">
        <div className="surface-card mb-4 p-5 sm:p-6">
          <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Pacing</h3>
          <p className="text-sm text-muted">
            No lesson timings yet. Run a level to the end and it will appear here.
          </p>
          <button onClick={loadSample} className="action-primary mt-4 text-sm" style={{ minHeight: 44 }}>
            Load sample data
          </button>
          <p className="mt-2 text-xs text-muted">
            The sample is synthetic Unit 1 pilot data — marked, and cleared with "Clear imported data".
          </p>
        </div>
        <ImportCard
          pasteOpen={pasteOpen} setPasteOpen={setPasteOpen} pasteText={pasteText} setPasteText={setPasteText}
          onPaste={handlePaste} onFiles={handleFiles} fileRef={fileRef}
          note={importNote} errors={importErrors} importedCount={importedCount}
          onClear={clearImported}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary block */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-extrabold text-ink">Calibration summary</h3>
          <span className="text-xs font-semibold text-muted">
            {summary.cleanCount} clean · {summary.testCount} test runs{summary.testCount > 0 ? ' (excluded)' : ''}
          </span>
        </div>
        <p className="mb-4 text-xs leading-5 text-muted">
          Ratio = measured ÷ raw projection (never the current label). Fitted k = least squares
          through the origin. The constant is never changed automatically — a human edits the code.
        </p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-muted">
              <th className="pb-2 pr-3 font-bold">Level</th>
              <th className="pb-2 pr-3 font-bold tnum">n</th>
              <th className="pb-2 pr-3 font-bold tnum">Median min</th>
              <th className="pb-2 pr-3 font-bold tnum">Raw proj.</th>
              <th className="pb-2 pr-3 font-bold tnum">Ratio</th>
              <th className="pb-2 pr-3 font-bold">Fastest stations</th>
              <th className="pb-2 font-bold tnum">Fast flag</th>
            </tr>
          </thead>
          <tbody>
            {summary.levels.map(s => (
              <tr key={s.level} className="border-t border-slate-200">
                <td className="py-2 pr-3 font-bold text-ink">{LEVEL_LABELS[s.level]}</td>
                <td className="py-2 pr-3 tnum text-muted">{s.n}</td>
                <td className="py-2 pr-3 tnum text-ink">{s.medianMinutes.toFixed(1)}</td>
                <td className="py-2 pr-3 tnum text-ink">{s.rawProjected.toFixed(1)}</td>
                <td className="py-2 pr-3 tnum font-bold text-ink">{s.ratio.toFixed(3)}</td>
                <td className="py-2 pr-3 text-xs text-muted">{s.stationFastest.join(', ')}</td>
                <td className="py-2 tnum text-muted">{s.fastCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 rounded-xl border border-brand/30 bg-teal-50/60 p-4">
          <p className="text-sm font-bold text-ink">
            Fitted k = <span className="tnum">{summary.fittedK.toFixed(3)}</span>
          </p>
          <p className="mt-1 text-sm text-ink">{summary.verdict}</p>
        </div>

        {/* Merged counts per (unit, level) */}
        {counts.length > 0 && (
          <p className="mt-3 text-xs font-semibold text-muted">
            Sample per level: {counts.map(([k, v]) => `${k} ×${v}`).join(' · ')}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportCsv} className="action-primary text-sm" style={{ minHeight: 44 }}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={copyTable} className="action-secondary text-sm" style={{ minHeight: 44 }}>
            <ClipboardPaste size={15} /> {copied ? 'Copied!' : 'Copy as table'}
          </button>
        </div>
      </div>

      {/* Import */}
      <ImportCard
        pasteOpen={pasteOpen} setPasteOpen={setPasteOpen} pasteText={pasteText} setPasteText={setPasteText}
        onPaste={handlePaste} onFiles={handleFiles} fileRef={fileRef}
        note={importNote} errors={importErrors} importedCount={importedCount}
        onClear={clearImported}
      />

      {/* Table controls */}
      <div className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-extrabold text-ink">Lesson timings ({rows.length})</h3>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Search size={14} className="text-muted" aria-hidden />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by learner…"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
                style={{ minHeight: 40, width: 180 }}
                aria-label="Filter timings by learner name"
              />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={showTestRuns}
                onChange={e => setShowTestRuns(e.target.checked)}
                className="h-4 w-4 accent-teal-700"
              />
              Show test runs
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase text-muted">
                <th className="pb-2 pr-2 font-bold">Learner</th>
                <th className="pb-2 pr-2 font-bold">Unit</th>
                <th className="pb-2 pr-2 font-bold">Level</th>
                <th className="pb-2 pr-2 font-bold">Date</th>
                <th className="pb-2 pr-2 font-bold tnum">Min</th>
                <th className="pb-2 pr-2 font-bold tnum">Acts</th>
                <th className="pb-2 pr-2 font-bold tnum">Sec/Act</th>
                <th className="pb-2 pr-2 font-bold">Fast</th>
                <th className="pb-2 pr-2 font-bold tnum">Raw proj.</th>
                <th className="pb-2 pr-2 font-bold tnum">Label</th>
                <th className="pb-2 pr-2 font-bold tnum">Ratio</th>
                {STATION_ORDER.map(k => (
                  <th key={k} className="pb-2 pr-2 font-bold tnum">{STATION_HEADS[k]}</th>
                ))}
                <th className="pb-2 pr-2 font-bold">Src</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.runId + r.source} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2 font-semibold text-ink">{onOpenLearner ? (<button onClick={() => onOpenLearner(r.learner)} className="underline decoration-dotted">{resolveName ? resolveName(r.learner) : r.learner}</button>) : (resolveName ? resolveName(r.learner) : r.learner)}</td>
                  <td className="py-1.5 pr-2 text-muted tnum">U{r.unit}</td>
                  <td className="py-1.5 pr-2 text-muted">{LEVEL_LABELS[r.level]}</td>
                  <td className="py-1.5 pr-2 text-muted tnum">
                    {new Date(r.startedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-1.5 pr-2 tnum font-bold text-ink">{r.totalMinutes.toFixed(1)}</td>
                  <td className="py-1.5 pr-2 tnum text-muted">{r.activityCount}</td>
                  <td className="py-1.5 pr-2 tnum text-muted">{r.secPerActivity.toFixed(1)}</td>
                  <td className="py-1.5 pr-2">
                    {r.fastCompletion ? (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700">FAST</span>
                    ) : (
                      <span className="text-[10px] text-muted">—</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2 tnum text-muted">{r.rawProjected.toFixed(1)}</td>
                  <td className="py-1.5 pr-2 tnum text-muted">{r.currentLabel.toFixed(1)}</td>
                  <td className="py-1.5 pr-2 tnum font-bold text-brand">{r.ratio.toFixed(3)}</td>
                  {STATION_ORDER.map(k => (
                    <td key={k} className="py-1.5 pr-2 tnum text-muted">{r.perStation[k] ?? 0}</td>
                  ))}
                  <td className="py-1.5 pr-2 text-[10px] font-semibold text-muted" title={r.sourceFile ?? ''}>
                    {r.source === 'local' ? 'this device' : r.source === 'sample' ? 'sample' : r.sourceFile ?? 'imported'}
                    {r.isTestRun && <span className="ml-1 rounded-md bg-slate-100 px-1 py-0.5 text-[9px] font-extrabold text-slate-500">TEST</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Rows: {allRows.length} total · test runs {summary.testCount > 0 ? `(${summary.testCount}, hidden unless toggled)` : 'none'}.
          Ratio is measured ÷ RAW projection — the number that can overturn 0.72.
        </p>
      </div>
    </div>
  );
}

function ImportCard({
  pasteOpen, setPasteOpen, pasteText, setPasteText, onPaste, onFiles, fileRef, note, errors, importedCount, onClear,
}: {
  pasteOpen: boolean;
  setPasteOpen: (v: boolean) => void;
  pasteText: string;
  setPasteText: (v: string) => void;
  onPaste: () => void;
  onFiles: (files: FileList | null) => void;
  fileRef: React.MutableRefObject<HTMLInputElement | null>;
  note: string | null;
  errors: Array<{ line: number; reason: string }>;
  importedCount: number;
  onClear: () => void;
}) {
  return (
    <div className="surface-card p-5 sm:p-6">
      <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Import from other devices</h3>
      <p className="mb-3 text-xs leading-5 text-muted">
        Export a CSV on a learner's device, bring it here. Rows dedupe on their run ID — importing
        the same file twice changes nothing. Imports never touch this device's own recordings.
        {importedCount > 0 && <span className="ml-1 font-bold text-ink">({importedCount} imported rows in store)</span>}
      </p>
      <div
        className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); void onFiles(e.dataTransfer.files); }}
      >
        <FileUp size={18} className="mx-auto mb-1 text-muted" aria-hidden />
        <p className="text-xs text-muted">Drop one or more CSV files here</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          onChange={e => { void onFiles(e.target.files); e.target.value = ''; }}
        />
        <button onClick={() => fileRef.current?.click()} className="action-secondary mt-2 text-sm" style={{ minHeight: 44 }}>
          Choose CSV files…
        </button>
      </div>
      <button onClick={() => setPasteOpen(!pasteOpen)} className="action-secondary mt-3 text-sm" style={{ minHeight: 44 }}>
        <ClipboardPaste size={15} /> {pasteOpen ? 'Hide paste box' : 'Paste CSV text'}
      </button>
      {pasteOpen && (
        <div className="mt-3">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={5}
            placeholder={'Paste exported CSV here — several devices\' exports can be pasted together.'}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
            aria-label="Pasted CSV text"
          />
          <button onClick={onPaste} disabled={!pasteText.trim()} className="action-primary mt-2 text-sm" style={{ minHeight: 44 }}>
            Import pasted rows
          </button>
        </div>
      )}
      {note && <p className="mt-3 text-sm font-semibold text-mint" role="status">{note}</p>}
      {errors.length > 0 && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-bold text-coral">{errors.length} row{errors.length === 1 ? '' : 's'} rejected:</p>
          <ul className="mt-1 space-y-0.5">
            {errors.slice(0, 8).map((e, i) => (
              <li key={i} className="text-xs text-ink">Line {e.line}: {e.reason}</li>
            ))}
          </ul>
        </div>
      )}
      {importedCount > 0 && (
        <button onClick={onClear} className="mt-3 flex items-center gap-1.5 text-sm text-coral underline hover:text-red-700" style={{ minHeight: 44 }}>
          <Trash2 size={14} /> Clear imported data
        </button>
      )}
    </div>
  );
}
