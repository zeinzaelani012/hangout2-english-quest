import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { MenuDrawer } from './components/MenuDrawer';
import { ProfileModal } from './components/ProfileModal';
import { DebugPanel } from './components/DebugPanel';
import { stopOnRouteChange, syncMusicForRoute, installUiSoundUnlock } from './lib/audio';

// Route-level code splitting — every page is a separate chunk
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const WordIntro = lazy(() => import('./pages/WordIntro').then(m => ({ default: m.WordIntro })));
const UnitOverview = lazy(() => import('./pages/UnitOverview').then(m => ({ default: m.UnitOverview })));
const QuestMap = lazy(() => import('./pages/QuestMap').then(m => ({ default: m.QuestMap })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
const Results = lazy(() => import('./pages/Results').then(m => ({ default: m.Results })));
const VocabularyBank = lazy(() => import('./pages/VocabularyBank').then(m => ({ default: m.VocabularyBank })));
const MyProgress = lazy(() => import('./pages/MyProgress').then(m => ({ default: m.MyProgress })));
const TeacherMode = lazy(() => import('./pages/TeacherMode').then(m => ({ default: m.TeacherMode })));
const PresentMode = lazy(() => import('./pages/PresentMode').then(m => ({ default: m.PresentMode })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SelfCheckPage = lazy(() => import('./pages/SelfCheckPage').then(m => ({ default: m.SelfCheckPage })));
const CapstonePage = lazy(() => import('./pages/CapstonePage').then(m => ({ default: m.CapstonePage })));
const CapstoneStationPage = lazy(() => import('./pages/CapstoneStationPage').then(m => ({ default: m.CapstoneStationPage })));
const FinalGatePage = lazy(() => import('./pages/FinalGatePage').then(m => ({ default: m.FinalGatePage })));
const FinalGateResultsPage = lazy(() => import('./pages/FinalGatePage').then(m => ({ default: m.FinalGateResultsPage })));
// PHASE 10 — the dev type matrix is dev-only: the dynamic import is guarded
// so a production build never ships the route or its chunk.
const DevTypeMatrixPage = import.meta.env.DEV
  ? lazy(() => import('./pages/DevTypeMatrixPage').then(m => ({ default: m.DevTypeMatrixPage })))
  : null;

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <div className="w-8 h-8 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
    </div>
  );
}

function AppContent() {
  const { profile } = useProgress();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    installUiSoundUnlock();
  }, []);

  useEffect(() => {
    if (!profile) {
      setShowProfileModal(true);
      autoOpenedRef.current = true;
    } else if (autoOpenedRef.current) {
      // The initial save completed — close the modal we auto-opened
      autoOpenedRef.current = false;
      setShowProfileModal(false);
    }
  }, [profile]);

  // Part D rule 4 / Part K rule 7 — audio never bleeds across screens: stop
  // everything on every route change, and after 30 s of tab backgrounding.
  // Background music is the one exception: it cross-fades to the next
  // surface's mood instead of stopping.
  useEffect(() => {
    stopOnRouteChange();
    syncMusicForRoute(location.pathname);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onVisibility = () => {
      if (document.hidden) {
        timer = setTimeout(() => stopOnRouteChange(), 30_000);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <MenuDrawer />
      {showProfileModal && !profile && (
        <ProfileModal
          isInitial
          onClose={() => setShowProfileModal(false)}
        />
      )}
      {showProfileModal && profile && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
        />
      )}

      <main className="pt-16 pb-20 lg:pb-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard onEditProfile={() => setShowProfileModal(true)} />} />
            <Route path="/unit/:unitId/words" element={<WordIntro />} />
            <Route path="/unit/:unitId" element={<UnitOverview />} />
            <Route path="/unit/:unitId/:level" element={<QuestMap />} />
            <Route path="/unit/:unitId/:level/self-check" element={<SelfCheckPage />} />
            <Route path="/unit/:unitId/:level/:stationId" element={<ActivityPage />} />
            <Route path="/results" element={<Results />} />
            <Route path="/vocabulary" element={<VocabularyBank />} />
            <Route path="/progress" element={<MyProgress />} />
            <Route path="/teacher" element={<TeacherMode />} />
            <Route path="/teacher/present" element={<PresentMode />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/capstone" element={<CapstonePage />} />
            <Route path="/capstone/station/:islandId/:stationId" element={<CapstoneStationPage />} />
            <Route path="/capstone/final-gate" element={<FinalGatePage />} />
            <Route path="/capstone/final-gate/results" element={<FinalGateResultsPage />} />
            <Route path="/capstone/certificate" element={<FinalGateResultsPage />} />
            {DevTypeMatrixPage && (
              <Route path="/dev/type-matrix" element={<DevTypeMatrixPage />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <DebugPanel />
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <AppContent />
    </ProgressProvider>
  );
}
