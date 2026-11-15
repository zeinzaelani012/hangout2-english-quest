import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { MenuDrawer } from './components/MenuDrawer';
import { ProfileModal } from './components/ProfileModal';
import { Dashboard } from './pages/Dashboard';
import { UnitOverview } from './pages/UnitOverview';
import { QuestMap } from './pages/QuestMap';
import { ActivityPage } from './pages/ActivityPage';
import { Results } from './pages/Results';
import { VocabularyBank } from './pages/VocabularyBank';
import { MyProgress } from './pages/MyProgress';
import { TeacherMode } from './pages/TeacherMode';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { profile } = useProgress();
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!profile) {
      setShowProfileModal(true);
    }
  }, [profile]);

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

      <main className="pt-16 pb-20 lg:pl-0">
        <Routes>
          <Route path="/" element={<Dashboard onEditProfile={() => setShowProfileModal(true)} />} />
          <Route path="/unit/:unitId" element={<UnitOverview />} />
          <Route path="/unit/:unitId/:level" element={<QuestMap />} />
          <Route path="/unit/:unitId/:level/:stationId" element={<ActivityPage />} />
          <Route path="/results" element={<Results />} />
          <Route path="/vocabulary" element={<VocabularyBank />} />
          <Route path="/progress" element={<MyProgress />} />
          <Route path="/teacher" element={<TeacherMode />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
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
