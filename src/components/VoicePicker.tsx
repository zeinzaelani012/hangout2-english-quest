import { useEffect, useMemo, useState } from 'react';
import {
  Play, Square, Info, AlertTriangle, Lock, X, Volume2,
} from 'lucide-react';
import {
  getVoicesList,
  onVoicesChanged,
  groupVoices,
  vendorOf,
  isNeural,
  isEnglish,
  languageName,
  pickDefaultVoice,
  resolveVoice,
  loadAudioSettings,
  saveAudioSettings,
  onAudioSettingsChange,
  previewVoice,
  stop,
} from '../lib/audio';
import { renderedVoiceForUnit } from '../lib/audio/renderInfo';
import type { VoiceGroup } from '../lib/audio/voices';

/**
 * F4 — the fixed preview sentence. Two parts: the second deliberately carries
 * a plural, a past tense and a two-syllable word — the three things that
 * separate a good voice from a bad one for this course.
 */
const PREVIEW_SENTENCE =
  'Hello. This is how I will read your lesson. The weather was warm, and there were two boats on the lake.';

const VENDOR_CHIP: Record<VoiceGroup['vendor'], string> = {
  microsoft: 'bg-teal-50 text-teal-700',
  google: 'bg-amber-50 text-amber-700',
  apple: 'bg-slate-100 text-slate-600',
  system: 'bg-slate-100 text-slate-600',
};

interface VoicePickerProps {
  /** Level rate multiplier so previews match how the lesson will sound. */
  rateMultiplier?: number;
  /** The learner's unit — scopes the rendered-audio note (F9). */
  unitId?: number;
  /** Teacher lock: selection disabled, with a line that says so (F8). */
  readOnly?: boolean;
}

