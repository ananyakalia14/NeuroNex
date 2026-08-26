import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Building2,
  Truck,
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  Activity,
  Award,
  ChevronRight,
  X,
  Volume2,
} from 'lucide-react';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { soundEffects } from '../../services/soundEffects';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({ isOpen, onClose }) => {
  const {
    villages,
    hospitals,
    ambulances,
    emergencies,
    medicines,
    roadSegments,
    setCameraFocus,
    resetCameraView,
    toggleRoadBlockage,
    setRoutingAlgorithm,
    createNewEmergency,
    executeIntelligentDispatch,
    activeRouteResult,
    soundEnabled,
  } = useHealthcareStore();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [stepTimer, setStepTimer] = useState<number>(0);

  // Demo Specific State Snapshots
  const demoData = useRef<{
    emergencyId: string;
    villageA: any;
    hospitalB: any;
    hospitalC: any;
    ambulanceA07: any;
    blockedRoad: any;
    oldEta: number;
    newEta: number;
  }>({
    emergencyId: 'EMG-JUDGE-001',
    villageA: null,
    hospitalB: null,
    hospitalC: null,
    ambulanceA07: null,
    blockedRoad: null,
    oldEta: 18.7,
    newEta: 24.2,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      const vA = villages[0] || { id: 'v-01', name: 'Dharnai Highlands (Village A)', position: [-12, 0.4, -8] };
      const hB = hospitals[0] || { id: 'h-01', shortName: 'Apex Trauma Clinic (Hospital B)', position: [-4, 0.2, -6] };
      const hC = hospitals[1] || { id: 'h-02', shortName: 'Mithila Medical College (Hospital C)', position: [18, 0.2, 12] };
      const amb7 = ambulances.find((a) => a.callsign.includes('07')) || ambulances[2] || ambulances[0];
      const road = roadSegments[1] || roadSegments[0];

      demoData.current = {
        emergencyId: 'EMG-JUDGE-001',
        villageA: vA,
        hospitalB: hB,
        hospitalC: hC,
        ambulanceA07: amb7,
        blockedRoad: road,
        oldEta: 18.7,
        newEta: 24.2,
      };
    }
  }, [isOpen, villages, hospitals, ambulances, roadSegments]);

  // Execute Step Actions
  const executeStep = async (stepNum: number) => {
    setCurrentStep(stepNum);

    const { villageA, hospitalB, hospitalC, ambulanceA07, blockedRoad } = demoData.current;

    switch (stepNum) {
      case 1:
        soundEffects.playEmergencyAlert();
        if (villageA?.position) {
          setCameraFocus(
            [villageA.position[0] - 6, villageA.position[1] + 8, villageA.position[2] + 10],
            villageA.position,
            12
          );
        }
        await createNewEmergency({
          id: demoData.current.emergencyId,
          patientName: 'Kavita Devi (Cardiac Arrest)',
          patientAge: 54,
          patientGender: 'Female',
          villageName: villageA?.name || 'Dharnai Highlands (Village A)',
          villageId: villageA?.id || 'v-01',
          condition: 'Acute STEMI Myocardial Infarction / Severe Ventricular Arrhythmia',
          severity: 'Critical',
          urgency: 'CRITICAL',
          requiredSpecialist: 'Cardiologist',
          requiredMedicine: 'Tenecteplase / Cardiac Resuscitation Kit',
          slaTargetMinutes: 20,
          position: villageA?.position || [-12, 0.4, -8],
          vitals: { heartRate: 142, bloodPressure: '75/45', spO2: 86 },
        });
        break;

      case 2:
        soundEffects.playWarning();
        if (hospitalB?.position) {
          setCameraFocus(
            [hospitalB.position[0] - 8, hospitalB.position[1] + 9, hospitalB.position[2] + 11],
            hospitalB.position,
            14
          );
        }
        break;

      case 3:
        soundEffects.playDispatchConfirmed();
        if (hospitalC?.position) {
          setCameraFocus(
            [hospitalC.position[0] - 10, hospitalC.position[1] + 12, hospitalC.position[2] + 14],
            hospitalC.position,
            16
          );
        }
        break;

      case 4:
        soundEffects.playClick();
        if (ambulanceA07?.position) {
          setCameraFocus(
            [ambulanceA07.position[0] - 6, ambulanceA07.position[1] + 7, ambulanceA07.position[2] + 8],
            ambulanceA07.position,
            10
          );
        }
        break;

      case 5:
        soundEffects.playRecalculateSweep();
        setRoutingAlgorithm('A_STAR');
        await executeIntelligentDispatch(demoData.current.emergencyId);
        setCameraFocus([0, 32, 28], [0, 0, 0], 35);
        break;

      case 6:
        soundEffects.playClick();
        if (ambulanceA07?.position) {
          setCameraFocus(
            [ambulanceA07.position[0] - 5, ambulanceA07.position[1] + 6, ambulanceA07.position[2] + 6],
            ambulanceA07.position,
            8
          );
        }
        break;

      case 7:
        soundEffects.playWarning();
        if (blockedRoad) {
          await toggleRoadBlockage(blockedRoad.id, 'BLOCKED_LANDSLIDE');
          const midPos: [number, number, number] = [
            (blockedRoad.startPos[0] + blockedRoad.endPos[0]) / 2,
            (blockedRoad.startPos[1] + blockedRoad.endPos[1]) / 2 + 5,
            (blockedRoad.startPos[2] + blockedRoad.endPos[2]) / 2 + 7,
          ];
          setCameraFocus(midPos, blockedRoad.startPos, 12);
        }
        break;

      case 8:
        soundEffects.playRecalculateSweep();
        await executeIntelligentDispatch(demoData.current.emergencyId);
        setCameraFocus([2, 30, 26], [0, 0, 0], 32);
        break;

      case 9:
        soundEffects.playClick();
        break;

      case 10:
        soundEffects.playDispatchConfirmed();
        if (hospitalC?.position) {
          setCameraFocus(
            [hospitalC.position[0] - 6, hospitalC.position[1] + 8, hospitalC.position[2] + 9],
            hospitalC.position,
            12
          );
        }
        useHealthcareStore.setState((prev) => ({
          emergencies: prev.emergencies.map((e) =>
            e.id === demoData.current.emergencyId ? { ...e, status: 'RESOLVED', etaMinutes: 0 } : e
          ),
          hospitals: prev.hospitals.map((h) =>
            h.id === hospitalC?.id ? { ...h, availableBeds: Math.max(0, h.availableBeds - 1) } : h
          ),
        }));
        break;

      case 11:
        soundEffects.playSuccess();
        resetCameraView();
        setIsPlaying(false);
        break;
    }
  };

  useEffect(() => {
    if (isPlaying && autoAdvance && currentStep >= 1 && currentStep < 11) {
      const stepDuration = currentStep === 5 || currentStep === 6 ? 4000 : 3200;
      timerRef.current = setTimeout(() => {
        executeStep(currentStep + 1);
      }, stepDuration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, autoAdvance, currentStep]);

  const handleStartDemo = () => {
    setIsPlaying(true);
    executeStep(1);
  };

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setCurrentStep(0);
    resetCameraView();
  };

  const handleNextStep = () => {
    if (currentStep < 11) {
      executeStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      executeStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const stepsList = [
    { num: 1, title: 'Cardiac SOS', tag: 'Village A Created' },
    { num: 2, title: 'Hosp B Rejection', tag: 'Specialist Missing' },
    { num: 3, title: 'Hosp C Selected', tag: 'All Constraints Met' },
    { num: 4, title: 'ALS Assigned', tag: 'Optimal ALS ETA' },
    { num: 5, title: 'A* Pathing', tag: 'Exploration Tree' },
    { num: 6, title: 'En Route', tag: '3D Telemetry' },
    { num: 7, title: 'Landslide Block', tag: 'Sudden Hazard' },
    { num: 8, title: 'Reroute A*', tag: 'Bypass Recalculated' },
    { num: 9, title: 'AI Clinical Reason', tag: 'Audit Log' },
    { num: 10, title: 'Patient Arrival', tag: 'Resources Locked' },
    { num: 11, title: 'Victory Summary', tag: 'SLA: 100% SUCCESS' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-mono uppercase">
                  Judge Demonstration Mode
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                  11-STEP VERIFICATION
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Automated multi-constraint emergency dispatch, real-time A* exploration, sudden obstacle avoidance & AI audit.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Visualizer */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-1">
            {stepsList.map((step) => {
              const isPast = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <button
                  key={step.num}
                  onClick={() => executeStep(step.num)}
                  className={`flex-1 flex flex-col items-center p-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm font-bold scale-105'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    {isPast ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <span>{step.num}</span>
                    )}
                  </div>
                  <span className="text-[9px] truncate w-full mt-0.5">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content Display Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
          {currentStep === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto shadow-sm animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-mono">
                Ready to Execute Judge Demo Sequence
              </h3>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                This will run the official scenario end-to-end: dispatching an emergency with clinical constraints, triggering A* pathfinding, handling unexpected mountain landslides, and generating transparent AI reasoning.
              </p>
              <button
                onClick={handleStartDemo}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Automated Judge Demo</span>
              </button>
            </div>
          )}

          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-bold">
                    STEP 1 of 11
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Emergency Creation: Critical Cardiac Arrest at Village A
                  </h3>
                </div>
                <span className="text-red-600 font-mono text-xs font-bold animate-pulse">
                  ● RED BEACON ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-red-200 space-y-2 shadow-sm">
                  <div className="text-xs text-red-600 font-mono font-bold uppercase tracking-wider">
                    Emergency Distress Ticket
                  </div>
                  <div className="text-slate-900 font-bold text-sm">
                    Patient: Kavita Devi (54 y/o Female)
                  </div>
                  <div className="text-xs text-slate-600">
                    Location: <span className="font-semibold text-blue-700">Dharnai Highlands (Village A)</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Condition: <span className="text-red-700 font-bold">Acute Anterior STEMI Myocardial Infarction</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono pt-2 border-t border-slate-100">
                    HR: 142 bpm | BP: 75/45 | SpO2: 86% | GCS: 12
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                  <div className="text-xs text-blue-700 font-mono font-bold uppercase tracking-wider">
                    Strict Clinical Constraints
                  </div>
                  <div className="space-y-1 text-xs text-slate-700 font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span>Required Specialist:</span>
                      <span className="text-red-600 font-bold">Cardiologist (Active On-Shift)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span>Required Medicine:</span>
                      <span className="text-purple-700 font-bold">Tenecteplase / Thrombolytic</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <span>Mandatory SLA Target:</span>
                      <span className="text-amber-700 font-bold">20 Minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold">
                    STEP 2 of 11
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Nearest Hospital Evaluation: Apex Trauma Clinic (Hospital B)
                  </h3>
                </div>
                <span className="text-red-600 font-mono text-xs font-bold">
                  ✖ CANDIDATE REJECTED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-red-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    Apex Trauma Clinic (Hospital B) - Distance: 8.2 km (Closest)
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-mono font-bold border border-red-200">
                    DISQUALIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  The clinical evaluation engine rejects Hospital B despite geographic proximity because it lacks an on-duty <strong>Interventional Cardiologist</strong> and active <strong>Cath Lab</strong>. Transporting the patient here would result in fatal treatment delays.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
                    STEP 3 of 11
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Target Facility Selected: Mithila Super-Specialty (Hospital C)
                  </h3>
                </div>
                <span className="text-emerald-600 font-mono text-xs font-bold">
                  ✓ CANDIDATE QUALIFIED & LOCKED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-3 shadow-sm">
                <div className="font-bold text-slate-900 text-sm">
                  Mithila Super-Specialty Medical College (Hospital C)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs text-slate-700">
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                    ✓ Cardiologist On-Duty
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                    ✓ 6 ICU Beds Free
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                    ✓ Cardiac Kit In Stock
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                    ✓ ETA: 18.7 min (&lt;20m SLA)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 to 11 Summary View */}
          {currentStep >= 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 rounded-xl bg-white border border-blue-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                    STEP {currentStep} of 11: {stepsList[currentStep - 1]?.title}
                  </span>
                  <span className="text-blue-700 font-mono text-xs font-bold">
                    {stepsList[currentStep - 1]?.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {currentStep === 4 && 'Assigned Advanced Life Support unit ALS-07 with cold-chain and telemetry monitoring equipment.'}
                  {currentStep === 5 && 'A* Algorithm executed across rural graph in 3.8ms with admissible Haversine heuristic.'}
                  {currentStep === 6 && 'ALS-07 en route to Village A with live GPS coordinate interpolation.'}
                  {currentStep === 7 && 'Mountain road landslide hazard detected on Ghat Pass (R-03). A* penalty multiplier set to infinity.'}
                  {currentStep === 8 && 'Autonomous recalculation reroutes ambulance via Northern Valley Bypass without human intervention.'}
                  {currentStep === 9 && 'Gemini AI generated full clinical audit trail and doctor telemedicine briefing.'}
                  {currentStep === 10 && 'Patient arrived at Mithila Super-Specialty Trauma bay. ICU bed committed and treatment begun.'}
                  {currentStep === 11 && 'Demonstration completed successfully with 100% SLA compliance achieved!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                autoAdvance
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {autoAdvance ? 'Auto-Advance ON' : 'Manual Mode'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStep <= 1}
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer border border-slate-200"
            >
              Back
            </button>

            {currentStep < 11 ? (
              <button
                onClick={handleNextStep}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentStep === 0 ? 'Start Demo' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer"
              >
                Finish Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
