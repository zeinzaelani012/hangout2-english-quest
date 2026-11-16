import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';
import { AvatarSVG, AVATAR_IDS, CookieMascot } from './Illustrations';

interface ProfileModalProps {
  onClose: () => void;
  isInitial?: boolean;
}

export function ProfileModal({ onClose, isInitial = false }: ProfileModalProps) {
  const { setProfile } = useProgress();
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(AVATAR_IDS[0]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Name must be 20 characters or fewer.');
      return;
    }
    setError('');
    setSaved(true);
    setProfile({
      name: trimmed,
      avatarId,
      createdAt: new Date().toISOString(),
    });

    // Show greeting briefly, then close
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Create your profile"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="surface-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl sm:p-8"
        >
          {!saved ? (
            <>
              <div className="flex justify-center mb-4">
                <CookieMascot size={56} />
              </div>
              <h2 className="mb-2 text-center font-heading text-2xl font-extrabold text-ink">
                {isInitial ? 'Welcome to English Quest!' : 'What should we call you?'}
              </h2>
              <p className="mb-6 text-center text-sm leading-6 text-muted">
                Pick a name and an avatar to get started.
              </p>

              {/* Name input */}
              <div className="mb-4">
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-bold text-ink">
                  Your name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="Enter your name (2–20 characters)"
                  maxLength={20}
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'name-error' : undefined}
                />
                {error && (
                  <p id="name-error" className="mt-1.5 text-sm text-coral" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {/* Avatar picker */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-bold text-ink">Choose your avatar</label>
                <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                  {AVATAR_IDS.map(id => (
                    <button
                      key={id}
                      onClick={() => setAvatarId(id)}
                      className={`rounded-xl border p-2 transition-all ${
                        avatarId === id
                          ? 'border-brand bg-teal-50 ring-2 ring-brand/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                      style={{ minHeight: 44 }}
                      aria-label={`Avatar option ${id}`}
                      aria-pressed={avatarId === id}
                    >
                      <AvatarSVG avatarId={id} size={56} className="mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                className="action-primary w-full"
                style={{ minHeight: 44 }}
              >
                Save and start
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="flex justify-center mb-4">
                <AvatarSVG avatarId={avatarId} size={80} />
              </div>
              <h2 className="mb-2 font-heading text-2xl font-extrabold text-ink">
                Hi, {name.trim()}!
              </h2>
              <p className="text-sm font-semibold text-muted">Your learning space is ready.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
