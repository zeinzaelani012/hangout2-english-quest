import { useState } from 'react';
import type { Activity, DiaryPromptPayload } from '../../types';
import { Check, ListChecks } from 'lucide-react';
import { type ItemResult } from './v2-types';

interface Props {
  activity: Activity;
  onResult: ItemResult;
}

// ---- v2 guidedParagraph (W3 writing task) --------------------------------------

function GuidedParagraphBody({ activity, onResult }: Props) {
  const payload = activity.payload as Record<string, any>;
  const starters: string[] = payload.starters ?? [];
  const template: string | undefined = payload.template;
  const requirements: string[] = payload.requirements ?? [];
  const checklist: string[] = payload.checklist ?? [];
  const minimumWords: number = payload.minimumWords ?? 20;
  const ownSentencesRequired: number | undefined = payload.ownSentencesRequired;
  // Two-column order chart (Units 3/4/8): rows × column headers, optional
  // stem for the second column. Unit 9's core W3 uses a ROW-LABELLED variant:
  // columnA is an array of per-row labels with per-row stems.
  const chart: { rows: number; columnA: string | string[]; columnB?: string; columnBStem?: string | string[] } | undefined = payload.chart;
  // Part F — fail loudly in dev when the two shapes disagree: a columnA
  // ARRAY whose length contradicts `rows` is a pack bug, not a UI one.
  if (
    import.meta.env.DEV &&
    chart &&
    Array.isArray(chart.columnA) &&
    typeof chart.rows === 'number' &&
    chart.rows !== chart.columnA.length
  ) {
    console.error(
      `[WritingChart] columnA has ${chart.columnA.length} labels but rows=${chart.rows} ` +
      `(unit ${activity.unitId ?? '?'}, ${activity.difficulty}) — the pack's chart shape is inconsistent.`,
    );
  }
  const chartRowLabels: string[] | null =
    chart && Array.isArray(chart.columnA) ? chart.columnA : null;
  const chartRowStems: string[] =
    chart && Array.isArray(chart.columnBStem) ? chart.columnBStem : [];
  const chooseSeason: string[] | undefined = payload.chooseSeason;
  const chooseRoom: string[] | undefined = payload.chooseRoom;
  const choosePlace: string[] | undefined = payload.choosePlace;
  const pickerOptions = chooseSeason ?? chooseRoom ?? choosePlace;
  // Part F — ONE picker component with three data keys; the key name is the
  // accessible label. Never hardcode one key's name onto another.
  const pickerLabel = chooseSeason ? 'Choose a season' : chooseRoom ? 'Choose a room' : 'Choose a place';
  const menu: string[] = payload.menu ?? [];

  const [text, setText] = useState('');
  const [chartCells, setChartCells] = useState<string[][]>(() =>
    chart && !chartRowLabels ? Array.from({ length: chart.rows ?? 0 }, () => ['', '']) : [],
  );
  const [rowEntries, setRowEntries] = useState<string[]>(() =>
    chartRowLabels ? chartRowLabels.map(() => '') : [],
  );
  const [chosenSeason, setChosenSeason] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Part F — minimumWords counts the CHART CELLS and the free text TOGETHER,
  // never each separately, and the count is stated live so the target is not
  // a surprise at submit.
  const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const chartWords =
    chartCells.reduce((n, row) => n + row.reduce((m, cell) => m + countWords(cell), 0), 0) +
    rowEntries.reduce((n, entry) => n + countWords(entry), 0);
  const textWords = countWords(text);
  const wordCount = textWords + chartWords;
  const sentenceCount = text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  // The PICKER is required; the chart and free text are not. A learner who
  // picks a season and writes nothing still completes the station — so the
  // only submit gate is a missing picker choice.
  const pickerMissing = pickerOptions !== undefined && pickerOptions.length > 0 && chosenSeason === null;

  const handleComplete = () => {
    setCompleted(true);
    onResult(true, {
      correctAnswer: 'Your own writing',
      rule: `You wrote ${wordCount} words across ${sentenceCount} sentences.`,
    });
  };

  const insertStarter = (starter: string) => {
    if (completed) return;
    setText(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? '\n' : '') + starter);
  };

  return (
    <div>
      <p className="mb-4 rounded-xl border border-violet/20 bg-violet/5 px-4 py-3 text-sm leading-6 text-ink">
        {payload.prompt ?? activity.prompt}
      </p>

      {template && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="eyebrow mb-2">Template</p>
          <p className="text-sm italic leading-6 text-ink">{template}</p>
          {ownSentencesRequired !== undefined && (
            <p className="mt-2 text-xs font-semibold text-muted">
              Then add {ownSentencesRequired} sentence{ownSentencesRequired > 1 ? 's' : ''} of your own.
            </p>
          )}
        </div>
      )}

      {/* Four-option single-select picker (chooseSeason / chooseRoom) above the chart */}
      {pickerOptions && pickerOptions.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="eyebrow mb-2">{pickerLabel}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={pickerLabel}>
            {pickerOptions.map(option => {
              const selected = chosenSeason === option;
              return (
                <button
                  key={option}
                  onClick={() => !completed && setChosenSeason(option)}
                  disabled={completed}
                  aria-pressed={selected}
                  className={`min-h-[44px] rounded-pill border px-4 py-2 text-sm font-bold transition-all ${
                    selected
                      ? 'border-brand bg-teal-50 text-brand ring-2 ring-brand/20'
                      : 'border-slate-200 bg-white text-muted hover:border-brand/40 hover:text-ink'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Order chart: two-column form (Units 3/4/8) or row-labelled form (Unit 9) */}
      {chart && chartRowLabels && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="eyebrow mb-3">Order chart</p>
          <div className="space-y-3">
            {chartRowLabels.map((label, r) => (
              <div key={r}>
                <p className="mb-1 text-xs font-extrabold text-ink">{label}</p>
                <input
                  value={rowEntries[r] ?? ''}
                  disabled={completed}
                  onChange={e => setRowEntries(prev => prev.map((v, idx) => (idx === r ? e.target.value : v)))}
                  className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  aria-label={`Row ${r + 1}: ${label}`}
                  placeholder={chartRowStems[r] ?? ''}
                />
              </div>
            ))}
          </div>
          {menu.length > 0 && (
            <>
              <p className="eyebrow mb-2 mt-3">Menu — tap to add to your writing</p>
              <div className="flex flex-wrap gap-1.5">
                {menu.map(word => (
                  <button
                    key={word}
                    onClick={() => !completed && setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + word)}
                    className="rounded-lg border border-violet/20 bg-violet/5 px-2.5 py-1.5 text-xs font-semibold text-writing transition-colors hover:bg-violet/10"
                    style={{ minHeight: 32 }}
                    aria-label={`Add "${word}" to your writing`}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {chart && !chartRowLabels && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="eyebrow mb-3">Order chart</p>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-xs font-extrabold text-ink">{chart.columnA as string}</p>
              <p className="text-xs font-extrabold text-ink">{chart.columnB}</p>
            </div>
            {chartCells.map((row, r) => (
              <div key={r} className="grid grid-cols-2 gap-2">
                <input
                  value={row[0]}
                  disabled={completed}
                  onChange={e => setChartCells(prev => prev.map((rw, idx) => (idx === r ? [e.target.value, rw[1]] : rw)))}
                  className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  aria-label={`Row ${r + 1}, ${chart.columnA as string}`}
                  placeholder="e.g. Mia wants pizza"
                />
                <input
                  value={row[1]}
                  disabled={completed}
                  onChange={e => setChartCells(prev => prev.map((rw, idx) => (idx === r ? [rw[0], e.target.value] : rw)))}
                  className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink focus:border-brand focus:outline-none"
                  aria-label={`Row ${r + 1}, ${chart.columnB as string}`}
                  placeholder={typeof chart.columnBStem === 'string' ? chart.columnBStem : 'e.g. It looks good'}
                />
              </div>
            ))}
          </div>
          {menu.length > 0 && (
            <>
              <p className="eyebrow mb-2 mt-3">Menu — tap to add to your writing</p>
              <div className="flex flex-wrap gap-1.5">
                {menu.map(word => (
                  <button
                    key={word}
                    onClick={() => !completed && setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + word)}
                    className="rounded-lg border border-violet/20 bg-violet/5 px-2.5 py-1.5 text-xs font-semibold text-writing transition-colors hover:bg-violet/10"
                    style={{ minHeight: 32 }}
                    aria-label={`Add "${word}" to your writing`}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {starters.length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-2">Sentence starters — tap to use</p>
          <div className="flex flex-wrap gap-2">
            {starters.map((starter, i) => (
              <button
                key={i}
                onClick={() => insertStarter(starter)}
                disabled={completed}
                className="rounded-lg border border-violet/20 bg-violet/5 px-3 py-1.5 text-sm font-semibold text-writing transition-colors hover:bg-violet/10"
                style={{ minHeight: 36 }}
                aria-label={`Use starter: ${starter}`}
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={completed}
        placeholder="Write your snack diary here..."
        rows={7}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label="Your writing"
      />

      <div className="mt-2 mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
        <span className="tnum" aria-live="polite">{wordCount} of {minimumWords} words</span>
        <span className="tnum">{sentenceCount} sentences</span>
        {pickerMissing && <span className="font-bold text-sun">Pick one {pickerLabel.toLowerCase().replace('choose ', '').replace('your ', '')} above to finish</span>}
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
          <ListChecks size={16} className="text-brand" /> Check your work
        </p>
        <div className="space-y-2">
          {requirements.map((item, i) => (
            <p key={`req-${i}`} className="flex min-h-6 items-center gap-2.5 text-sm text-ink">
              <span className="h-2 w-2 shrink-0 rounded-full bg-violet" aria-hidden />
              {item}
            </p>
          ))}
          {checklist.map((item, i) => (
            <p key={`chk-${i}`} className="flex min-h-6 items-center gap-2.5 text-sm text-ink">
              <span className="h-2 w-2 shrink-0 rounded-full bg-mint" aria-hidden />
              {item}
            </p>
          ))}
        </div>
      </div>

      {!completed && (
        <button
          onClick={handleComplete}
          disabled={pickerMissing}
          className="action-primary w-full"
          style={{ minHeight: 44 }}
        >
          Save and complete
        </button>
      )}

      {completed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Check size={18} className="text-mint" />
            Your writing is saved. Great work.
          </p>
        </div>
      )}
    </div>
  );
}

// ---- Legacy diary prompt (Units 2/3) --------------------------------------------

function LegacyDiaryPrompt({ activity, onResult }: Props) {
  const payload = activity.payload as DiaryPromptPayload;
  const [text, setText] = useState('');
  const [checks, setChecks] = useState<boolean[]>(payload.checklist.map(() => false));
  const [completed, setCompleted] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.trim().split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  const handleComplete = () => {
    setCompleted(true);
    const passed = checks.every(c => c) && sentenceCount >= payload.minLength;
    onResult(true, {
      correctAnswer: 'Your own writing',
      rule: `You wrote ${sentenceCount} sentences. ${passed ? 'All checks passed!' : 'Try to complete all checklist items next time.'}`,
    });
  };

  return (
    <div>
      {/* Prompt */}
      <div className="mb-4 rounded-xl border border-violet/20 bg-violet/5 p-4">
        <p className="text-sm leading-6 text-ink">{payload.prompt}</p>
      </div>

      {/* Word bank */}
      {payload.wordBank.length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-2">Useful words</p>
          <div className="flex flex-wrap gap-2">
            {payload.wordBank.map((word, i) => (
              <button
                key={i}
                onClick={() => setText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + word)}
                className="rounded-lg border border-violet/20 bg-violet/5 px-3 py-1.5 text-sm font-semibold text-writing transition-colors hover:bg-violet/10"
                style={{ minHeight: 36 }}
                aria-label={`Add "${word}" to your writing`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={completed}
        placeholder="Write your diary entry here..."
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label="Your diary entry"
      />

      {/* Stats */}
      <div className="mb-4 mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
        <span className="tnum">{wordCount} words</span>
        <span className="tnum">{sentenceCount} sentences</span>
        <span>Goal: {payload.minLength} sentences</span>
      </div>

      {/* Checklist */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
          <ListChecks size={16} className="text-brand" /> Check your work
        </p>
        <div className="space-y-2">
          {payload.checklist.map((item, i) => (
            <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={checks[i]}
                onChange={e => setChecks(prev => prev.map((c, idx) => idx === i ? e.target.checked : c))}
                className="h-5 w-5 rounded border-slate-300 text-brand"
              />
              <span className={`text-sm ${checks[i] ? 'font-semibold text-mint' : 'text-ink'}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Complete button */}
      {!completed && (
        <button
          onClick={handleComplete}
          disabled={sentenceCount < 1}
          className="action-primary w-full"
          style={{ minHeight: 44 }}
        >
          Save and complete
        </button>
      )}

      {completed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Check size={18} className="text-mint" />
            Your diary entry is saved. Great writing.
          </p>
        </div>
      )}
    </div>
  );
}

export function DiaryPrompt(props: Props) {
  const raw = props.activity.payload as Record<string, any>;
  // v2 guidedParagraph payloads carry starters, a template, requirements, the
  // two-column order chart, the menu, or the choose-a-X picker.
  if (raw?.starters || raw?.template || raw?.requirements || raw?.chart || raw?.menu || raw?.chooseSeason || raw?.chooseRoom) {
    return <GuidedParagraphBody {...props} />;
  }
  return <LegacyDiaryPrompt {...props} />;
}
