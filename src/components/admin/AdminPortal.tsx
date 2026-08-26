/* ── AdminPortal — Regional Dispatch Commander & Master Control ──
   Features:
   - Interactive Road Blockage Simulator (Floods / Landslides)
   - Dynamic A* Composite Cost Tuner (α, β, γ, δ sliders)
   - Master Fleet Command & Re-assignment
   - Telemetry Audit, Incident Reports Export & Offline Sync
*/

import { useState } from 'react';
import {
  Sliders,
  AlertOctagon,
  Download,
  Ambulance,
  Building2,
  HardDrive,
  RotateCcw,
} from 'lucide-react';
import type { GraphEdge, Hospital, Ambulance as AmbulanceType, Dispatch } from '../../db/schema';
import './AdminPortal.css';

interface AdminPortalProps {
  edges: GraphEdge[];
  hospitals: Hospital[];
  ambulances: AmbulanceType[];
  dispatches: Dispatch[];
  onToggleEdgeBlock: (edgeId: number, blocked: boolean) => void;
  isBlockRoadMode: boolean;
  setIsBlockRoadMode: (val: boolean) => void;
  alpha: number;
  setAlpha: (val: number) => void;
  beta: number;
  setBeta: (val: number) => void;
  gamma: number;
  setGamma: (val: number) => void;
  delta: number;
  setDelta: (val: number) => void;
}

