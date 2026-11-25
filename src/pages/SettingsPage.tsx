import { useEffect, useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { Mic, MicOff, KeyRound, RotateCcw, UserCog, Music } from 'lucide-react';
import { VoicePicker } from '../components/VoicePicker';
import { loadAudioSettings, saveAudioSettings, onAudioSettingsChange } from '../lib/audio';

export function SettingsPage() {
  const { settings, updateSettings, switchStudent, resetProgress, profile } = useProgress();
  const [pinInput, setPinInput] = useState(settings.teacherPin);
  const [noMic, setNoMic] = useState(settings.noMicMode);
  const [audio, setAudio] = useState(() => loadAudioSettings());

  // Teacher Mode can lock the voice while this page is open.
  useEffect(() => onAudioSettingsChange(() => setAudio({ ...loadAudioSettings() })), []);

  const handleVolume = (value: number) => {
    const volume = Math.max(0, Math.min(1, value / 100));
    setAudio(prev => ({ ...prev, volume }));
    saveAudioSettings({ volume });
  };

  const handleSavePin = () => {
    updateSettings({ teacherPin: pinInput || 'teacher' });
  };

  const handleToggleMic = (v: boolean) => {
    setNoMic(v);
    updateSettings({ noMicMode: v });
  };

  const handleToggleMusic = (v: boolean) => {
    saveAudioSettings({ musicEnabled: v });
  };

  const handleMusicVolume = (value: number) => {
    const musicVolume = Math.max(0, Math.min(1, value / 100));
    saveAudioSettings({ musicVolume });
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6 sm:py-8">
      <p className="eyebrow mb-2">Preferences</p>
      <h1 className="mb-6 font-heading text-3xl font-extrabold text-ink">Settings</h1>

      {/* Profile section */}
      {profile && (
        <div className="surface-card mb-4 p-5 sm:p-6">
          <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Student</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">{profile.name}</p>
              <p className="text-xs text-muted">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Switch to a new student? This will clear the current profile and all progress.')) {
                  switchStudent();
                }
              }}
              className="action-secondary text-sm"
              style={{ minHeight: 44 }}
            >
              <UserCog size={16} /> Switch student
            </button>
          </div>
        </div>
      )}

      {/* Voice — the picker (Part F) + global volume (Part J) */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Voice</h3>
        <p className="mb-4 text-xs leading-5 text-muted">
          The app reads lessons with the voice your browser provides. Pick the one that sounds
          best — it is free, already on this device.
        </p>
        <VoicePicker readOnly={audio.voiceLocked} />

        <div className="mt-5 border-t border-slate-100 pt-4">
          <label htmlFor="global-volume" className="mb-1 flex items-center justify-between text-sm font-bold text-ink">
            Volume
            <span className="tnum text-xs font-semibold text-muted">{Math.round(audio.volume * 100)}%</span>
          </label>
          <input
            id="global-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(audio.volume * 100)}
            onChange={e => handleVolume(Number(e.target.value))}
            className="w-full accent-teal-700"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(audio.volume * 100)}
          />
          <p className="mt-1 text-xs text-muted">Applies to every lesson sound, on this device.</p>
        </div>
      </div>

      {/* Background music — instrumental mood tracks, silenced on listening/speaking */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-1 font-heading text-lg font-extrabold text-ink">Music</h3>
        <p className="mb-4 text-xs leading-5 text-muted">
          Gentle instrumental music plays while you browse and on quiet practice
          stations. It stops by itself on listening and speaking activities, and
          dips down while a lesson voice speaks.
        </p>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${audio.musicEnabled ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              <Music size={18} className={audio.musicEnabled ? 'text-mint' : 'text-muted'} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Background music</p>
              <p className="text-xs text-muted">Instrumental, very quiet</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleMusic(!audio.musicEnabled)}
            className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${audio.musicEnabled ? 'bg-brand' : 'bg-slate-300'}`}
            role="switch"
            aria-checked={audio.musicEnabled}
            aria-label="Background music"
            style={{ minWidth: 44 }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                audio.musicEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <label htmlFor="music-volume" className="mb-1 flex items-center justify-between text-sm font-bold text-ink">
            Music volume
            <span className="tnum text-xs font-semibold text-muted">{Math.round(audio.musicVolume * 100)}%</span>
          </label>
          <input
            id="music-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(audio.musicVolume * 100)}
            onChange={e => handleMusicVolume(Number(e.target.value))}
            className="w-full accent-teal-700"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(audio.musicVolume * 100)}
          />
          <p className="mt-1 text-xs text-muted">Applies on this device, separate from the lesson voices.</p>
        </div>
      </div>

      {/* No-microphone mode */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Speaking</h3>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${noMic ? 'bg-orange-50' : 'bg-emerald-50'}`}>
              {noMic ? <MicOff size={18} className="text-coral" /> : <Mic size={18} className="text-mint" />}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">No-microphone mode</p>
              <p className="text-xs text-muted">Switch speaking tasks to self-check rubric</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleMic(!noMic)}
            className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${noMic ? 'bg-coral' : 'bg-slate-300'}`}
            role="switch"
            aria-checked={noMic}
            aria-label="No microphone mode"
            style={{ minWidth: 44 }}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                noMic ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Teacher PIN */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <h3 className="mb-4 font-heading text-lg font-extrabold text-ink">Teacher PIN</h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="teacher"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              style={{ minHeight: 44 }}
              aria-label="Teacher PIN"
            />
          </div>
          <button
            onClick={handleSavePin}
            className="action-primary"
            style={{ minHeight: 44 }}
          >
            Save
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          This PIN protects Teacher Mode. Default is "teacher".
        </p>
      </div>

      {/* Reset progress */}
      <div className="surface-card border-red-200 p-5 sm:p-6">
        <h3 className="mb-2 font-heading text-lg font-extrabold text-ink">Reset progress</h3>
        <p className="text-sm text-muted mb-4">
          This will delete your name, avatar, XP, and all activity progress.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure? This will delete everything and cannot be undone.')) {
              resetProgress();
            }
          }}
          className="action-accent"
          style={{ minHeight: 44 }}
        >
          <RotateCcw size={18} /> Reset everything
        </button>
      </div>
    </div>
  );
}
