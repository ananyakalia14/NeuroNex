/* ── DispatchPanel — Emergency Dispatch Interface ──
   Big buttons for illiterate-friendly use
   3 urgency tiers → select location → send ambulance
*/

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Siren, AlertTriangle, HeartPulse, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import type { UrgencyTier, Specialty, GraphNode } from '../db/schema';
import type { RouteResult } from '../workers/types';
import { formatTime, formatDistance } from '../utils/geo';
import './DispatchPanel.css';

interface DispatchPanelProps {
  selectedNode: GraphNode | null;
  isComputing: boolean;
  lastResult: RouteResult | null;
  onDispatch: (urgency: UrgencyTier, specialty?: Specialty, medicine?: string) => void;
}

type DispatchStep = 'SELECT_URGENCY' | 'SELECT_OPTIONS' | 'COMPUTING' | 'RESULT';

const SPECIALTIES: { value: Specialty; label: string; icon: string }[] = [
  { value: 'general', label: 'General', icon: '🏥' },
  { value: 'emergency', label: 'Emergency', icon: '🚨' },
  { value: 'pediatrics', label: 'Pediatrics', icon: '👶' },
  { value: 'orthopedics', label: 'Orthopedics', icon: '🦴' },
  { value: 'cardiology', label: 'Cardiology', icon: '❤️' },
  { value: 'obstetrics', label: 'Obstetrics', icon: '🤰' },
];

