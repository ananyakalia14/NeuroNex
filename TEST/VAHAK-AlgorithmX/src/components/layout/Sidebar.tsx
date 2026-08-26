import React from 'react';
import {
  LayoutDashboard,
  Flame,
  Truck,
  Building2,
  Stethoscope,
  Pill,
  Navigation,
  BarChart3,
  Sparkles,
  PlayCircle,
  FileText,
  Settings,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { currentRoute, navigate, emergencies, ambulances } = useHealthcareStore();

  const activeEmergenciesCount = emergencies.filter((e) => e.status !== 'RESOLVED').length;
  const activeAmbulancesCount = ambulances.filter((a) => a.status === 'Dispatched En Route' || a.status === 'Transporting to Hospital').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: '3D Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'emergencies',
      label: 'Emergencies',
      icon: Flame,
      badge: activeEmergenciesCount > 0 ? `0${activeEmergenciesCount}` : undefined,
      badgeColor: 'bg-red-950 text-red-400 border-red-500/40 animate-pulse',
    },
    {
      id: 'ambulances',
      label: 'Ambulances',
      icon: Truck,
      badge: `${activeAmbulancesCount} active`,
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-500/40',
    },
    {
      id: 'hospitals',
      label: 'Hospitals',
      icon: Building2,
    },
    {
      id: 'doctors',
      label: 'Doctors',
      icon: Stethoscope,
    },
    {
      id: 'medicines',
      label: 'Medicines',
      icon: Pill,
    },
    {
      id: 'roads',
      label: 'Road Network',
      icon: Navigation,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      badge: 'GEMINI',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/40 font-mono',
    },
    {
      id: 'simulation',
      label: 'Simulation',
      icon: PlayCircle,
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-200 flex flex-col justify-between select-none z-20 shadow-sm">
      {/* Navigation List */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
          Operation Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id || currentRoute.startsWith(`${item.id}/`);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold ${
                    isActive
                      ? 'bg-blue-700 text-white border-blue-400'
                      : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Emergency Link Badge */}
      <div className="p-3 border-t border-slate-200">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 mb-1">
            <span className="flex items-center gap-1.5 text-blue-600 font-mono">
              <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              SATELLITE MESH
            </span>
            <span className="text-emerald-600 text-[10px] font-mono">99.98%</span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
            Autonomous fail-safe routing with offline A* heuristic active.
          </p>
        </div>
      </div>
    </aside>
  );
};
