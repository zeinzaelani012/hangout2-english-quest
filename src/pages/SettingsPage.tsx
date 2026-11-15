import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { Mic, MicOff, KeyRound, RotateCcw, UserCog } from 'lucide-react';

export function SettingsPage() {
  const { settings, updateSettings, switchStudent, resetProgress, profile } = useProgress();
  const [pinInput, setPinInput] = useState(settings.teacherPin);
  const [noMic, setNoMic] = useState(settings.noMicMode);

  const handleSavePin = () => {
    updateSettings({ teacherPin: pinInput || 'teacher' });
  };

  const handleToggleMic = (v: boolean) => {
    setNoMic(v);
    updateSettings({ noMicMode: v });
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 sm:px-6 py-4">
      <h1 className="font-heading font-800 text-2xl text-ink mb-6">Settings</h1>

      {/* Profile section */}
      {profile && (
        <div className="bg-white rounded-card shadow-card p-6 mb-4">
          <h3 className="font-heading font-700 text-lg text-ink mb-3">Student</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{profile.name}</p>
              <p className="text-xs text-muted">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Switch to a new student? This will clear the current profile and all progress.')) {
                  switchStudent();
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-white shadow-card text-sm font-medium text-ink hover:bg-gray-50"
              style={{ minHeight: 44 }}
            >
              <UserCog size={16} /> Switch student
            </button>
          </div>
        </div>
      )}

      {/* No-microphone mode */}
      <div className="bg-white rounded-card shadow-card p-6 mb-4">
        <h3 className="font-heading font-700 text-lg text-ink mb-3">Speaking</h3>
        <div className="flex items-center justify-between p-3 rounded-card bg-cream">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${noMic ? 'bg-coral/15' : 'bg-mint/15'}`}>
              {noMic ? <MicOff size={18} className="text-coral" /> : <Mic size={18} className="text-mint" />}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">No-microphone mode</p>
              <p className="text-xs text-muted">Switch speaking tasks to self-check rubric</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleMic(!noMic)}
            className={`relative w-12 h-6 rounded-pill transition-colors ${noMic ? 'bg-coral' : 'bg-gray-200'}`}
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
      <div className="bg-white rounded-card shadow-card p-6 mb-4">
        <h3 className="font-heading font-700 text-lg text-ink mb-3">Teacher PIN</h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="teacher"
              className="w-full pl-10 pr-4 py-2.5 rounded-pill border border-gray-200 bg-white text-ink focus:outline-none focus:border-brand"
              style={{ minHeight: 44 }}
              aria-label="Teacher PIN"
            />
          </div>
          <button
            onClick={handleSavePin}
            className="px-5 py-2.5 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors"
            style={{ minHeight: 44 }}
          >
            Save
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          This PIN protects Teacher Mode. Default is "teacher".
        </p>
      </div>

      {/* Reset progress */}
      <div className="bg-white rounded-card shadow-card p-6 border-2 border-coral/20">
        <h3 className="font-heading font-700 text-lg text-ink mb-2">Reset Progress</h3>
        <p className="text-sm text-muted mb-4">
          This will delete your name, avatar, XP, and all activity progress.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure? This will delete everything and cannot be undone.')) {
              resetProgress();
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-coral text-white font-heading font-700 hover:bg-coral/90 transition-colors"
          style={{ minHeight: 44 }}
        >
          <RotateCcw size={18} /> Reset everything
        </button>
      </div>
    </div>
  );
}
