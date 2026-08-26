/* ── DecisionLog — Route Decision Transparency ── */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollText, ChevronDown, ChevronUp, Clock, MapPin, AlertTriangle } from 'lucide-react';
import type { Dispatch } from '../db/schema';
import { formatTime, formatDistance } from '../utils/geo';
import './DecisionLog.css';

interface DecisionLogProps {
  dispatches: Dispatch[];
}

export function DecisionLog({ dispatches }: DecisionLogProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const urgencyEmoji = (tier: number) => tier === 1 ? '🔴' : tier === 2 ? '🟡' : '🟢';

  return (
    <div className="decision-log clay-card" id="decision-log">
      <h2 className="decision-log__title">
        <ScrollText size={18} />
        Decision Log
        {dispatches.length > 0 && (
          <span className="clay-badge clay-badge--success">{dispatches.length}</span>
        )}
      </h2>

      {dispatches.length === 0 ? (
        <div className="decision-log__empty">
          <AlertTriangle size={24} className="text-tertiary" />
          <p className="text-sm text-tertiary">No dispatches yet</p>
          <p className="text-xs text-tertiary">Create a dispatch to see routing decisions here</p>
        </div>
      ) : (
        <div className="decision-log__list">
          {dispatches.map((d) => {
            const isExpanded = expandedId === d.id;
            const time = new Date(d.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <motion.div
                key={d.id}
                className="decision-log__entry"
                layout
                onClick={() => setExpandedId(isExpanded ? null : (d.id ?? null))}
              >
                <div className="decision-log__entry-header">
                  <div className="decision-log__entry-left">
                    <span className="decision-log__urgency">{urgencyEmoji(d.urgencyTier)}</span>
                    <div>
                      <p className="decision-log__entry-title text-sm font-semibold">
                        Dispatch #{d.id}
                      </p>
                      <p className="decision-log__entry-time text-xs text-tertiary">
                        <Clock size={10} /> {time}
                      </p>
                    </div>
                  </div>
                  <div className="decision-log__entry-right">
                    <span className={`clay-badge clay-badge--${d.status === 'SYNC_PENDING' ? 'danger' : 'success'}`}>
                      {d.status}
                    </span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Quick info */}
                <div className="decision-log__quick">
                  <span className="text-xs">
                    <MapPin size={10} /> {formatDistance(d.routeDistance)} • {formatTime(d.routeTime)}
                  </span>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className="decision-log__details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="decision-log__detail-row">
                        <span className="text-xs text-tertiary">Hospital</span>
                        <span className="text-xs font-bold">ID #{d.assignedHospitalId}</span>
                      </div>
                      <div className="decision-log__detail-row">
                        <span className="text-xs text-tertiary">Route Nodes</span>
                        <span className="text-xs font-bold">{d.routeNodeIds.length}</span>
                      </div>
                      {d.requiredSpecialty && (
                        <div className="decision-log__detail-row">
                          <span className="text-xs text-tertiary">Specialty</span>
                          <span className="text-xs font-bold">{d.requiredSpecialty}</span>
                        </div>
                      )}
                      <div className="decision-log__rationale">
                        <span className="text-xs font-semibold">💡 Rationale:</span>
                        <p className="text-xs">{d.rationale}</p>
                      </div>
                      {d.alternativesConsidered.length > 0 && (
                        <div className="decision-log__alternatives">
                          <span className="text-xs font-semibold text-tertiary">Alternatives:</span>
                          {d.alternativesConsidered.map((alt, i) => (
                            <p key={i} className="text-xs text-tertiary">
                              • {alt.hospitalName} (score: {alt.score})
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
