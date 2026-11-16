import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, BookMarked, BookOpen, Flame, GraduationCap, Home,
  Menu, Settings, Star, UserCog, X,
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      requestAnimationFrame(() => {
        drawerRef.current?.querySelector<HTMLElement>('button, a')?.focus();
      });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])'),
      ).filter(element => !element.hasAttribute('disabled'));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const closeDrawer = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSwitchStudent = () => {
    if (confirm('Are you sure you want to switch students? This will clear the current profile and all progress.')) {
      switchStudent();
      setOpen(false);
      navigate('/');
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              ref={triggerRef}
              onClick={() => setOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-slate-100"
              aria-label="Open navigation"
              aria-expanded={open}
            >
              <Menu size={21} />
            </button>
            <NavLink to="/" className="flex items-center gap-2.5" aria-label="English Quest dashboard">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                <BookOpen size={19} />
              </span>
              <span className="hidden font-heading text-base font-extrabold text-ink sm:block">English Quest</span>
            </NavLink>
          </div>

          {profile && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-ink sm:flex">
                <Flame size={16} className="text-sun" />
                <span className="tnum">{progress.streak}</span>
                <span className="text-muted">day streak</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-brand">
                <Star size={16} />
                <span className="tnum">{progress.totalXP} XP</span>
              </div>
              <AvatarSVG avatarId={profile.avatarId} size={38} />
            </div>
          )}
        </div>
      </header>

      <BottomNav onMore={() => setOpen(true)} />

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[2px]"
            />

            <motion.div
              ref={drawerRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88vw] flex-col border-r border-slate-200 bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  {profile ? <AvatarSVG avatarId={profile.avatarId} size={44} /> : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white"><BookOpen size={20} /></span>
                  )}
                  <div>
                    <p className="font-heading text-sm font-extrabold text-ink">English Quest</p>
                    {profile && <p className="text-xs text-muted">Learning as {profile.name}</p>}
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-ink hover:bg-slate-100"
                  aria-label="Close navigation"
                >
                  <X size={20} />
                </button>
              </div>

              {profile && (
                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-4">
                  <div className="rounded-xl bg-amber-50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-muted">Streak</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-heading font-extrabold text-ink">
                      <Flame size={16} className="text-sun" /> <span className="tnum">{progress.streak} days</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-teal-50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-muted">Total earned</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-heading font-extrabold text-brand">
                      <Star size={16} /> <span className="tnum">{progress.totalXP} XP</span>
                    </p>
                  </div>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto p-4">
                <p className="eyebrow mb-2 px-3">Explore</p>
                <ul className="space-y-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={closeDrawer}
                          className={({ isActive }) =>
                            `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                              isActive ? 'bg-teal-50 text-brand' : 'text-ink hover:bg-slate-100'
                            }`
                          }
                        >
                          <Icon size={19} />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="border-t border-slate-200 p-4">
                <button
                  onClick={handleSwitchStudent}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-slate-100"
                >
                  <UserCog size={19} />
                  <span>Switch student</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function BottomNav({ onMore }: { onMore: () => void }) {
  const location = useLocation();
  const items = [
    { to: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
    { to: '/vocabulary', label: 'Words', icon: BookMarked, match: (path: string) => path.startsWith('/vocabulary') },
    { to: '/progress', label: 'Progress', icon: BarChart3, match: (path: string) => path.startsWith('/progress') },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden" aria-label="Quick navigation">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(item => {
          const Icon = item.icon;
          const active = item.match(location.pathname);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors ${active ? 'text-brand' : 'text-muted hover:text-ink'}`}
              aria-current={active ? 'page' : undefined}
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button onClick={onMore} className="flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-muted transition-colors hover:text-ink" aria-label="More options">
          <Menu size={20} />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
