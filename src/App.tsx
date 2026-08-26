/* ── App Root — Splash → LoginPage (Patient SOS / Hospital & Admin Login) → Dashboard ── */

import { useState, useCallback, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/Dashboard';
import { OfflineProvider } from './hooks/useOfflineStatus';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { isDbSeeded } from './db/schema';
import { seedDatabase } from './db/seed';
import { LanguageProvider } from './i18n/LanguageContext';
import './App.css';

function MainNavigator() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState('Initializing database...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [splashFinished, setSplashFinished] = useState(false);

  // Initialize database
  useEffect(() => {
    async function init() {
      try {
        const seeded = await isDbSeeded();
        if (!seeded) {
          setLoadingPhase('Seeding 50,000+ Node Emergency Graph...');
          await seedDatabase((phase, progress) => {
            setLoadingPhase(phase);
            setLoadingProgress(progress);
          });
        } else {
          setLoadingPhase('Database ready');
          setLoadingProgress(100);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('DB init error:', err);
        setLoadingPhase('Error initializing database');
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleSplashComplete = useCallback(() => {
    setSplashFinished(true);
  }, []);

  if (!splashFinished) {
    return (
      <SplashScreen
        isLoading={isLoading}
        loadingPhase={loadingPhase}
        loadingProgress={loadingProgress}
        onComplete={handleSplashComplete}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OfflineProvider>
          <div className="app">
            <MainNavigator />
          </div>
        </OfflineProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
