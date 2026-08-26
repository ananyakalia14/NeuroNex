/* ── Dashboard — Role-Aware Tri-Portal System (Patient / Hospital / Admin) ── */

import { useState, useCallback, useEffect } from 'react';
import { Map, Building2, Activity, User, ShieldCheck, Ambulance } from 'lucide-react';
import { MapView } from './MapView';
import { TelemetryPanel } from './TelemetryPanel';
import { DecisionLog } from './DecisionLog';
import { Navbar } from './Navbar';
import { PatientPortal } from './patient/PatientPortal';
import { DriverPortal } from './driver/DriverPortal';
import { HospitalPortal } from './hospital/HospitalPortal';
import { AdminPortal } from './admin/AdminPortal';
import { usePathfinder } from '../hooks/usePathfinder';
import { useHospitals, useDispatches, useAmbulances, useNodes, useEdges } from '../hooks/useDatabase';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useAuth } from '../hooks/useAuth';
import { db } from '../db/schema';
import type { UrgencyTier, Specialty, GraphNode, GraphEdge } from '../db/schema';
import type { RouteResult } from '../workers/types';
import { generateId } from '../utils/geo';
import './Dashboard.css';

type MobileTab = 'map' | 'portal' | 'telemetry';

export function Dashboard() {
  // Auth Context
  const { role, profile } = useAuth();

  // State
  const [mobileTab, setMobileTab] = useState<MobileTab>('portal');
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(profile.villageNodeId || 1630);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [routeNodeIds, setRouteNodeIds] = useState<number[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  // Draggable Map / Sidebar Resizer State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jeevraah_sidebar_width');
      return saved ? parseInt(saved, 10) : 380;
    } catch {
      return 380;
    }
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 0), 720);
      if (newWidth < 140) {
        setSidebarWidth(0); // Snap collapse
      } else {
        setSidebarWidth(newWidth);
      }
      window.dispatchEvent(new Event('resize'));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('jeevraah_sidebar_width', sidebarWidth.toString());
      } catch {
        // ignore
      }
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sidebarWidth]);

  // Admin Road Block Mode & A* weights
  const [isBlockRoadMode, setIsBlockRoadMode] = useState(false);
  const [alpha, setAlpha] = useState(0.50);
  const [beta, setBeta] = useState(0.20);
  const [gamma, setGamma] = useState(0.15);
  const [delta, setDelta] = useState(0.15);

  // Hooks
  const pathfinder = usePathfinder();
  const { hospitals, updateBeds, updateMedicine } = useHospitals();
  const { dispatches, addDispatch, pendingCount } = useDispatches();
  const { ambulances, idleCount, activeCount } = useAmbulances();
  const { nodes, isLoaded, loadNodes } = useNodes();
  const { loadEdges } = useEdges();
  const { effectivelyOnline } = useOfflineStatus();

  // Initialize
  useEffect(() => {
    loadNodes();
    loadEdges().then(setEdges);
  }, [loadNodes, loadEdges]);

  // Init pathfinder when data is ready
  useEffect(() => {
    if (isLoaded && nodes.length > 0 && !pathfinder.isInitialized) {
      pathfinder.initializeGraph();
    }
  }, [isLoaded, nodes.length, pathfinder.isInitialized, pathfinder.initializeGraph]);

  // Sync default node for profile
  useEffect(() => {
    if (profile.villageNodeId) {
      setSelectedNodeId(profile.villageNodeId);
      db.nodes.get(profile.villageNodeId).then((n) => {
        if (n) setSelectedNode(n);
      });
    }
  }, [profile.villageNodeId]);

  // Auto-restore active route if dispatches exist
  useEffect(() => {
    if (dispatches.length > 0 && routeNodeIds.length === 0) {
      const latest = dispatches[0];
      if (latest.routeNodeIds && latest.routeNodeIds.length > 0) {
        setRouteNodeIds(latest.routeNodeIds);
      }
    }
  }, [dispatches, routeNodeIds.length]);

  // Handle node selection on map
  const handleNodeSelect = useCallback(async (nodeId: number) => {
    setSelectedNodeId(nodeId);
    const node = await db.nodes.get(nodeId);
    if (node) setSelectedNode(node);
  }, []);

  // Handle road blockage toggle (for Admin)
  const handleToggleEdgeBlock = useCallback(async (edgeId: number, blocked: boolean) => {
    await db.edges.update(edgeId, { blocked });
    pathfinder.updateEdge(edgeId, blocked);
    setEdges((prev) => prev.map((e) => (e.id === edgeId ? { ...e, blocked } : e)));
  }, [pathfinder]);

  // Handle dispatch execution
  const handleDispatch = useCallback(
    async (urgencyTier: UrgencyTier, specialty?: Specialty, medicine?: string) => {
      const sourceId = selectedNodeId || profile.villageNodeId || 1630;
      const sourceObj = selectedNode || (await db.nodes.get(sourceId));

      try {
        const result: RouteResult = await pathfinder.findRoute(sourceId, urgencyTier, specialty, medicine);

        // Save dispatch to DB with mutual contact numbers
        const driverName = 'Santosh Shinde (108 Pilot)';
        const driverPhone = '+91 98200 11080';
        const ambulanceNumber = 'MH-05-EM-1080';

        await addDispatch({
          patientId: generateId(),
          patientName: role === 'patient' ? profile.name : `Patient at ${sourceObj?.name || `Node #${sourceId}`}`,
          patientPhone: profile.phone || localStorage.getItem('jeevraah_patient_phone') || '+91 98330 54321',
          driverName,
          driverPhone,
          ambulanceNumber,
          sourceNodeId: sourceId,
          urgencyTier,
          requiredSpecialty: specialty,
          requiredMedicine: medicine,
          assignedHospitalId: result.hospitalId,
          assignedAmbulanceId: 0,
          routeNodeIds: result.routeNodeIds,
          routeDistance: result.totalDistance,
          routeTime: result.totalTime,
          status: effectivelyOnline ? 'DISPATCHED' : 'SYNC_PENDING',
          eta: result.totalTime,
          rationale: result.rationale,
          alternativesConsidered: result.alternativesConsidered,
          timestamp: Date.now(),
        });

        // Show route on map
        setRouteNodeIds(result.routeNodeIds);

        // Update hospital beds
        const hospital = hospitals.find((h) => h.id === result.hospitalId);
        if (hospital && hospital.bedsAvailable > 0) {
          await updateBeds(result.hospitalId, hospital.bedsAvailable - 1);
          pathfinder.updateHospital(result.hospitalId, hospital.bedsAvailable - 1);
        }
      } catch (err) {
        console.error('Dispatch calculation error:', err);
      }
    },
    [selectedNodeId, selectedNode, profile, role, pathfinder, addDispatch, effectivelyOnline, hospitals, updateBeds]
  );

  // Hospital Bed Update Handler
  const handleUpdateBeds = useCallback(
    async (id: number, beds: number) => {
      await updateBeds(id, beds);
      pathfinder.updateHospital(id, beds);
    },
    [updateBeds, pathfinder]
  );

  // Hospital Medicine Update Handler
  const handleUpdateMedicine = useCallback(
    async (id: number, med: string, qty: number) => {
      await updateMedicine(id, med, qty);
      pathfinder.updateHospital(id, undefined, { [med]: qty });
    },
    [updateMedicine, pathfinder]
  );

  const totalBeds = hospitals.reduce((sum, h) => sum + h.bedsAvailable, 0);

  // Active hospital for hospital role
  const activeHospital = hospitals.find((h) => h.id === (profile.hospitalId ?? 0)) || hospitals[0];
  const inboundDispatches = dispatches.filter((d) => d.assignedHospitalId === (profile.hospitalId ?? 0));

  return (
    <div className="dashboard" id="main-dashboard">
      <Navbar
        ambulanceIdle={idleCount}
        ambulanceActive={activeCount}
        totalBeds={totalBeds}
        pendingSyncs={pendingCount}
      />

      <div className="dashboard__content">
        {/* Desktop Layout */}
        <div className="dashboard__panels">
          {/* Left Panel: Role-Driven Portal */}
          <aside
            className={`dashboard__left ${sidebarWidth === 0 ? 'dashboard__left--collapsed' : ''}`}
            style={{ width: sidebarWidth === 0 ? 0 : `${sidebarWidth}px` }}
          >
            {sidebarWidth > 0 && (
              <div className="dashboard__panel-content">
                {/* 🧑‍🌾 PATIENT PORTAL */}
                {role === 'patient' && (
                  <PatientPortal
                    onTriggerSOS={(urgency, spec) => handleDispatch(urgency, spec)}
                    isComputing={pathfinder.isComputing}
                    lastResult={pathfinder.lastResult}
                  />
                )}

                {/* 🚑 108 AMBULANCE DRIVER / PILOT PORTAL */}
                {role === 'driver' && (
                  <DriverPortal
                    activeDispatch={dispatches.find((d) => d.status === 'DISPATCHED' || d.status === 'EN_ROUTE') || dispatches[0] || null}
                    lastRouteResult={pathfinder.lastResult}
                  />
                )}

                {/* 🏥 HOSPITAL DOCTOR PORTAL */}
                {role === 'hospital' && activeHospital && (
                  <HospitalPortal
                    hospital={activeHospital}
                    onUpdateBeds={handleUpdateBeds}
                    onUpdateMedicine={handleUpdateMedicine}
                    incomingDispatches={inboundDispatches}
                  />
                )}

                {/* 🛡️ ADMIN COMMANDER PORTAL */}
                {role === 'admin' && (
                  <AdminPortal
                    edges={edges}
                    hospitals={hospitals}
                    ambulances={ambulances}
                    dispatches={dispatches}
                    onToggleEdgeBlock={handleToggleEdgeBlock}
                    isBlockRoadMode={isBlockRoadMode}
                    setIsBlockRoadMode={setIsBlockRoadMode}
                    alpha={alpha}
                    setAlpha={setAlpha}
                    beta={beta}
                    setBeta={setBeta}
                    gamma={gamma}
                    setGamma={setGamma}
                    delta={delta}
                    setDelta={setDelta}
                  />
                )}
              </div>
            )}
          </aside>

          {/* ↔️ Interactive Map / Sidebar Draggable Resizer */}
          <div
            className={`dashboard__resizer ${isDragging ? 'dashboard__resizer--dragging' : ''}`}
            onMouseDown={handleMouseDown}
            title="Drag left/right to resize map or double-click to toggle"
            onDoubleClick={() => {
              setSidebarWidth((prev) => (prev > 100 ? 0 : 380));
              setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            }}
          >
            <div className="dashboard__resizer-line" />
            <button
              type="button"
              className="dashboard__resizer-toggle-pill clay-card--flat"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarWidth((prev) => (prev > 100 ? 0 : 380));
                setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
              }}
              title={sidebarWidth > 100 ? 'Collapse Sidebar (Full Map)' : 'Expand Sidebar'}
            >
              {sidebarWidth > 100 ? '◀' : '▶'}
            </button>
          </div>

          {/* Center: Interactive Map */}
          <main className="dashboard__center">
            <MapView
              nodes={nodes}
              edges={edges}
              hospitals={hospitals}
              routeNodeIds={routeNodeIds}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              isBlockRoadMode={isBlockRoadMode}
              onToggleEdgeBlock={handleToggleEdgeBlock}
              patientNodeId={role === 'patient' ? (profile.villageNodeId || 20) : null}
            />
          </main>

          {/* Right Panel: Telemetry & Decision Log (Only for Admin Commander & Hospital Staff) */}
          {role !== 'patient' && role !== 'driver' && (
            <aside className="dashboard__right">
              <TelemetryPanel
                hospitals={hospitals}
                ambulances={ambulances}
                nodeCount={nodes.length}
                edgeCount={edges.length}
                workerReady={pathfinder.isInitialized}
              />
              <DecisionLog dispatches={dispatches} />
            </aside>
          )}
        </div>

        {/* Mobile View */}
        <div className="dashboard__mobile-content">
          {mobileTab === 'map' && (
            <MapView
              nodes={nodes}
              edges={edges}
              hospitals={hospitals}
              routeNodeIds={routeNodeIds}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              isBlockRoadMode={isBlockRoadMode}
              onToggleEdgeBlock={handleToggleEdgeBlock}
              patientNodeId={role === 'patient' ? (profile.villageNodeId || 20) : null}
            />
          )}

          {mobileTab === 'portal' && (
            <div className="dashboard__mobile-panel">
              {role === 'patient' && (
                <PatientPortal
                  onTriggerSOS={(urgency, spec) => handleDispatch(urgency, spec)}
                  isComputing={pathfinder.isComputing}
                  lastResult={pathfinder.lastResult}
                />
              )}
              {role === 'driver' && (
                <DriverPortal
                  activeDispatch={dispatches.find((d) => d.status === 'DISPATCHED' || d.status === 'EN_ROUTE') || dispatches[0] || null}
                  lastRouteResult={pathfinder.lastResult}
                />
              )}
              {role === 'hospital' && activeHospital && (
                <HospitalPortal
                  hospital={activeHospital}
                  onUpdateBeds={handleUpdateBeds}
                  onUpdateMedicine={handleUpdateMedicine}
                  incomingDispatches={inboundDispatches}
                />
              )}
              {role === 'admin' && (
                <AdminPortal
                  edges={edges}
                  hospitals={hospitals}
                  ambulances={ambulances}
                  dispatches={dispatches}
                  onToggleEdgeBlock={handleToggleEdgeBlock}
                  isBlockRoadMode={isBlockRoadMode}
                  setIsBlockRoadMode={setIsBlockRoadMode}
                  alpha={alpha}
                  setAlpha={setAlpha}
                  beta={beta}
                  setBeta={setBeta}
                  gamma={gamma}
                  setGamma={setGamma}
                  delta={delta}
                  setDelta={setDelta}
                />
              )}
            </div>
          )}

          {mobileTab === 'telemetry' && (
            <div className="dashboard__mobile-panel">
              <TelemetryPanel
                hospitals={hospitals}
                ambulances={ambulances}
                nodeCount={nodes.length}
                edgeCount={edges.length}
                workerReady={pathfinder.isInitialized}
              />
              <DecisionLog dispatches={dispatches} />
            </div>
          )}
        </div>

        {/* Mobile Bottom Bar */}
        <nav className="dashboard__mobile-nav" id="mobile-nav">
          <button
            className={`dashboard__mobile-tab ${mobileTab === 'portal' ? 'dashboard__mobile-tab--active' : ''}`}
            onClick={() => setMobileTab('portal')}
          >
            {role === 'patient' ? <User size={20} /> : role === 'driver' ? <Ambulance size={20} /> : role === 'hospital' ? <Building2 size={20} /> : <ShieldCheck size={20} />}
            <span>{role === 'patient' ? 'SOS Portal' : role === 'driver' ? 'Pilot Cockpit' : role === 'hospital' ? 'Hospital' : 'Commander'}</span>
          </button>
          <button
            className={`dashboard__mobile-tab ${mobileTab === 'map' ? 'dashboard__mobile-tab--active' : ''}`}
            onClick={() => setMobileTab('map')}
          >
            <Map size={20} />
            <span>Map Grid</span>
          </button>
          {role !== 'patient' && role !== 'driver' && (
            <button
              className={`dashboard__mobile-tab ${mobileTab === 'telemetry' ? 'dashboard__mobile-tab--active' : ''}`}
              onClick={() => setMobileTab('telemetry')}
            >
              <Activity size={20} />
              <span>Telemetry</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
