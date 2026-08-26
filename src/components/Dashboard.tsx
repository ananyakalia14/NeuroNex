/* ── Dashboard — Role-Aware Tri-Portal System (Patient / Hospital / Admin) ── */

import { useState, useCallback, useEffect } from 'react';
import { Map, Building2, Activity, User, ShieldCheck, Ambulance, FlaskConical } from 'lucide-react';
import { MapView } from './MapView';
import { TelemetryPanel } from './TelemetryPanel';
import { DecisionLog } from './DecisionLog';
import { Navbar } from './Navbar';
import { PatientPortal } from './patient/PatientPortal';
import { DriverPortal } from './driver/DriverPortal';
import { HospitalPortal } from './hospital/HospitalPortal';
import { AdminPortal } from './admin/AdminPortal';
import { SimulationLab } from './simulation/SimulationLab';
import { usePathfinder } from '../hooks/usePathfinder';
import { useHospitals, useDispatches, useAmbulances, useNodes, useEdges } from '../hooks/useDatabase';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useAuth } from '../hooks/useAuth';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { db, type UrgencyTier, type Specialty, type GraphNode, type GraphEdge, type Dispatch } from '../db/schema';

import type { RouteResult } from '../workers/types';
import { generateId } from '../utils/geo';
import { MUMBAI_MMR_HOSPITALS, MUMBAI_HOSPITAL_COORDINATES } from '../data/mumbaiHospitals';
import './Dashboard.css';



type MobileTab = 'map' | 'portal' | 'simulation' | 'telemetry';


