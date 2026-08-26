/* ── TelemetryPanel — Fleet Status & Resource Meters ── */

import { Ambulance, BedDouble, Pill, HardDrive, Cpu } from 'lucide-react';
import type { Hospital, Ambulance as AmbulanceType } from '../db/schema';
import './TelemetryPanel.css';

interface TelemetryPanelProps {
  hospitals: Hospital[];
  ambulances: AmbulanceType[];
  nodeCount: number;
  edgeCount: number;
  workerReady: boolean;
}

export function TelemetryPanel({ hospitals, ambulances, nodeCount, edgeCount, workerReady }: TelemetryPanelProps) {
  const totalBeds = hospitals.reduce((sum, h) => sum + h.bedsTotal, 0);
  const availBeds = hospitals.reduce((sum, h) => sum + h.bedsAvailable, 0);
  const idleAmb = ambulances.filter((a) => a.status === 'IDLE').length;
  const activeAmb = ambulances.filter((a) => a.status !== 'IDLE').length;

  // Critical medicine check across all hospitals
  const criticalMeds: string[] = [];
  const medTotals = new Map<string, number>();
  for (const h of hospitals) {
    for (const [med, qty] of Object.entries(h.medicineStock)) {
      medTotals.set(med, (medTotals.get(med) || 0) + qty);
    }
  }
  for (const [med, total] of medTotals) {
    if (total < 50) criticalMeds.push(med);
  }

  return (
    <div className="telemetry clay-card" id="telemetry-panel">
      <h2 className="telemetry__title">
        <Cpu size={18} />
        System Telemetry
      </h2>

      <div className="telemetry__grid">
        {/* Fleet */}
        <div className="telemetry__metric">
          <div className="telemetry__metric-header">
            <Ambulance size={16} />
            <span>Fleet</span>
          </div>
          <div className="telemetry__metric-value">
            <span className="telemetry__big-num">{idleAmb}</span>
            <span className="text-xs text-tertiary">idle</span>
          </div>
          <div className="telemetry__metric-sub">
            <span className={activeAmb > 0 ? 'text-warning' : 'text-success'}>
              {activeAmb} active
            </span>
            <span className="text-tertiary">/ {ambulances.length} total</span>
          </div>
          <div className="clay-progress" style={{ height: 5 }}>
            <div className="clay-progress__fill" style={{ width: `${(idleAmb / Math.max(1, ambulances.length)) * 100}%` }} />
          </div>
        </div>

        {/* Beds */}
        <div className="telemetry__metric">
          <div className="telemetry__metric-header">
            <BedDouble size={16} />
            <span>Beds</span>
          </div>
          <div className="telemetry__metric-value">
            <span className="telemetry__big-num">{availBeds}</span>
            <span className="text-xs text-tertiary">available</span>
          </div>
          <div className="telemetry__metric-sub">
            <span className="text-tertiary">/ {totalBeds} total</span>
          </div>
          <div className="clay-progress" style={{ height: 5 }}>
            <div
              className={`clay-progress__fill ${availBeds / totalBeds < 0.2 ? 'clay-progress__fill--danger' : ''}`}
              style={{ width: `${(availBeds / Math.max(1, totalBeds)) * 100}%` }}
            />
          </div>
        </div>

        {/* Medicine alerts */}
        <div className="telemetry__metric">
          <div className="telemetry__metric-header">
            <Pill size={16} />
            <span>Medicine</span>
            {criticalMeds.length > 0 && (
              <span className="clay-badge clay-badge--danger">{criticalMeds.length} low</span>
            )}
          </div>
          {criticalMeds.length > 0 ? (
            <div className="telemetry__med-list">
              {criticalMeds.slice(0, 4).map((med) => (
                <span key={med} className="telemetry__med-tag text-danger">{med}</span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-success">All stocked ✓</span>
          )}
        </div>

        {/* System health */}
        <div className="telemetry__metric">
          <div className="telemetry__metric-header">
            <HardDrive size={16} />
            <span>System</span>
            <span className={`pulse-dot ${workerReady ? '' : 'pulse-dot--danger'}`} />
          </div>
          <div className="telemetry__sys-stats">
            <div className="telemetry__sys-row">
              <span className="text-xs text-tertiary">Graph Nodes</span>
              <span className="text-xs font-bold">{nodeCount.toLocaleString()}</span>
            </div>
            <div className="telemetry__sys-row">
              <span className="text-xs text-tertiary">Road Edges</span>
              <span className="text-xs font-bold">{edgeCount.toLocaleString()}</span>
            </div>
            <div className="telemetry__sys-row">
              <span className="text-xs text-tertiary">Worker</span>
              <span className={`text-xs font-bold ${workerReady ? 'text-success' : 'text-danger'}`}>
                {workerReady ? 'Ready' : 'Loading...'}
              </span>
            </div>
            <div className="telemetry__sys-row">
              <span className="text-xs text-tertiary">Storage</span>
              <span className="text-xs font-bold">IndexedDB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
