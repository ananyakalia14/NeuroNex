import React, { useEffect } from 'react';
import { useHealthcareStore } from './store/useHealthcareStore';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomTelemetry } from './components/layout/BottomTelemetry';
import { CommandCenter3D } from './components/3d/CommandCenter3D';
import { RightIntelligencePanel } from './components/dashboard/RightIntelligencePanel';
import { DispatchModal } from './components/modals/DispatchModal';
import { CreateEmergencyModal } from './components/modals/CreateEmergencyModal';
import { JudgeDemoModal } from './components/modals/JudgeDemoModal';

// Pages
import { EmergenciesPage } from './pages/EmergenciesPage';
import { AmbulancesPage } from './pages/AmbulancesPage';
import { HospitalsPage } from './pages/HospitalsPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { RoadsPage } from './pages/RoadsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { SimulationPage } from './pages/SimulationPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { Database, AlertTriangle, ArrowRight } from 'lucide-react';

export default function App() {
  const { isAuthenticated, currentRoute, initializeBackend, backendStatus, navigate, judgeDemoModalOpen } = useHealthcareStore();

  useEffect(() => {
    initializeBackend();
  }, [initializeBackend]);

  if (!isAuthenticated || currentRoute === 'login' || currentRoute === 'auth') {
    return <AuthPage />;
  }

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 h-full relative">
              <CommandCenter3D />
            </div>
            <RightIntelligencePanel />
          </div>
        );
      case 'emergencies':
        return <EmergenciesPage />;
      case 'ambulances':
        return <AmbulancesPage />;
      case 'hospitals':
        return <HospitalsPage />;
      case 'doctors':
        return <DoctorsPage />;
      case 'medicines':
        return <MedicinesPage />;
      case 'roads':
        return <RoadsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'ai-assistant':
        return <AiAssistantPage />;
      case 'simulation':
        return <SimulationPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 h-full relative">
              <CommandCenter3D />
            </div>
            <RightIntelligencePanel />
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans select-none">
      {/* Top Telemetry & Control Bar */}
      <TopBar />

      {/* Connection Notice Banner if Supabase is offline/fallback */}
      {backendStatus === 'FALLBACK_LOCAL' && currentRoute !== 'settings' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1 flex items-center justify-between text-xs font-mono text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>BACKEND CONNECTION INTERRUPTED — Operating with full 50-Village, 10-Hospital, 50-Ambulance local engine.</span>
          </div>
          <button
            onClick={() => navigate('settings')}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 underline cursor-pointer"
          >
            <Database className="w-3 h-3" /> Connect Supabase / Seed Tables <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Center Layout: Sidebar + Active Screen View */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden relative bg-[#F8FAFC]">
          {renderCurrentView()}
        </main>
      </div>

      {/* Bottom Telemetry Bar */}
      <BottomTelemetry />

      {/* Global Modals */}
      <DispatchModal />
      <CreateEmergencyModal />
      <JudgeDemoModal
        isOpen={judgeDemoModalOpen}
        onClose={() => useHealthcareStore.setState({ judgeDemoModalOpen: false })}
      />
    </div>
  );
}
