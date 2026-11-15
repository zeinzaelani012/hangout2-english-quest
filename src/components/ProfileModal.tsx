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
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Create your profile"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-cream rounded-card shadow-2xl p-6 sm:p-8 w-full max-w-md"
        >
          {!saved ? (
            <>
              <div className="flex justify-center mb-4">
                <CookieMascot size={56} />
              </div>
              <h2 className="font-heading font-800 text-2xl text-ink text-center mb-1">
                {isInitial ? 'Welcome to English Quest!' : 'What should we call you?'}
              </h2>
              <p className="text-center text-muted text-sm mb-6">
                Pick a name and an avatar to get started.
              </p>

              {/* Name input */}
              <div className="mb-4">
                <label htmlFor="profile-name" className="block text-sm font-medium text-ink mb-1.5">
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
                  className="w-full px-4 py-3 rounded-card border border-gray-200 bg-white text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
                <label className="block text-sm font-medium text-ink mb-2">Choose your avatar</label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_IDS.map(id => (
                    <button
                      key={id}
                      onClick={() => setAvatarId(id)}
                      className={`p-2 rounded-card transition-all ${
                        avatarId === id
                          ? 'bg-brand/10 ring-2 ring-brand'
                          : 'bg-white hover:bg-gray-50 border border-gray-100'
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
                className="w-full py-3 rounded-pill bg-brand text-white font-heading font-700 hover:bg-brand/90 transition-colors"
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
              <h2 className="font-heading font-800 text-2xl text-ink mb-2">
                Hi, {name.trim()}!
              </h2>
              <p className="text-muted text-lg">Ready for your English Quest?</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
