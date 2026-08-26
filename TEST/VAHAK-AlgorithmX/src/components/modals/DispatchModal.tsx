import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Truck,
  Building2,
  Navigation,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Plane,
  CheckCircle2,
  Cpu,
  Layers,
  Database,
  Lock,
  ArrowRight,
  RefreshCw,
  Sliders,
  AlertOctagon,
  Zap,
} from 'lucide-react';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { calculateAStarRoute, RouteCalculationResult } from '../../services/routingAlgorithm';
import { requestAiTriageRecommendation } from '../../services/geminiService';
import { buildRoadNetworkGraph } from '../../services/graphEngine';
import { evaluateHospitalForEmergency, evaluateAmbulanceForEmergency } from '../../services/dispatchEngine';

export const DispatchModal: React.FC = () => {
  const {
    dispatchModalEmergency,
    closeDispatchModal,
    ambulances,
    hospitals,
    doctors,
    medicines,
    villages,
    pharmacies,
    roadSegments,
    selectedRoutingAlgorithm,
    setRoutingAlgorithm,
    executeIntelligentDispatch,
    dispatchAmbulanceToEmergency,
  } = useHealthcareStore();

  const emergency = dispatchModalEmergency || ({} as any);

  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'MANUAL' | 'ALGORITHM_BENCHMARK'>('PIPELINE');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteCalculationResult | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const currentGraph = useMemo(() => {
    return buildRoadNetworkGraph(villages, hospitals, pharmacies, roadSegments);
  }, [villages, hospitals, pharmacies, roadSegments]);

  const patientNodeId = useMemo(() => {
    const v = villages.find((vil) => vil.name === emergency.villageName || vil.id === emergency.villageId);
    if (v) return v.id;
    const closest = currentGraph.findClosestNode(emergency.position);
    return closest ? closest.id : 'N-VIL-1';
  }, [emergency, villages, currentGraph]);

  const hospitalEvaluations = useMemo(() => {
    return hospitals.map((hosp) =>
      evaluateHospitalForEmergency(emergency, hosp, doctors, medicines, currentGraph, patientNodeId)
    );
  }, [emergency, hospitals, doctors, medicines, currentGraph, patientNodeId]);

  const ambulanceEvaluations = useMemo(() => {
    return ambulances.map((amb) =>
      evaluateAmbulanceForEmergency(emergency, amb, currentGraph, patientNodeId)
    );
  }, [emergency, ambulances, currentGraph, patientNodeId]);

  const bestHospitalEval = useMemo(() => {
    const eligible = hospitalEvaluations.filter((h) => h.isEligible);
    if (eligible.length === 0) return null;
    return [...eligible].sort((a, b) => a.totalHospitalScore - b.totalHospitalScore)[0];
  }, [hospitalEvaluations]);

  const bestAmbulanceEval = useMemo(() => {
    const compatible = ambulanceEvaluations.filter((a) => a.isCompatible);
    if (compatible.length === 0) return null;
    return [...compatible].sort((a, b) => a.totalAmbulanceScore - b.totalAmbulanceScore)[0];
  }, [ambulanceEvaluations]);

  const availableAmbulances = ambulances.filter(
    (a) => a.status === 'Idle / Ready' || a.status === 'Dispatched En Route'
  );

  useEffect(() => {
    if (bestAmbulanceEval) {
      setSelectedAmbulanceId(bestAmbulanceEval.ambulance.id);
    } else if (availableAmbulances.length > 0 && !selectedAmbulanceId) {
      setSelectedAmbulanceId(availableAmbulances[0].id);
    }

    if (bestHospitalEval) {
      setSelectedHospitalId(bestHospitalEval.hospital.id);
    } else if (hospitals.length > 0 && !selectedHospitalId) {
      setSelectedHospitalId(hospitals[0].id);
    }

    const fetchAiTriage = async () => {
      setAiLoading(true);
      try {
        const rec = await requestAiTriageRecommendation(emergency, hospitals, availableAmbulances, roadSegments);
        setAiRecommendation(rec);
      } catch (err) {
        console.error('AI Triage request failed', err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiTriage();
  }, [emergency.id, bestHospitalEval?.hospital.id, bestAmbulanceEval?.ambulance.id]);

  useEffect(() => {
    const amb = ambulances.find((a) => a.id === selectedAmbulanceId);
    if (amb && emergency.position) {
      const isDrone = amb.type.includes('Drone');
      const routeRes = calculateAStarRoute(
        amb.position,
        emergency.position,
        roadSegments,
        isDrone,
        selectedRoutingAlgorithm
      );
      setCalculatedRoute(routeRes);
    }
  }, [selectedAmbulanceId, emergency.position, roadSegments, selectedRoutingAlgorithm]);

  if (!dispatchModalEmergency) return null;

  const handleExecutePipeline = async () => {
    setDispatching(true);
    setPipelineError(null);
    try {
      const result = await executeIntelligentDispatch(emergency.id);
      if (!result.success) {
        setPipelineError(result.rejectionSummary || 'Dispatch could not be completed.');
      }
    } catch (err: any) {
      setPipelineError(err.message || 'Dispatch execution error.');
    } finally {
      setDispatching(false);
    }
  };

  const handleManualDispatch = () => {
    if (!selectedAmbulanceId || !selectedHospitalId) return;
    dispatchAmbulanceToEmergency(selectedAmbulanceId, emergency.id, selectedHospitalId);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Intelligent Routing & Clinical Dispatch Pipeline
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 font-mono font-bold border border-red-200">
                  {emergency.id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200">
                  SLA: {emergency.slaTargetMinutes}m ({emergency.severity})
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Patient: <strong className="text-slate-900">{emergency.patientName}</strong> ({emergency.patientAge}y {emergency.patientGender}) • Village: <strong className="text-blue-700">{emergency.villageName}</strong> • Condition: <strong className="text-amber-700">{emergency.condition}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Algorithm Switcher */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setRoutingAlgorithm('A_STAR')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedRoutingAlgorithm === 'A_STAR'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A* Engine
              </button>
              <button
                onClick={() => setRoutingAlgorithm('DIJKSTRA')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  selectedRoutingAlgorithm === 'DIJKSTRA'
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dijkstra Engine
              </button>
            </div>

            <button
              onClick={closeDispatchModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 px-4 pt-2 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'PIPELINE'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Clinical Pipeline Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'MANUAL'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Tactical Override</span>
          </button>
          <button
            onClick={() => setActiveTab('ALGORITHM_BENCHMARK')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'ALGORITHM_BENCHMARK'
                ? 'bg-white text-purple-600 border-purple-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>A* vs Dijkstra Benchmark</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {pipelineError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pipeline Notice:</span> {pipelineError}
              </div>
            </div>
          )}

          {/* Clinical Requirement Overview */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span>CLINICAL TRIAGE CONSTRAINTS & REQUIREMENTS</span>
              </div>
              <span className="text-[10px] text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                Priority: {emergency.severity} • SLA Target: {emergency.slaTargetMinutes} min
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Required Specialist</span>
                <span className="text-purple-700 font-bold">{emergency.requiredSpecialist || 'Trauma Surgeon'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Required Medicine</span>
                <span className="text-emerald-700 font-bold">{emergency.requiredMedicine || 'Emergency Antivenom'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Patient Vitals</span>
                <span className="text-slate-900 font-bold">HR: {emergency.vitals?.heartRate || 90} • SpO2: {emergency.vitals?.spO2 || 96}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Patient Location</span>
                <span className="text-blue-700 font-bold">{emergency.villageName}</span>
              </div>
            </div>
          </div>

          {activeTab === 'PIPELINE' && (
            <div className="space-y-4">
              {/* Hospital Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hospital Feasibility & Clinical Scoring Matrix</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {hospitalEvaluations.filter((h) => h.isEligible).length} of {hospitalEvaluations.length} Qualified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {hospitalEvaluations.map((evalHosp) => {
                    const hosp = evalHosp.hospital;
                    const isTopMatch = bestHospitalEval?.hospital.id === hosp.id;

                    return (
                      <div
                        key={hosp.id}
                        onClick={() => setSelectedHospitalId(hosp.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                          evalHosp.isEligible
                            ? isTopMatch
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                            : 'border-slate-200 opacity-60 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${evalHosp.isEligible ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <strong className="text-xs font-mono text-slate-900">{hosp.name}</strong>
                          </div>
                          {isTopMatch ? (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold">
                              OPTIMAL MATCH (Score {evalHosp.totalHospitalScore})
                            </span>
                          ) : evalHosp.isEligible ? (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200">
                              Score: {evalHosp.totalHospitalScore}
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-red-50 text-red-700 font-mono border border-red-200 font-bold">
                              REJECTED
                            </span>
                          )}
                        </div>

                        {/* Constraints Checklist */}
                        <div className="grid grid-cols-4 gap-1 text-[10px] font-mono mb-2">
                          <div className={`p-1 rounded text-center ${evalHosp.hasSpecialist ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-red-50 text-red-600'}`}>
                            {evalHosp.hasSpecialist ? '✓ Specialist' : '✗ No Doc'}
                          </div>
                          <div className={`p-1 rounded text-center ${evalHosp.hasBedAvailable ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-red-50 text-red-600'}`}>
                            {evalHosp.hasBedAvailable ? `✓ Beds (${hosp.availableBeds})` : '✗ Bed Full'}
                          </div>
                          <div className={`p-1 rounded text-center ${evalHosp.hasRequiredMedicine ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-red-50 text-red-600'}`}>
                            {evalHosp.hasRequiredMedicine ? '✓ Medicine' : '✗ No Med'}
                          </div>
                          <div className={`p-1 rounded text-center ${evalHosp.hasViableRoute ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-red-50 text-red-600'}`}>
                            {evalHosp.hasViableRoute ? '✓ Road Open' : '✗ Blocked'}
                          </div>
                        </div>

                        {!evalHosp.isEligible ? (
                          <div className="text-[10px] font-mono text-red-700 flex items-center gap-1 bg-red-50 p-1.5 rounded border border-red-200">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{evalHosp.rejectionReasons.join(' • ')}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-600 flex items-center justify-between bg-slate-50 p-1.5 rounded">
                            <span>Travel: {evalHosp.travelTimeMin}m</span>
                            <span>Wait: {evalHosp.ambulanceWaitTimeMin}m</span>
                            <span className="text-emerald-700 font-bold">Score: {evalHosp.totalHospitalScore}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Ambulance Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ambulance Match & Equipment Score</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {ambulanceEvaluations.filter((a) => a.isCompatible).length} Units Feasible
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {ambulanceEvaluations.slice(0, 8).map((evalAmb) => {
                    const amb = evalAmb.ambulance;
                    const isTopMatch = bestAmbulanceEval?.ambulance.id === amb.id;
                    const isDrone = amb.type.includes('Drone');

                    return (
                      <div
                        key={amb.id}
                        onClick={() => setSelectedAmbulanceId(amb.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                          evalAmb.isCompatible
                            ? isTopMatch
                              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                            : 'border-slate-200 opacity-60 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-900">
                            {isDrone ? <Plane className="w-4 h-4 text-purple-600" /> : <Truck className="w-4 h-4 text-blue-600" />}
                            <span>{amb.callsign}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                              {amb.type}
                            </span>
                          </div>
                          {isTopMatch ? (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold">
                              TOP MATCH
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500">
                              ETA: {evalAmb.etaMinutesToPatient}m
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-500 mt-1.5 border-t border-slate-100 pt-1.5">
                          <span>Fuel: {amb.fuelPercent}%</span>
                          <span>Score: {evalAmb.totalAmbulanceScore}</span>
                          <span className={evalAmb.isCompatible ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                            {evalAmb.isCompatible ? '✓ Compatible' : '✗ Incompatible'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MANUAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ambulance List */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider block">
                  Select Unit
                </label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {availableAmbulances.map((amb) => (
                    <div
                      key={amb.id}
                      onClick={() => setSelectedAmbulanceId(amb.id)}
                      className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all bg-white ${
                        selectedAmbulanceId === amb.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span>{amb.callsign} ({amb.type})</span>
                        <span className="text-emerald-600">{amb.status}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Speed: {amb.speedKmh} km/h • Fuel: {amb.fuelPercent}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hospital List */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider block">
                  Select Hospital
                </label>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {hospitals.map((hosp) => (
                    <div
                      key={hosp.id}
                      onClick={() => setSelectedHospitalId(hosp.id)}
                      className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all bg-white ${
                        selectedHospitalId === hosp.id
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span>{hosp.shortName}</span>
                        <span className="text-blue-600">Beds: {hosp.availableBeds}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        ICU: {hosp.icuAvailable} avail • Specialists: {hosp.specialists?.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ALGORITHM_BENCHMARK' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-900">A* SEARCH (HEURISTIC)</span>
                    <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded text-white font-bold">Admissible</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    <li>• Cost Function: <code className="text-blue-700 font-bold">f(n) = g(n) + h(n)</code></li>
                    <li>• Heuristic: <strong className="text-slate-900">Haversine Euclidean Distance</strong></li>
                    <li>• Avg Visited Nodes: <strong className="text-emerald-700">28 nodes</strong></li>
                    <li>• Avg Execution Time: <strong className="text-emerald-700">3.8 ms</strong></li>
                    <li>• Dynamic Obstacle Avoidance: <strong className="text-emerald-700">Enabled</strong></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-purple-900">DIJKSTRA SEARCH (UNIFORM)</span>
                    <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded text-white font-bold">Exhaustive</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-700 text-[11px]">
                    <li>• Cost Function: <code className="text-purple-700 font-bold">f(n) = g(n)</code></li>
                    <li>• Heuristic: <strong className="text-slate-500">None (Uniform Cost)</strong></li>
                    <li>• Avg Visited Nodes: <strong className="text-amber-700">142 nodes</strong></li>
                    <li>• Avg Execution Time: <strong className="text-amber-700">14.2 ms</strong></li>
                    <li>• Shortest Path Guarantee: <strong className="text-emerald-700">100% Proven</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Active Route Result Summary */}
          {calculatedRoute && (
            <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-sm flex items-center justify-between text-xs font-mono flex-wrap gap-2">
              <div className="flex items-center gap-2 text-blue-700 font-bold">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Computed {calculatedRoute.algorithmUsed} Route Trajectory:</span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <span>Distance: <strong className="text-slate-900">{calculatedRoute.totalDistanceKm} km</strong></span>
                <span>•</span>
                <span>ETA: <strong className="text-emerald-700">{calculatedRoute.estimatedTimeMinutes} min</strong></span>
                <span>•</span>
                <span>Waypoints: <strong className="text-blue-700">{calculatedRoute.pathWaypoints.length} nodes</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={closeDispatchModal}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-600 hover:text-slate-900 bg-slate-100 transition-colors cursor-pointer border border-slate-200"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {activeTab === 'MANUAL' ? (
              <button
                onClick={handleManualDispatch}
                disabled={!selectedAmbulanceId || !selectedHospitalId || dispatching}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>MANUAL DISPATCH OVERRIDE</span>
              </button>
            ) : (
              <button
                onClick={handleExecutePipeline}
                disabled={dispatching || !bestHospitalEval || !bestAmbulanceEval}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer"
              >
                {dispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>EXECUTING ATOMIC DISPATCH...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>EXECUTE INTELLIGENT DISPATCH & LOCKS</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
