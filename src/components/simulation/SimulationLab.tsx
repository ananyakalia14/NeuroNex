import React, { useState } from 'react';
import {
  PlayCircle,
  StopCircle,
  FastForward,
  AlertTriangle,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { INITIAL_SIMULATIONS, type SimulationScenario } from '../../data/simulationScenarios';
import { soundEffects } from '../../services/soundEffects';
import './SimulationLab.css';

interface SimulationLabProps {
  onNavigateToMap?: () => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({ onNavigateToMap }) => {
  const [simulations] = useState<SimulationScenario[]>(INITIAL_SIMULATIONS);
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);

  const [demoState, setDemoState] = useState<{
    running: boolean;
    currentStep: number;
    patientName: string;
    condition: string;
    rejectedHospitalName: string;
    selectedHospitalName: string;
    blockedRoadName: string;
    oldEta: number;
    newEta: number;
  }>({
    running: false,
    currentStep: 0,
    patientName: 'Ramesh Patel (Cardiac Emergency)',
    condition: 'Acute Anterior STEMI (Myocardial Infarction)',
    rejectedHospitalName: 'Shastri Nagar Local Clinic (No Cardiologist on duty)',
    selectedHospitalName: 'AIMS Super-Specialty Trauma & Cardiology Hospital (MIDC Dombivli)',
    blockedRoadName: 'Kalyan-Shilphata Lowland Pass (Inundation Sec-03)',
    oldEta: 12,
    newEta: 18,
  });

  const runVerificationScenario = () => {
    soundEffects.playEmergencyAlert();
    setDemoState((s) => ({ ...s, running: true, currentStep: 1 }));

    setTimeout(() => {
      soundEffects.playWarning();
      setDemoState((s) => ({ ...s, currentStep: 2 }));

      setTimeout(() => {
        soundEffects.playDispatchConfirmed();
        setDemoState((s) => ({ ...s, currentStep: 3 }));

        setTimeout(() => {
          soundEffects.playRecalculateSweep();
          setDemoState((s) => ({ ...s, currentStep: 4 }));

          setTimeout(() => {
            soundEffects.playSuccess();
            setDemoState((s) => ({ ...s, currentStep: 5 }));
          }, 1800);
        }, 2200);
      }, 2000);
    }, 1800);
  };

  const resetVerificationScenario = () => {
    soundEffects.playClick();
    setDemoState({
      running: false,
      currentStep: 0,
      patientName: 'Ramesh Patel (Cardiac Emergency)',
      condition: 'Acute Anterior STEMI (Myocardial Infarction)',
      rejectedHospitalName: 'Shastri Nagar Local Clinic (No Cardiologist on duty)',
      selectedHospitalName: 'AIMS Super-Specialty Trauma & Cardiology Hospital (MIDC Dombivli)',
      blockedRoadName: 'Kalyan-Shilphata Lowland Pass (Inundation Sec-03)',
      oldEta: 12,
      newEta: 18,
    });
  };


  const startScenario = (id: string) => {
    soundEffects.playWarning();
    setActiveSimulationId(id);
    setIsSimulationRunning(true);
    setSimulationStep(1);
  };

  const stopScenario = () => {
    soundEffects.playClick();
    setActiveSimulationId(null);
    setIsSimulationRunning(false);
    setSimulationStep(0);
  };

  const stepScenario = () => {
    soundEffects.playRecalculateSweep();
    setSimulationStep((s) => s + 1);
  };

  return (
    <div className="sim-lab">
      <div className="sim-lab__header">
        <div>
          <div className="sim-lab__title-row">
            <h1 className="sim-lab__title">Emergency Stress Simulation & Algorithmic Lab</h1>
            <span className="sim-lab__badge">ALGORITHMIC VERIFICATION</span>
          </div>
          <p className="sim-lab__subtitle">
            Validate intelligent routing: Clinical Specialization Triage, Incompatible Clinic Rejection, and Real-Time Autonomous Landslide Rerouting.
          </p>
        </div>

        {isSimulationRunning && (
          <div className="sim-lab__running-controls">
            <button onClick={stepScenario} className="sim-lab__btn sim-lab__btn--step">
              <FastForward size={14} /> Next Phase (Step {simulationStep + 1})
            </button>
            <button onClick={stopScenario} className="sim-lab__btn sim-lab__btn--stop">
              <StopCircle size={14} /> End Simulation
            </button>
          </div>
        )}
      </div>

      <div className="sim-lab__harness">
        <div className="sim-lab__harness-top">
          <div className="sim-lab__harness-info">
            <div className="sim-lab__harness-icon">
              <Zap size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="sim-lab__harness-title-row">
                <h2 className="sim-lab__harness-title">
                  LIVE DEMO SCENARIO: Clinical Specialization Selection & Autonomous Reroute
                </h2>
                <span className="sim-lab__pill-tag">Automated Test</span>
              </div>
              <p className="sim-lab__harness-desc">
                Demonstrates automatic rejection of nearest clinic lacking Cardiologist/ICU, selection of capable trauma center, and real-time path recalculation when road gets blocked.
              </p>
            </div>
          </div>

          <div>
            {demoState.running ? (
              <button onClick={resetVerificationScenario} className="sim-lab__btn sim-lab__btn--secondary">
                <RotateCcw size={14} /> Reset Scenario
              </button>
            ) : (
              <button onClick={runVerificationScenario} className="sim-lab__btn sim-lab__btn--primary">
                <PlayCircle size={16} />
                <span>EXECUTE VERIFICATION DEMO</span>
              </button>
            )}
          </div>
        </div>

        <div className="sim-lab__steps-grid">
          <div className={`sim-lab__step-card ${demoState.currentStep >= 1 ? 'sim-lab__step-card--active' : ''}`}>
            <div className="sim-lab__step-head">
              <span>PHASE 1: SOS INGEST</span>
              {demoState.currentStep >= 1 && <CheckCircle2 size={14} className="text-blue-400" />}
            </div>
            <div className="sim-lab__step-name">Cardiac Emergency SOS</div>
            <p className="sim-lab__step-desc">
              Requires on-duty <strong>Cardiologist</strong> & <strong>Cath Lab / ICU</strong>.
            </p>
          </div>

          <div className={`sim-lab__step-card ${demoState.currentStep >= 2 ? 'sim-lab__step-card--reject' : ''}`}>
            <div className="sim-lab__step-head">
              <span>PHASE 2: CLINICAL REJECTION</span>
              {demoState.currentStep >= 2 && <XCircle size={14} className="text-red-400" />}
            </div>
            <div className="sim-lab__step-name text-red-400">Nearest Clinic Rejected</div>
            <p className="sim-lab__step-desc">
              Nearest facility rejected: <em>No on-duty Cardiologist / 0 ICU beds</em>.
            </p>
          </div>

          <div className={`sim-lab__step-card ${demoState.currentStep >= 3 ? 'sim-lab__step-card--success' : ''}`}>
            <div className="sim-lab__step-head">
              <span>PHASE 3: ATOMIC LOCK</span>
              {demoState.currentStep >= 3 && <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <div className="sim-lab__step-name text-emerald-400">Super-Specialty Locked</div>
            <p className="sim-lab__step-desc">
              Selected: <strong>{demoState.selectedHospitalName}</strong> (ALS Unit en route).
            </p>
          </div>

          <div className={`sim-lab__step-card ${demoState.currentStep >= 4 ? 'sim-lab__step-card--reroute' : ''}`}>
            <div className="sim-lab__step-head">
              <span>PHASE 4: DYNAMIC REROUTE</span>
              {demoState.currentStep >= 5 ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : demoState.currentStep === 4 ? (
                <AlertTriangle size={14} className="text-amber-400 animate-pulse" />
              ) : null}
            </div>
            <div className="sim-lab__step-name text-amber-400">
              {demoState.currentStep >= 5 ? 'Autonomously Rerouted ✓' : 'Landslide Blockage'}
            </div>
            <p className="sim-lab__step-desc">
              {demoState.currentStep >= 5
                ? 'A* trajectory recalculated via Northern Bypass.'
                : 'Road severed. Recalculating A* trajectory...'}
            </p>
          </div>
        </div>

        {demoState.currentStep > 0 && (
          <div className="sim-lab__result-banner">
            <div className="sim-lab__result-left">
              <Sparkles size={16} className="text-blue-400" />
              <span>
                Active Incident: <strong>{demoState.patientName}</strong> • Target:{' '}
                <strong className="text-emerald-400">{demoState.selectedHospitalName}</strong>
              </span>
            </div>
            {onNavigateToMap && (
              <button onClick={onNavigateToMap} className="sim-lab__view-map-btn">
                Watch in Live Map <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="sim-lab__catalog-section">
        <h2 className="sim-lab__catalog-title">Extreme Disaster Scenario Catalog</h2>
        <div className="sim-lab__catalog-grid">
          {simulations.map((scn) => {
            const isActive = activeSimulationId === scn.id;

            return (
              <div
                key={scn.id}
                className={`sim-lab__scenario-card ${isActive ? 'sim-lab__scenario-card--active' : ''}`}
              >
                <div className="sim-lab__scenario-header">
                  <div className="sim-lab__scenario-title-grp">
                    <div className="sim-lab__scenario-icon">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 className="sim-lab__scenario-name">{scn.title}</h3>
                      <div className="sim-lab__scenario-cat">Category: {scn.category}</div>
                    </div>
                  </div>

                  <span className="sim-lab__risk-badge">Risk: {scn.riskFactorScore}/100</span>
                </div>

                <p className="sim-lab__scenario-desc">{scn.description}</p>

                <div className="sim-lab__scenario-specs">
                  <div>
                    <div className="sim-lab__spec-lbl">INFRASTRUCTURE IMPACT</div>
                    <div className="sim-lab__spec-val">{scn.blockedRoadNames.join(', ')}</div>
                  </div>
                  <div>
                    <div className="sim-lab__spec-lbl">INITIAL CASUALTIES</div>
                    <div className="sim-lab__spec-val text-red-400">{scn.initialCasualties} Critical Patients</div>
                  </div>
                </div>

                <button
                  disabled={isSimulationRunning && !isActive}
                  onClick={() => {
                    if (isActive) stopScenario();
                    else startScenario(scn.id);
                  }}
                  className={`sim-lab__launch-btn ${isActive ? 'sim-lab__launch-btn--active' : ''}`}
                >
                  {isActive ? (
                    <>
                      <StopCircle size={14} />
                      <span>TERMINATE ACTIVE SIMULATION</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={14} />
                      <span>LAUNCH SIMULATION SCENARIO</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
