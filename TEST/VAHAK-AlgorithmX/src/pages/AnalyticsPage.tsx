import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Plane,
  Truck,
  Download,
  Calendar,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';

export const AnalyticsPage: React.FC = () => {
  const { metrics } = useHealthcareStore();
  const [timeRange, setTimeRange] = useState<'TODAY' | '7D' | '30D'>('7D');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const hourlyData = [
    { hour: '00:00', emergencies: 2, groundTime: 32, droneTime: 14 },
    { hour: '03:00', emergencies: 1, groundTime: 28, droneTime: 12 },
    { hour: '06:00', emergencies: 4, groundTime: 30, droneTime: 15 },
    { hour: '09:00', emergencies: 8, groundTime: 36, droneTime: 16 },
    { hour: '12:00', emergencies: 6, groundTime: 29, droneTime: 14 },
    { hour: '15:00', emergencies: 11, groundTime: 38, droneTime: 18 },
    { hour: '18:00', emergencies: 9, groundTime: 34, droneTime: 15 },
    { hour: '21:00', emergencies: 5, groundTime: 31, droneTime: 13 },
  ];

  const categoryData = [
    { name: 'Cardiovascular', value: 34, color: '#EF4444' },
    { name: 'Trauma & Accident', value: 28, color: '#F97316' },
    { name: 'High-Risk OB/GYN', value: 18, color: '#8B5CF6' },
    { name: 'Snakebite & Venom', value: 12, color: '#10B981' },
    { name: 'Respiratory Distress', value: 8, color: '#0EA5E9' },
  ];

  const villageCompliance = [
    { village: 'Dharnai', compliance: 96, avgTime: 18 },
    { village: 'Pothahi', compliance: 94, avgTime: 22 },
    { village: 'Tarari', compliance: 88, avgTime: 31 },
    { village: 'Kalyanpur', compliance: 91, avgTime: 25 },
    { village: 'Belsar', compliance: 95, avgTime: 19 },
    { village: 'Chakia', compliance: 82, avgTime: 38 },
  ];

  const handleExportCsv = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Settlement,Compliance_Percent,Avg_Response_Time_Min\n' +
      villageCompliance.map((v) => `${v.village},${v.compliance}%,${v.avgTime}m`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rural_healthcare_sla_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              Operational Analytics & SLA Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
              GOLDEN HOUR COMPLIANCE: 94.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Historical benchmarking of rural dispatch times, ground vs eVTOL drone efficiencies, and clinical triage patterns.
          </p>
        </div>

        {/* Action Buttons & Timeframe Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 font-mono text-xs shadow-sm">
            {(['TODAY', '7D', '30D'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>{downloadSuccess ? 'Exported CSV ✓' : 'Export SLA Report'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-bold">AVG GROUND DISPATCH</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            28.4 <span className="text-xs text-slate-400 font-normal">MIN</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3 h-3" /> -12.4% vs last quarter
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-bold">AVG eVTOL FLIGHT TIME</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            14.2 <span className="text-xs text-slate-400 font-normal">MIN</span>
          </div>
          <div className="text-[10px] text-purple-700 mt-1 flex items-center gap-1 font-bold">
            <Plane className="w-3 h-3" /> 2.1x faster than ground
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-bold">SLA COMPLIANCE (30m)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{metrics.slaComplianceRate}%</div>
          <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" /> Target exceeded (&gt;90%)
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-bold">LIVES IMPACTED (YTD)</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">4,892</div>
          <div className="text-[10px] text-slate-500 mt-1 font-sans">Across 18 rural clusters</div>
        </div>
      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Response Time Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
              Response Time: Ground ALS vs. eVTOL Drone (Minutes)
            </h3>
            <span className="text-[10px] font-mono text-blue-600 font-bold">24-Hour Trend</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="hour" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="groundTime"
                  name="Ground ALS (min)"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="droneTime"
                  name="eVTOL Drone (min)"
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clinical Emergency Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
              Incident Case Distribution by Category
            </h3>
            <span className="text-[10px] font-mono text-purple-700 font-bold">Triage Records</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Compliance by Village Settlement */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-3 lg:col-span-2 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase">
              SLA Target Compliance Rate (%) by Rural Settlement
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">Target &gt; 90%</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villageCompliance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="village" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" domain={[60, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="compliance" name="SLA Compliance %" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