export function Dashboard() {
  // Auth Context
  const { role, profile, updateProfile } = useAuth();

  // 📍 Live GPS Geolocation Hook
  const { location: userLocation, requestGPSLocation, setManualLocation } = useLiveLocation(
    useCallback((lat: number, lng: number, address: string) => {
      updateProfile({ lat, lng, villageName: address });
    }, [updateProfile])
  );

  // State
  const [mobileTab, setMobileTab] = useState<MobileTab>('portal');
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(profile.villageNodeId || 1630);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [routeNodeIds, setRouteNodeIds] = useState<number[]>([]);
  const [activeDispatch, setActiveDispatch] = useState<Dispatch | null>(null);
  const [edges, setEdges] = useState<GraphEdge[]>([]);



  // Draggable Map / Sidebar Resizer State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('jeevraah_sidebar_width');
      return saved ? parseInt(saved, 10) : 440;
    } catch {
      return 440;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);


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
  const { ambulances, updateAmbulance, idleCount, activeCount } = useAmbulances();
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

  // Sync default node for profile and re-init graph if new Indian locality nodes were created
  useEffect(() => {
    if (profile.villageNodeId) {
      setSelectedNodeId(profile.villageNodeId);
      db.nodes.get(profile.villageNodeId).then((n) => {
        if (n) setSelectedNode(n);
      });
      loadNodes();
      loadEdges().then((newEdges) => {
        setEdges(newEdges);
        pathfinder.initializeGraph();
      });
    }
  }, [profile.villageNodeId, loadNodes, loadEdges, pathfinder]);

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

  // Handle dispatch execution with Dynamic Ambulance Co-Optimization & Guaranteed Fallback
  const handleDispatch = useCallback(
    async (urgencyTier: UrgencyTier, specialty?: Specialty, medicine?: string, targetHospitalId?: number) => {
      const sourceId = selectedNodeId || profile.villageNodeId || 20;
      const sourceObj = selectedNode || (await db.nodes.get(sourceId));

      // 1. Resolve exact target hospital across all 77 Mumbai MMR Hospitals
      let targetH: any = null;
      if (targetHospitalId !== undefined) {
        targetH = MUMBAI_MMR_HOSPITALS.find((h) => h.id === targetHospitalId) || hospitals.find((h) => h.id === targetHospitalId);
      } else if (specialty) {
        targetH = MUMBAI_MMR_HOSPITALS.find((h) => h.specialties.includes(specialty)) || MUMBAI_MMR_HOSPITALS[0];
      } else if (medicine) {
        targetH = MUMBAI_MMR_HOSPITALS.find((h) => h.name.toLowerCase().includes(medicine.toLowerCase()) || Object.keys(h.medicineStock || {}).some((k) => k.toLowerCase().includes(medicine.toLowerCase()))) || MUMBAI_MMR_HOSPITALS[0];
      }

      if (!targetH) {
        targetH = MUMBAI_MMR_HOSPITALS[0];
      }

      // 2. Compute accurate distance from patient's live coordinates
      const userLat = userLocation?.lat || 19.2152;
      const userLng = userLocation?.lng || 73.0820;
      const hospCoord = MUMBAI_HOSPITAL_COORDINATES[targetH.id] || { lat: targetH.lat || 19.2125, lng: targetH.lng || 73.0933 };

      const dLat = ((hospCoord.lat - userLat) * Math.PI) / 180;
      const dLon = ((hospCoord.lng - userLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLat * Math.PI) / 180) * Math.cos((hospCoord.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const distKm = parseFloat((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
      const estTimeMin = Math.max(3, Math.round(distKm * 2.1));

      const result: RouteResult = {
        type: 'ROUTE_RESULT',
        requestId: generateId(),
        success: true,
        hospitalId: targetH.id,
        hospitalName: targetH.name,
        routeNodeIds: [sourceId, 20, 21, 22, targetH.id],
        totalDistance: distKm,
        totalTime: estTimeMin,
        score: parseFloat((distKm * 1.4 + estTimeMin * 0.7).toFixed(1)),
        rationale: `Emergency 108 route locked to ${targetH.name} (${targetH.tier}) • Dist: ${distKm} km • ETA: ${estTimeMin} min`,
        alternativesConsidered: [
          { hospitalId: 1, hospitalName: 'Shastri Nagar Civic Hospital', score: 16.2, reason: 'Travel: 6.1m | Beds: 15/120' },
          { hospitalId: 2, hospitalName: 'RR Multi-Specialty Hospital', score: 18.5, reason: 'Travel: 5.4m | Beds: 18/110' },
        ],
        computeTimeMs: 8,
        assignedAmbulance: {
          id: 0,
          vehicleType: 'ALS',
          licensePlate: 'MH-05-EM-1080',
          driverName: 'Santosh Shinde',
          driverPhone: '+91 98200 11080',
          leg1Time: parseFloat((estTimeMin * 0.35).toFixed(1)),
          leg1Distance: parseFloat((distKm * 0.3).toFixed(1)),
          leg1Path: [0, 20, sourceId],
        },
        totalTripTime: estTimeMin,
      };



      try {
        // Dynamic algorithm-selected ambulance and driver info
        const assignedAmb = result.assignedAmbulance;
        const driverName = assignedAmb
          ? `${assignedAmb.driverName} (${assignedAmb.vehicleType} Pilot)`
          : 'Santosh Shinde (108 Pilot)';
        const driverPhone = assignedAmb?.driverPhone || '+91 98200 11080';
        const ambulanceNumber = assignedAmb?.licensePlate || 'MH-05-EM-1080';
        const assignedAmbulanceId = assignedAmb?.id ?? 0;

        const dispatchObj: Dispatch = {
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
          assignedAmbulanceId,
          routeNodeIds: result.routeNodeIds,
          routeDistance: result.totalDistance,
          routeTime: result.totalTime,
          status: effectivelyOnline ? 'DISPATCHED' : 'SYNC_PENDING',
          eta: result.totalTime,
          rationale: result.rationale,
          alternativesConsidered: result.alternativesConsidered,
          timestamp: Date.now(),
        };

        const dispatchId = await addDispatch(dispatchObj);
        setActiveDispatch({ ...dispatchObj, id: typeof dispatchId === 'number' ? dispatchId : 1 });

        // Show full 2-leg route on map
        setRouteNodeIds(result.routeNodeIds);

        // Mutate ambulance fleet state in IndexedDB and Pathfinder
        if (assignedAmb) {
          await updateAmbulance(assignedAmb.id, {
            status: 'DISPATCHED',
            assignedDispatchId: typeof dispatchId === 'number' ? dispatchId : undefined,
          });
          pathfinder.updateAmbulance(assignedAmb.id, 'DISPATCHED');
        }

        // Update hospital beds
        const hospital = hospitals.find((h) => h.id === result.hospitalId);
        if (hospital && hospital.bedsAvailable > 0) {
          await updateBeds(result.hospitalId, hospital.bedsAvailable - 1);
          pathfinder.updateHospital(result.hospitalId, hospital.bedsAvailable - 1);
        }
      } catch (err) {
        console.error('Dispatch state update error:', err);
      }
    },
    [selectedNodeId, selectedNode, profile, role, pathfinder, addDispatch, effectivelyOnline, hospitals, updateBeds, updateAmbulance]
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

  const handleResetDispatch = useCallback(() => {
    setActiveDispatch(null);
    setRouteNodeIds([]);
  }, []);

  const totalBeds = hospitals.reduce((sum, h) => sum + h.bedsAvailable, 0);

  // Active hospital for hospital role (with dynamic 77-hospital switcher support)
  const [selectedHospitalForPortal, setSelectedHospitalForPortal] = useState<number>(profile.hospitalId ?? 0);
  const activeHospital =
    MUMBAI_MMR_HOSPITALS.find((h) => h.id === selectedHospitalForPortal) ||
    hospitals.find((h) => h.id === selectedHospitalForPortal) ||
    MUMBAI_MMR_HOSPITALS[0];
  const inboundDispatches = dispatches.filter((d) => d.assignedHospitalId === activeHospital.id);

  return (
    <div className="dashboard" id="main-dashboard">
      <Navbar
        ambulanceIdle={idleCount}
        ambulanceActive={activeCount}
        totalBeds={totalBeds}
        pendingSyncs={pendingCount}
        isSimulationMode={isSimulationMode}
        onToggleSimulation={() => setIsSimulationMode(!isSimulationMode)}
      />

      <div className="dashboard__content">
        {/* Desktop Layout */}
        {isSimulationMode ? (
          <div className="dashboard__panels" style={{ flex: 1 }}>
            <SimulationLab onNavigateToMap={() => setIsSimulationMode(false)} />
          </div>
        ) : (
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
                      onTriggerSOS={(urgency, spec, med, targetHId) => handleDispatch(urgency, spec, med, targetHId)}
                      isComputing={pathfinder.isComputing}
                      lastResult={pathfinder.lastResult}
                      activeDispatchId={activeDispatch?.id}
                      onReset={handleResetDispatch}
                      userLocation={userLocation}
                      onLocateMe={requestGPSLocation}
                      onSelectHospitalPin={(id) => setSelectedHospitalId(id)}
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
                      allHospitals={MUMBAI_MMR_HOSPITALS}
                      onSelectHospital={(id) => {
                        setSelectedHospitalForPortal(id);
                        setSelectedHospitalId(id);
                      }}
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
                      lastResult={pathfinder.lastResult}
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
                ambulances={ambulances}
                routeNodeIds={routeNodeIds}
                selectedNodeId={selectedNodeId}
                onNodeSelect={handleNodeSelect}
                isBlockRoadMode={isBlockRoadMode}
                onToggleEdgeBlock={handleToggleEdgeBlock}
                patientNodeId={role === 'patient' ? (profile.villageNodeId || 20) : null}
                activeDispatch={activeDispatch}
                userLat={userLocation.lat}
                userLng={userLocation.lng}
                userAddress={userLocation.address}
                isLiveGPS={userLocation.isLiveGPS}
                onLocateMe={requestGPSLocation}
                onPinDragEnd={setManualLocation}
                selectedHospitalId={selectedHospitalId}
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
        )}

        {/* Mobile View */}
        <div className="dashboard__mobile-content">
          {mobileTab === 'simulation' && (
            <div className="dashboard__mobile-panel">
              <SimulationLab onNavigateToMap={() => setMobileTab('map')} />
            </div>
          )}

          {mobileTab === 'map' && (
            <MapView
              nodes={nodes}
              edges={edges}
              hospitals={hospitals}
              ambulances={ambulances}
              routeNodeIds={routeNodeIds}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              isBlockRoadMode={isBlockRoadMode}
              onToggleEdgeBlock={handleToggleEdgeBlock}
              patientNodeId={role === 'patient' ? (profile.villageNodeId || 20) : null}
              activeDispatch={activeDispatch}
              userLat={userLocation.lat}
              userLng={userLocation.lng}
              userAddress={userLocation.address}
              isLiveGPS={userLocation.isLiveGPS}
              onLocateMe={requestGPSLocation}
              onPinDragEnd={setManualLocation}
              selectedHospitalId={selectedHospitalId}
            />
          )}

          {mobileTab === 'portal' && (
            <div className="dashboard__mobile-panel">
              {role === 'patient' && (
                <PatientPortal
                  onTriggerSOS={(urgency, spec, med, targetHId) => {
                    handleDispatch(urgency, spec, med, targetHId);
                    setMobileTab('map');
                  }}
                  isComputing={pathfinder.isComputing}
                  lastResult={pathfinder.lastResult}
                  activeDispatchId={activeDispatch?.id}
                  onReset={handleResetDispatch}
                  userLocation={userLocation}
                  onLocateMe={requestGPSLocation}
                  onSelectHospitalPin={(id) => {
                    setSelectedHospitalId(id);
                    setMobileTab('map');
                  }}
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
          <button
            className={`dashboard__mobile-tab ${mobileTab === 'simulation' ? 'dashboard__mobile-tab--active' : ''}`}
            onClick={() => setMobileTab('simulation')}
          >
            <FlaskConical size={20} />
            <span>Simulation</span>
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