export function DispatchPanel({ selectedNode, isComputing, lastResult, onDispatch }: DispatchPanelProps) {
  const [step, setStep] = useState<DispatchStep>('SELECT_URGENCY');
  const [urgency, setUrgency] = useState<UrgencyTier>(1);
  const [specialty, setSpecialty] = useState<Specialty | undefined>(undefined);

  const handleUrgencySelect = (tier: UrgencyTier) => {
    setUrgency(tier);
    setStep('SELECT_OPTIONS');
  };

  const handleSendAmbulance = () => {
    setStep('COMPUTING');
    onDispatch(urgency, specialty);
  };

  const handleReset = () => {
    setStep('SELECT_URGENCY');
    setUrgency(1);
    setSpecialty(undefined);
  };

  // Auto-advance to result when computation finishes
  if (step === 'COMPUTING' && !isComputing && lastResult) {
    setTimeout(() => setStep('RESULT'), 100);
  }

  return (
    <div className="dispatch-panel clay-card" id="dispatch-panel">
      <h2 className="dispatch-panel__title">
        <Siren size={20} />
        Emergency Dispatch
      </h2>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Urgency */}
        {step === 'SELECT_URGENCY' && (
          <motion.div
            key="urgency"
            className="dispatch-panel__step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="dispatch-panel__instruction">Select Emergency Level</p>

            <button
              className="clay-btn clay-btn--xl clay-btn--danger dispatch-btn--critical"
              onClick={() => handleUrgencySelect(1)}
              id="dispatch-critical-btn"
            >
              <HeartPulse size={28} />
              🔴 CRITICAL
              <span className="dispatch-btn__sub">Life-threatening</span>
            </button>

            <button
              className="clay-btn clay-btn--xl clay-btn--warning dispatch-btn--urgent"
              onClick={() => handleUrgencySelect(2)}
              id="dispatch-urgent-btn"
            >
              <AlertTriangle size={28} />
              🟡 URGENT
              <span className="dispatch-btn__sub">Needs attention soon</span>
            </button>

            <button
              className="clay-btn clay-btn--xl clay-btn--primary dispatch-btn--standard"
              onClick={() => handleUrgencySelect(3)}
              id="dispatch-standard-btn"
            >
              <Navigation size={28} />
              🟢 STANDARD
              <span className="dispatch-btn__sub">Non-emergency transport</span>
            </button>
          </motion.div>
        )}

        {/* Step 2: Select Options */}
        {step === 'SELECT_OPTIONS' && (
          <motion.div
            key="options"
            className="dispatch-panel__step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="dispatch-panel__selected-urgency">
              <span className={`dispatch-tier dispatch-tier--${urgency}`}>
                {urgency === 1 ? '🔴 CRITICAL' : urgency === 2 ? '🟡 URGENT' : '🟢 STANDARD'}
              </span>
              <button className="text-sm text-secondary" onClick={handleReset}>Change</button>
            </div>

            {/* Location */}
            <div className="dispatch-panel__field">
              <label className="dispatch-panel__label">📍 Patient Location</label>
              <div className={`dispatch-panel__location clay-card--inset ${selectedNode ? '' : 'dispatch-panel__location--empty'}`}>
                {selectedNode ? (
                  <span>{selectedNode.name || `Node #${selectedNode.id}`} ({selectedNode.type})</span>
                ) : (
                  <span>👆 Tap on the map to select location</span>
                )}
              </div>
            </div>

            {/* Specialty */}
            <div className="dispatch-panel__field">
              <label className="dispatch-panel__label">🏥 Required Specialty (optional)</label>
              <div className="dispatch-panel__specialties">
                {SPECIALTIES.map((s) => (
                  <button
                    key={s.value}
                    className={`clay-btn clay-btn--ghost dispatch-specialty ${specialty === s.value ? 'dispatch-specialty--active' : ''}`}
                    onClick={() => setSpecialty(specialty === s.value ? undefined : s.value)}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Send button */}
            <button
              className="clay-btn clay-btn--xl clay-btn--primary"
              disabled={!selectedNode}
              onClick={handleSendAmbulance}
              id="send-ambulance-btn"
              style={{ opacity: selectedNode ? 1 : 0.5 }}
            >
              🚑 SEND AMBULANCE
            </button>
          </motion.div>
        )}

        {/* Step 3: Computing */}
        {step === 'COMPUTING' && (
          <motion.div
            key="computing"
            className="dispatch-panel__step dispatch-panel__computing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Loader2 size={48} className="dispatch-panel__spinner" />
            <p className="text-lg font-semibold">Computing Optimal Route...</p>
            <p className="text-sm text-secondary">Analyzing {'>'}50K nodes with A* pathfinding</p>
          </motion.div>
        )}

        {/* Step 4: Result */}
        {step === 'RESULT' && lastResult && (
          <motion.div
            key="result"
            className="dispatch-panel__step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="dispatch-result">
              <CheckCircle2 size={32} className="dispatch-result__icon" />
              <h3 className="dispatch-result__title">Ambulance Dispatched!</h3>

              <div className="dispatch-result__details clay-card--inset">
                <div className="dispatch-result__row">
                  <span className="text-secondary">Hospital</span>
                  <strong>{lastResult.hospitalName}</strong>
                </div>
                <div className="dispatch-result__row">
                  <span className="text-secondary">ETA</span>
                  <strong className="text-success">{formatTime(lastResult.totalTime)}</strong>
                </div>
                <div className="dispatch-result__row">
                  <span className="text-secondary">Distance</span>
                  <strong>{formatDistance(lastResult.totalDistance)}</strong>
                </div>
                <div className="dispatch-result__row">
                  <span className="text-secondary">Compute Time</span>
                  <strong>{lastResult.computeTimeMs}ms</strong>
                </div>
                <div className="dispatch-result__row">
                  <span className="text-secondary">Route Nodes</span>
                  <strong>{lastResult.routeNodeIds.length}</strong>
                </div>
              </div>

              <p className="dispatch-result__rationale text-sm">
                💡 {lastResult.rationale}
              </p>

              {lastResult.alternativesConsidered.length > 0 && (
                <div className="dispatch-result__alternatives">
                  <p className="text-xs text-tertiary font-semibold">Alternatives considered:</p>
                  {lastResult.alternativesConsidered.map((alt, i) => (
                    <p key={i} className="text-xs text-tertiary">
                      {i + 2}. {alt.hospitalName} — Score: {alt.score} | {alt.reason}
                    </p>
                  ))}
                </div>
              )}

              <button
                className="clay-btn clay-btn--lg clay-btn--secondary w-full"
                onClick={handleReset}
                id="new-dispatch-btn"
              >
                New Dispatch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
