/* ── HospitalList — Hospital Management Cards ── */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, BedDouble, Pill, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import type { Hospital } from '../db/schema';
import './HospitalList.css';

interface HospitalListProps {
  hospitals: Hospital[];
  onUpdateBeds: (id: number, beds: number) => void;
  onHighlight: (nodeId: number) => void;
}

export function HospitalList({ hospitals, onUpdateBeds, onHighlight }: HospitalListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalBeds = hospitals.reduce((sum, h) => sum + h.bedsAvailable, 0);
  const totalCapacity = hospitals.reduce((sum, h) => sum + h.bedsTotal, 0);

  return (
    <div className="hospital-list" id="hospital-list">
      <h2 className="hospital-list__title">
        <Building2 size={20} />
        Hospitals
        <span className="clay-badge clay-badge--info">{hospitals.length}</span>
      </h2>

      {/* Summary bar */}
      <div className="hospital-list__summary clay-card--inset">
        <div className="hospital-list__summary-stat">
          <BedDouble size={14} />
          <span>{totalBeds}/{totalCapacity} beds available</span>
        </div>
        <div className="clay-progress">
          <div
            className={`clay-progress__fill ${
              totalBeds / totalCapacity < 0.2 ? 'clay-progress__fill--danger' :
              totalBeds / totalCapacity < 0.5 ? 'clay-progress__fill--warning' : ''
            }`}
            style={{ width: `${(totalBeds / totalCapacity) * 100}%` }}
          />
        </div>
      </div>

      {/* Hospital cards */}
      <div className="hospital-list__cards">
        {hospitals.map((h) => {
          const isExpanded = expandedId === h.id;
          const bedPercent = h.bedsTotal > 0 ? (h.bedsAvailable / h.bedsTotal) * 100 : 0;
          const bedStatus = bedPercent > 50 ? 'good' : bedPercent > 20 ? 'warning' : 'danger';

          return (
            <motion.div
              key={h.id}
              className="hospital-card clay-card--flat"
              layout
              onClick={() => onHighlight(h.nodeId)}
            >
              <div className="hospital-card__header" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : h.id); }}>
                <div className="hospital-card__info">
                  <h3 className="hospital-card__name">{h.name}</h3>
                  <span className={`clay-badge clay-badge--${h.tier === 'DH' ? 'info' : h.tier === 'CHC' ? 'success' : 'warning'}`}>
                    {h.tier}
                  </span>
                </div>
                <div className="hospital-card__beds">
                  <span className={`hospital-card__bed-count hospital-card__bed-count--${bedStatus}`}>
                    {h.bedsAvailable}/{h.bedsTotal}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Bed progress */}
              <div className="clay-progress" style={{ height: 6 }}>
                <div
                  className={`clay-progress__fill ${
                    bedStatus === 'danger' ? 'clay-progress__fill--danger' :
                    bedStatus === 'warning' ? 'clay-progress__fill--warning' : ''
                  }`}
                  style={{ width: `${bedPercent}%` }}
                />
              </div>

              {/* Specialties tags */}
              <div className="hospital-card__tags">
                {h.specialties.slice(0, 4).map((s) => (
                  <span key={s} className="hospital-card__tag">{s}</span>
                ))}
                {h.specialties.length > 4 && (
                  <span className="hospital-card__tag">+{h.specialties.length - 4}</span>
                )}
              </div>

              {/* Expanded: bed controls + medicine */}
              {isExpanded && (
                <motion.div
                  className="hospital-card__expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Bed adjustment */}
                  <div className="hospital-card__bed-controls">
                    <label className="text-sm font-semibold">
                      <BedDouble size={14} /> Adjust Beds
                    </label>
                    <div className="hospital-card__bed-btns">
                      <button
                        className="clay-btn clay-btn--icon"
                        onClick={(e) => { e.stopPropagation(); onUpdateBeds(h.id, Math.max(0, h.bedsAvailable - 1)); }}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="hospital-card__bed-value">{h.bedsAvailable}</span>
                      <button
                        className="clay-btn clay-btn--icon"
                        onClick={(e) => { e.stopPropagation(); onUpdateBeds(h.id, Math.min(h.bedsTotal, h.bedsAvailable + 1)); }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Top medicines */}
                  <div className="hospital-card__medicines">
                    <label className="text-sm font-semibold">
                      <Pill size={14} /> Key Medicines
                    </label>
                    <div className="hospital-card__med-grid">
                      {Object.entries(h.medicineStock).slice(0, 6).map(([med, qty]) => (
                        <div key={med} className="hospital-card__med-item">
                          <span className="text-xs">{med}</span>
                          <span className={`text-xs font-bold ${qty < 10 ? 'text-danger' : qty < 30 ? 'text-warning' : 'text-success'}`}>
                            {qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
