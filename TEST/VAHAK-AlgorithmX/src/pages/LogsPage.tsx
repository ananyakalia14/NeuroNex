import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Terminal,
  Activity,
  AlertTriangle,
  Cpu,
  Sparkles,
  Info,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';

export const LogsPage: React.FC = () => {
  const { logs, addLog } = useHealthcareStore();
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.component.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'WARN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'A_STAR':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AI_TRIAGE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `rural_health_telemetry_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearLogs = () => {
    useHealthcareStore.setState({ logs: [] });
  };

  const handleGenerateTestLog = () => {
    addLog('INFO', 'MANUAL_TEST', `Manual operator audit ping generated at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              System Audit Trail & Telemetry Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
              {logs.length} EVENTS RECORDED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Immutable telemetry stream tracking A* execution cycles, Gemini clinical triage decisions, and SOS transmissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTestLog}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" /> Ping Log
          </button>
          <button
            onClick={handleClearLogs}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-red-600" /> Clear
          </button>
          <button
            onClick={handleExportLogs}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search telemetry messages, algorithm logs, components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono shadow-sm"
          />
        </div>

        {/* Level Pills */}
        <div className="flex items-center gap-1.5 font-mono text-xs w-full sm:w-auto flex-wrap">
          {['ALL', 'CRITICAL', 'A_STAR', 'AI_TRIAGE', 'WARN', 'INFO'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg border transition-all text-[10px] cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log Console View */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 font-mono text-xs space-y-2 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[10px] text-slate-500 font-bold">
          <span>TIMESTAMP | SEVERITY | COMPONENT | TELEMETRY RECORD</span>
          <span>OUTPUT: STREAMING ACTIVE</span>
        </div>

        <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No logs found matching filter.</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-start gap-3 transition-colors text-slate-800"
              >
                <span className="text-slate-400 text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>

                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getLevelBadge(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>

                <span className="text-blue-700 font-bold text-[10px] shrink-0">[{log.component}]</span>

                <span className="text-slate-800 leading-relaxed font-sans text-xs flex-1">
                  {log.message}
                </span>

                {log.meta && (
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline shrink-0">
                    {JSON.stringify(log.meta)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