export function AdminPortal({
  edges,
  hospitals,
  ambulances,
  dispatches,
  onToggleEdgeBlock,
  isBlockRoadMode,
  setIsBlockRoadMode,
  alpha,
  setAlpha,
  beta,
  setBeta,
  gamma,
  setGamma,
  delta,
  setDelta,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'blockages' | 'algorithm' | 'fleet' | 'export'>('blockages');

  const blockedEdges = edges.filter((e) => e.blocked);
  const totalBeds = hospitals.reduce((sum, h) => sum + h.bedsTotal, 0);
  const availBeds = hospitals.reduce((sum, h) => sum + h.bedsAvailable, 0);

  const exportIncidentLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dispatches, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `jeevraah_incidents_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const resetWeights = () => {
    setAlpha(0.5);
    setBeta(0.2);
    setGamma(0.15);
    setDelta(0.15);
  };

  return (
    <div className="admin-portal" id="admin-portal">
      {/* Commander Header */}
      <div className="admin-portal__card clay-card">
        <div className="admin-portal__header">
          <div className="admin-portal__identity">
            <div className="admin-portal__avatar">🛡️</div>
            <div>
              <h2 className="admin-portal__title">Regional Command Center</h2>
              <p className="text-xs text-tertiary">Maharashtra Rural Emergency Operations Grid</p>
            </div>
          </div>

          <div className="admin-portal__metrics flex gap-3">
            <div className="admin-portal__mini-metric clay-card--inset">
              <span className="text-xs text-tertiary">Active Roads</span>
              <strong className="text-sm font-bold text-success">
                {(edges.length - blockedEdges.length).toLocaleString()}
              </strong>
            </div>
            <div className="admin-portal__mini-metric clay-card--inset">
              <span className="text-xs text-tertiary">Blocked</span>
              <strong className="text-sm font-bold text-danger">{blockedEdges.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="admin-portal__tabs">
        <button
          className={`admin-portal__tab ${activeTab === 'blockages' ? 'admin-portal__tab--active' : ''}`}
          onClick={() => setActiveTab('blockages')}
        >
          <AlertOctagon size={16} /> Road Blockages
        </button>
        <button
          className={`admin-portal__tab ${activeTab === 'algorithm' ? 'admin-portal__tab--active' : ''}`}
          onClick={() => setActiveTab('algorithm')}
        >
          <Sliders size={16} /> A* Algorithm Tuner
        </button>
        <button
          className={`admin-portal__tab ${activeTab === 'fleet' ? 'admin-portal__tab--active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          <Ambulance size={16} /> Fleet & Resources
        </button>
        <button
          className={`admin-portal__tab ${activeTab === 'export' ? 'admin-portal__tab--active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          <Download size={16} /> Reports & Sync
        </button>
      </div>

      {/* Tab 1: Road Blockage Tool */}
      {activeTab === 'blockages' && (
        <div className="admin-portal__section clay-card">
          <div className="admin-portal__block-tool">
            <div>
              <h3 className="text-md font-bold text-danger flex items-center gap-2">
                <AlertOctagon size={18} /> Interactive Road Blocker
              </h3>
              <p className="text-xs text-secondary mt-1">
                Toggle "Block Road Mode", then click any road or node on the map to simulate landslides or flood blockades. The A* engine will immediately recalculate alternative routes.
              </p>
            </div>

            <button
              className={`clay-btn clay-btn--lg ${isBlockRoadMode ? 'clay-btn--danger' : 'clay-btn--primary'}`}
              onClick={() => setIsBlockRoadMode(!isBlockRoadMode)}
              id="admin-block-mode-toggle"
            >
              <AlertOctagon size={20} />
              {isBlockRoadMode ? 'CANCEL BLOCK MODE' : 'ACTIVATE BLOCK TOOL'}
            </button>
          </div>

          <div className="admin-portal__blocked-list">
            <h4 className="text-sm font-bold text-secondary">
              Currently Blocked Road Segments ({blockedEdges.length})
            </h4>

            {blockedEdges.length === 0 ? (
              <p className="text-xs text-tertiary italic">No active road closures in the network.</p>
            ) : (
              <div className="admin-portal__blocked-grid">
                {blockedEdges.slice(0, 10).map((edge) => (
                  <div key={edge.id} className="admin-portal__blocked-item clay-card--inset">
                    <div>
                      <strong className="text-xs">Road #{edge.id} (Node {edge.u} ⇄ {edge.v})</strong>
                      <p className="text-xs text-danger font-semibold">Status: BLOCKED / CLOSED</p>
                    </div>
                    <button
                      className="clay-btn clay-btn--xs clay-btn--ghost text-success"
                      onClick={() => onToggleEdgeBlock(edge.id, false)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: A* Algorithm Tuner */}
      {activeTab === 'algorithm' && (
        <div className="admin-portal__section clay-card">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md font-bold text-primary flex items-center gap-2">
                <Sliders size={18} /> A* Composite Cost Function Weights
              </h3>
              <p className="text-xs text-secondary mt-1">
                Formula: <code>Cost = α·TravelTime + β·WaitTime + γ·MedicinePenalty + δ·BedPenalty</code>
              </p>
            </div>
            <button className="clay-btn clay-btn--sm clay-btn--ghost" onClick={resetWeights}>
              <RotateCcw size={14} /> Reset Defaults
            </button>
          </div>

          <div className="admin-portal__sliders">
            {/* Alpha */}
            <div className="admin-portal__slider-group clay-card--inset">
              <div className="flex justify-between text-sm">
                <strong>α (Travel Time Weight)</strong>
                <span className="font-bold text-success">{Math.round(alpha * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="admin-portal__slider"
              />
              <span className="text-xs text-tertiary">Prioritizes shorter road travel time in minutes.</span>
            </div>

            {/* Beta */}
            <div className="admin-portal__slider-group clay-card--inset">
              <div className="flex justify-between text-sm">
                <strong>β (Hospital Wait Time Weight)</strong>
                <span className="font-bold text-info">{Math.round(beta * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="admin-portal__slider"
              />
              <span className="text-xs text-tertiary">Penalizes crowded hospitals with low bed ratios.</span>
            </div>

            {/* Gamma */}
            <div className="admin-portal__slider-group clay-card--inset">
              <div className="flex justify-between text-sm">
                <strong>γ (Medicine Availability Penalty)</strong>
                <span className="font-bold text-warning">{Math.round(gamma * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
                className="admin-portal__slider"
              />
              <span className="text-xs text-tertiary">Redirects patient if required medication is depleted.</span>
            </div>

            {/* Delta */}
            <div className="admin-portal__slider-group clay-card--inset">
              <div className="flex justify-between text-sm">
                <strong>δ (Bed Capacity Penalty)</strong>
                <span className="font-bold text-danger">{Math.round(delta * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={delta}
                onChange={(e) => setDelta(parseFloat(e.target.value))}
                className="admin-portal__slider"
              />
              <span className="text-xs text-tertiary">Avoids facilities at 100% capacity.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fleet & Resources */}
      {activeTab === 'fleet' && (
        <div className="admin-portal__section clay-card">
          <div className="admin-portal__fleet-summary grid grid-cols-2 gap-3">
            <div className="clay-card--inset p-3">
              <strong className="text-sm flex items-center gap-1">
                <Ambulance size={16} /> Total Fleet
              </strong>
              <div className="text-2xl font-black mt-1">{ambulances.length} Units</div>
              <span className="text-xs text-secondary">
                {ambulances.filter((a) => a.vehicleType === 'ALS').length} Advanced (ALS) •{' '}
                {ambulances.filter((a) => a.vehicleType === 'BLS').length} Basic (BLS)
              </span>
            </div>

            <div className="clay-card--inset p-3">
              <strong className="text-sm flex items-center gap-1">
                <Building2 size={16} /> Regional Beds
              </strong>
              <div className="text-2xl font-black mt-1 text-success">{availBeds} / {totalBeds}</div>
              <span className="text-xs text-secondary">{hospitals.length} Connected Facilities</span>
            </div>
          </div>

          <div className="admin-portal__amb-grid">
            {ambulances.map((amb) => (
              <div key={amb.id} className="admin-portal__amb-card clay-card--flat">
                <div className="flex justify-between items-center">
                  <strong className="text-xs">Ambulance #{amb.id + 1}</strong>
                  <span className={`clay-badge clay-badge--${amb.status === 'IDLE' ? 'success' : 'warning'}`}>
                    {amb.status}
                  </span>
                </div>
                <div className="text-xs text-tertiary mt-1">
                  Type: {amb.vehicleType} • Node #{amb.currentNodeId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Export & Sync */}
      {activeTab === 'export' && (
        <div className="admin-portal__section clay-card">
          <h3 className="text-md font-bold text-primary flex items-center gap-2">
            <HardDrive size={18} /> Incident Logs & Data Governance
          </h3>

          <div className="admin-portal__export-box clay-card--inset">
            <div>
              <strong>Export Algowebathon Incident Telemetry</strong>
              <p className="text-xs text-tertiary">Download complete dispatch records with A* route decision rationales.</p>
            </div>
            <button className="clay-btn clay-btn--primary" onClick={exportIncidentLog}>
              <Download size={16} /> Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
