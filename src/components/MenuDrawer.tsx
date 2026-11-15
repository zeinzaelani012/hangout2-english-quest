import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Home, BookOpen, BarChart3, BookMarked, GraduationCap,
  Settings, UserCog, Flame,
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { AvatarSVG } from './Illustrations';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/vocabulary', label: 'Vocabulary Bank', icon: BookMarked },
  { to: '/progress', label: 'My Progress', icon: BarChart3 },
  { to: '/teacher', label: 'Teacher Mode', icon: GraduationCap },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MenuDrawer() {
  const [open, setOpen] = useState(false);
  const { profile, switchStudent, progress } = useProgress();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSwitchStudent = () => {
    if (confirm('Are you sure you want to switch students? This will clear the current profile and all progress.')) {
      switchStudent();
      setOpen(false);
      navigate('/');
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm shadow-card hover:bg-white transition-colors flex items-center justify-center text-ink"
        aria-label="Open menu"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <Menu size={22} />
      </button>

      {/* Quick bottom nav on mobile — full menu stays in the drawer */}
      <BottomNav onMore={() => setOpen(true)} />

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-ink/30 z-40"
            />

            {/* Drawer — left on desktop, bottom sheet on mobile */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col"
              role="dialog"
              aria-label="Navigation menu"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {profile && <AvatarSVG avatarId={profile.avatarId} size={40} />}
                  <div>
                    <p className="font-heading font-700 text-ink text-sm">English Quest</p>
                    {profile && <p className="text-xs text-muted">{profile.name}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-11 h-11 rounded-full hover:bg-gray-100 flex items-center justify-center text-ink"
                  aria-label="Close menu"
                  style={{ minWidth: 44, minHeight: 44 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Streak/XP summary */}
              {profile && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-sun/15">
                    <Flame size={16} className="text-sun" />
                    <span className="text-sm font-medium tnum text-ink">{progress.streak} day streak</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-brand/10">
                    <span className="text-sm font-medium tnum text-brand">{progress.totalXP} XP</span>
                  </div>
                </div>
              )}

              {/* Menu items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-card transition-colors min-h-[44px] ${
                              isActive
                                ? 'bg-brand/10 text-brand font-semibold'
                                : 'text-ink hover:bg-gray-50'
                            }`
                          }
                        >
                          <Icon size={20} />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      onClick={handleSwitchStudent}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-card text-ink hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      <UserCog size={20} />
                      <span>Switch student</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Bottom quick-nav for small screens (hidden on desktop, where the drawer
// hamburger is always reachable)
function BottomNav({ onMore }: { onMore: () => void }) {
  const location = useLocation();

  const items = [
    { to: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
    { to: '/vocabulary', label: 'Words', icon: BookMarked, match: (path: string) => path.startsWith('/vocabulary') },
    { to: '/progress', label: 'Progress', icon: BarChart3, match: (path: string) => path.startsWith('/progress') },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100"
      aria-label="Quick navigation"
    >
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {items.map(item => {
          const Icon = item.icon;
          const active = item.match(location.pathname);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? 'text-brand' : 'text-muted hover:text-ink'
              }`}
              style={{ minHeight: 56 }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        <button
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-0.5 py-2 text-muted hover:text-ink transition-colors"
          style={{ minHeight: 56 }}
          aria-label="More options"
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