export function VoicePicker({ rateMultiplier = 1, unitId, readOnly = false }: VoicePickerProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getVoicesList());
  const [settings, setSettings] = useState(() => loadAudioSettings());
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [previewingURI, setPreviewingURI] = useState<string | null>(null);

  // Voices arrive asynchronously — re-read on voiceschanged; the library
  // debounces repeats by comparing the resulting list.
  useEffect(() => onVoicesChanged(() => setVoices([...getVoicesList()])), []);

  // Another surface (Teacher Mode, the station launcher) may change settings.
  useEffect(() => onAudioSettingsChange(() => setSettings({ ...loadAudioSettings() })), []);

  // Unmount mid-preview: silence immediately.
  useEffect(() => () => { if (previewingURI) stop(); }, [previewingURI]);

  const groups = useMemo(() => {
    const all = groupVoices(voices);
    return all
      .map(g => ({ ...g, voices: showAllLanguages ? g.voices : g.voices.filter(isEnglish) }))
      .filter(g => g.voices.length > 0);
  }, [voices, showAllLanguages]);

  const recommended = useMemo(() => pickDefaultVoice(voices), [voices]);

  // The voice that will actually speak: the saved one, or the recommended
  // default when nothing is saved / the saved one is gone.
  const savedVoice = resolveVoice(settings.voiceURI, voices);
  const effectiveVoice = savedVoice ?? recommended;
  const savedMissing = settings.voiceURI !== null && !savedVoice;

  const hasNeuralMicrosoft = voices.some(v => vendorOf(v) === 'microsoft' && isNeural(v));
  const visibleCount = groups.reduce((n, g) => n + g.voices.length, 0);
  const renderInfo = renderedVoiceForUnit(unitId);
  const selectedIsNonEnglish =
    effectiveVoice !== null && !isEnglish(effectiveVoice);

  const handleSelect = (voice: SpeechSynthesisVoice) => {
    if (readOnly) return;
    saveAudioSettings({ voiceURI: voice.voiceURI, voiceName: voice.name });
  };

  const handlePreview = (voice: SpeechSynthesisVoice) => {
    if (previewingURI === voice.voiceURI) {
      stop();
      setPreviewingURI(null);
      return;
    }
    // previewVoice stops everything first — one preview at a time.
    setPreviewingURI(voice.voiceURI);
    previewVoice(voice, PREVIEW_SENTENCE, rateMultiplier)
      .catch(() => {})
      .finally(() => setPreviewingURI(cur => (cur === voice.voiceURI ? null : cur)));
  };

  if (voices.length === 0) {
    return <p className="text-sm font-semibold text-muted" aria-live="polite">Loading voices…</p>;
  }

  return (
    <div>
      {readOnly && (
        <p className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-ink">
          <Lock size={15} className="shrink-0 text-sun" aria-hidden />
          Voice is locked by your teacher.
        </p>
      )}

      {/* F9 — the picker controls synthesis only, and says so. */}
      {renderInfo && (
        <p className="mb-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-ink">
          <Info size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />
          <span>
            Rendered audio is playing for {unitId !== undefined ? "this unit's lessons" : 'rendered lessons'}. Voice
            choice applies where no file exists. Rendered by {renderInfo.voiceName} ({renderInfo.provider}).
          </span>
        </p>
      )}

      {savedMissing && (
        <p className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-ink">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-sun" aria-hidden />
          <span>
            The saved voice “{settings.voiceName}” isn't available on this device — using{' '}
            <strong>{effectiveVoice?.name ?? 'the default voice'}</strong> instead.
          </span>
        </p>
      )}

      {selectedIsNonEnglish && (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-ink">
          This voice speaks English with a {languageName(effectiveVoice!.lang)} accent. Words may sound different.
        </p>
      )}

      <fieldset className="mb-3" disabled={readOnly}>
        <legend className="sr-only">Voice</legend>
        <div role="radiogroup" aria-label="Choose a voice">
          {groups.map(group => (
            <div key={group.vendor} className="mb-4">
              <p className="eyebrow mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.voices.map(voice => {
                  const selected = effectiveVoice?.voiceURI === voice.voiceURI;
                  const isRecommended = recommended?.voiceURI === voice.voiceURI;
                  const isPreviewing = previewingURI === voice.voiceURI;
                  return (
                    <div
                      key={voice.voiceURI}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                        selected ? 'border-brand/50 bg-teal-50/60' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="radio"
                          name="h2eq-voice"
                          value={voice.voiceURI}
                          checked={selected}
                          onChange={() => handleSelect(voice)}
                          className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
                          style={{ minWidth: 16 }}
                          aria-label={voice.name}
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold text-ink">{voice.name}</span>
                            {isNeural(voice) && (
                              <span className="rounded-md bg-violet/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-violet">
                                Neural
                              </span>
                            )}
                            {isRecommended && (
                              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-extrabold text-mint">
                                Recommended for this device
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${VENDOR_CHIP[group.vendor]}`}>
                              {group.label}
                            </span>
                            <span className="text-[11px] font-semibold text-muted">
                              {voice.localService ? 'On device' : 'Online'}
                            </span>
                            <span className="text-[11px] text-muted">{languageName(voice.lang)}</span>
                          </span>
                        </span>
                      </label>
                      <button
                        onClick={() => handlePreview(voice)}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-brand/10 text-brand transition-colors hover:bg-brand/20"
                        aria-label={isPreviewing ? `Stop preview of ${voice.name}` : `Preview ${voice.name}`}
                      >
                        {isPreviewing ? <Square size={16} aria-hidden /> : <Play size={16} aria-hidden />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* F2 — teacher toggle to see every language, with the accent note above. */}
      <label className="mb-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={showAllLanguages}
          onChange={e => setShowAllLanguages(e.target.checked)}
          className="h-4 w-4 accent-teal-700"
        />
        Show all languages
      </label>

      {/* F7 — platform reality, shown not hidden. */}
      {!hasNeuralMicrosoft && (
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
          <Info size={13} className="shrink-0" aria-hidden />
          For the best voice, open this app in Microsoft Edge.
        </p>
      )}
      {visibleCount < 3 && (
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
          <Info size={13} className="shrink-0" aria-hidden />
          Your device is showing few voices. More can be added in your system settings.
        </p>
      )}
    </div>
  );
}

/** F — the compact launcher for listening/speaking station headers: a small
 * speaker-with-gear icon that opens the picker in a modal, so a teacher can
 * fix the voice without leaving the lesson. */
export function VoiceLauncherButton({
  rateMultiplier,
  unitId,
  title = 'Voice settings',
}: {
  rateMultiplier?: number;
  unitId?: number;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-slate-100"
        aria-label={title}
        title={title}
      >
        <Volume2 size={17} aria-hidden />
        <span
          className="absolute bottom-2 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200"
          aria-hidden
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-card bg-white p-5 shadow-card sm:p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-extrabold text-ink">{title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-slate-100"
                aria-label="Close voice settings"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <VoicePicker rateMultiplier={rateMultiplier} unitId={unitId} readOnly={loadAudioSettings().voiceLocked} />
          </div>
        </div>
      )}
    </>
  );
}
