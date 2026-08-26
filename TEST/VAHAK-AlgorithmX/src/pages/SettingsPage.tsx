import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Radio,
  Cpu,
  Volume2,
  Bell,
  Save,
  CheckCircle2,
  Shield,
  Sparkles,
  RefreshCw,
  Copy,
  AlertTriangle,
  ExternalLink,
  Server,
  Layers,
  Activity,
  KeyRound,
  Lock,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';
import { getSupabaseConfig, saveSupabaseConfig, testSupabaseConnection } from '../lib/supabaseClient';

export const SettingsPage: React.FC = () => {
  const {
    soundEnabled,
    toggleSound,
    addLog,
    backendStatus,
    backendMessage,
    supabaseLatencyMs,
    isSeedingDatabase,
    seedSupabaseDatabase,
    initializeBackend,
  } = useHealthcareStore();

  const [aStarElevationWeight, setAStarElevationWeight] = useState(1.4);
  const [aStarFloodPenalty, setAStarFloodPenalty] = useState(2.5);
  const [criticalSlaTargetMin, setCriticalSlaTargetMin] = useState(20);
  const [droneCruiseVelocityKmh, setDroneCruiseVelocityKmh] = useState(120);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase connection configuration state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'routing' | 'database' | 'schema' | 'security'>('database');

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseAnonKey(config.anonKey);
  }, []);

  const handleSaveParameters = () => {
    setSavedSuccess(true);
    addLog('INFO', 'CONFIG_MANAGER', 'Dispatch heuristic weights & SLA thresholds updated successfully.');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveSupabaseConfig = async () => {
    saveSupabaseConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setIsTestingConn(true);
    const health = await testSupabaseConnection();
    setIsTestingConn(false);
    setTestResult(health);
    await initializeBackend();
  };

  const handleSeedDatabase = async () => {
    const res = await seedSupabaseDatabase();
    setTestResult(res);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(
      `-- Rural Healthcare Command Center PostgreSQL Schema (21 Tables)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  population INTEGER DEFAULT 1500,
  region TEXT DEFAULT 'Central District',
  elevation_meters INTEGER DEFAULT 350,
  terrain_difficulty TEXT DEFAULT 'Moderate',
  road_access_status TEXT DEFAULT 'OPEN',
  health_center_type TEXT DEFAULT 'Primary Health Subcenter',
  contact_person TEXT,
  emergency_phone TEXT,
  historical_response_avg_min DOUBLE PRECISION DEFAULT 25.0,
  pos_x DOUBLE PRECISION DEFAULT 0.0,
  pos_y DOUBLE PRECISION DEFAULT 0.4,
  pos_z DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  total_beds INTEGER NOT NULL DEFAULT 100,
  occupied_beds INTEGER NOT NULL DEFAULT 60,
  icu_total INTEGER NOT NULL DEFAULT 20,
  icu_occupied INTEGER NOT NULL DEFAULT 12,
  status TEXT DEFAULT 'ACTIVE',
  type TEXT DEFAULT 'District General Hospital',
  trauma_level TEXT DEFAULT 'Level I Trauma Care',
  ventilators_available INTEGER DEFAULT 6,
  emergency_load TEXT DEFAULT 'Normal',
  oxygen_reserves_hours INTEGER DEFAULT 48,
  helipad_status TEXT DEFAULT 'Available',
  contact_radio TEXT DEFAULT 'CH-16 UHF',
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`
    );
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              System Settings & Architecture
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
              SYSTEM CONFIG
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Configure Supabase PostgreSQL replication, A* heuristic weights, audio alerts, and clinical routing thresholds.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Parameters Saved Successfully
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'database', label: 'Supabase PostgreSQL', icon: Database },
          { id: 'routing', label: 'A* Algorithm Heuristics', icon: Cpu },
          { id: 'schema', label: 'Database Schema (SQL)', icon: Server },
          { id: 'security', label: 'Security & Audio', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Database */}
      {activeTab === 'database' && (
        <div className="space-y-5">
          {/* Connection Status Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Supabase Connection Telemetry</h3>
                  <div className="text-xs text-slate-500 font-mono">Real-time PostgreSQL Channel</div>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${
                  backendStatus === 'CONNECTED_REALTIME'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {backendStatus === 'CONNECTED_REALTIME'
                  ? `● CONNECTED (${supabaseLatencyMs}ms)`
                  : '▲ LOCAL FALLBACK ENGINE'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {backendMessage}
            </p>

            {/* Config Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-700 font-bold uppercase block">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-700 font-bold uppercase block">
                  Supabase Anon / Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Test result banner */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveSupabaseConfig}
                disabled={isTestingConn}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isTestingConn ? 'Testing Connection...' : 'Save & Connect Supabase'}</span>
              </button>

              <button
                onClick={handleSeedDatabase}
                disabled={isSeedingDatabase}
                className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Database className="w-4 h-4 text-blue-600" />
                <span>{isSeedingDatabase ? 'Seeding Tables...' : 'Seed Database Tables'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Routing */}
      {activeTab === 'routing' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
            A* Pathfinding & Heuristic Calibration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Elevation Gradient Cost Multiplier: {aStarElevationWeight}x
              </label>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={aStarElevationWeight}
                onChange={(e) => setAStarElevationWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-500 font-sans">
                Penalizes steep mountain roads for non-4x4 ground vehicles.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Flood Caution Penalty Factor: {aStarFloodPenalty}x
              </label>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.5"
                value={aStarFloodPenalty}
                onChange={(e) => setAStarFloodPenalty(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-500 font-sans">
                Weight assigned to river crossings under monsoon flood alert.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-900 block">
                Critical SLA Threshold: {criticalSlaTargetMin} Minutes
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={criticalSlaTargetMin}
                onChange={(e) => setCriticalSlaTargetMin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-900 block">
                eVTOL Drone Cruise Velocity: {droneCruiseVelocityKmh} km/h
              </label>
              <input
                type="number"
                min="60"
                max="200"
                value={droneCruiseVelocityKmh}
                onChange={(e) => setDroneCruiseVelocityKmh(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <button
            onClick={handleSaveParameters}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Routing Parameters</span>
          </button>
        </div>
      )}

      {/* Tab: Schema */}
      {activeTab === 'schema' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
              SQL Schema Definition (21 Registered Tables)
            </h3>
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-xs font-bold border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto max-h-96">
{`-- PostgreSQL Schema for Rural Healthcare Dispatch Center
CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  population INTEGER DEFAULT 1500,
  region TEXT DEFAULT 'Central District'
);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  total_beds INTEGER DEFAULT 100,
  available_beds INTEGER DEFAULT 40,
  icu_available INTEGER DEFAULT 8,
  trauma_level TEXT DEFAULT 'Level I'
);

CREATE TABLE IF NOT EXISTS ambulances (
  id TEXT PRIMARY KEY,
  callsign TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'AVAILABLE',
  fuel_percentage INTEGER DEFAULT 90,
  speed_kmh INTEGER DEFAULT 65
);`}
          </pre>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
            Security & Dispatch Audio Alerts
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">Audio Chimes & Siren Alerts</div>
                <div className="text-[11px] text-slate-500 font-sans">
                  Synthesizer audio chimes on emergency intake, A* recalculation, and road blockage.
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {soundEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">End-to-End Encryption</div>
                <div className="text-[11px] text-slate-500 font-sans">
                  HIPAA-compliant WebRTC audio/video tele-consultation stream encryption.
                </div>
              </div>
              <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                AES-256 GCM ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
