/* ── HospitalPortal — Doctor & Healthcare Staff Operational Dashboard ──
   Features:
   - Real-time Bed Management (ICU, Oxygen, General)
   - Emergency Medicine & Blood Bag Stock Manager
   - Incoming Ambulance Emergency Queue with pre-arrival checklist
   - Hospital Status & Diversion Mode Toggle
*/

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BedDouble,
  Pill,
  Ambulance,
  Clock,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Droplet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Hospital, Dispatch } from '../../db/schema';
import { formatTime, formatDistance } from '../../utils/geo';
import './HospitalPortal.css';

interface HospitalPortalProps {
  hospital: Hospital;
  onUpdateBeds: (id: number, beds: number) => void;
  onUpdateMedicine: (id: number, medicine: string, qty: number) => void;
  incomingDispatches: Dispatch[];
}

export function HospitalPortal({
  hospital,
  onUpdateBeds,
  onUpdateMedicine,
  incomingDispatches,
}: HospitalPortalProps) {
  const { profile } = useAuth();
  const [isDiverting, setIsDiverting] = useState(false);
  const [icuBeds, setIcuBeds] = useState(Math.max(2, Math.floor(hospital.bedsAvailable * 0.2)));
  const [oxygenBeds, setOxygenBeds] = useState(Math.max(4, Math.floor(hospital.bedsAvailable * 0.4)));

  const handleBedAdjust = (delta: number) => {
    const next = Math.max(0, Math.min(hospital.bedsTotal, hospital.bedsAvailable + delta));
    onUpdateBeds(hospital.id, next);
  };

  const handleMedAdjust = (med: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    onUpdateMedicine(hospital.id, med, next);
  };

  const bedOccupancy = hospital.bedsTotal > 0
    ? Math.round(((hospital.bedsTotal - hospital.bedsAvailable) / hospital.bedsTotal) * 100)
    : 0;

  return (
    <div className="hospital-portal" id="hospital-portal">
      {/* Hospital Identity Bar */}
      <div className="hospital-portal__card clay-card">
        <div className="hospital-portal__header">
          <div className="hospital-portal__identity">
            <div className="hospital-portal__avatar">🏥</div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="hospital-portal__title">{hospital.name}</h2>
                <span className="clay-badge clay-badge--info">{hospital.tier}</span>
              </div>
              <p className="text-xs text-tertiary">Logged in as: {profile.name}</p>
            </div>
          </div>

          <button
            className={`clay-btn clay-btn--sm ${isDiverting ? 'clay-btn--danger' : 'clay-btn--primary'}`}
            onClick={() => setIsDiverting(!isDiverting)}
            title="Toggle emergency diversion status"
          >
            {isDiverting ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
            {isDiverting ? 'CRITICAL DIVERT' : 'ACCEPTING SOS'}
          </button>
        </div>
      </div>

      {/* Incoming Ambulances Queue */}
      <div className="hospital-portal__section clay-card">
        <div className="hospital-portal__section-header">
          <h3 className="hospital-portal__section-title">
            <Ambulance size={18} />
            Incoming Emergency Queue
          </h3>
          <span className="clay-badge clay-badge--danger">{incomingDispatches.length} Incoming</span>
        </div>

        {incomingDispatches.length === 0 ? (
          <div className="hospital-portal__empty-queue clay-card--inset">
            <CheckCircle2 size={24} className="text-success" />
            <p className="text-sm font-semibold">No pending inbound ambulances</p>
            <p className="text-xs text-tertiary">New dispatches routed to this facility will appear here in real-time</p>
          </div>
        ) : (
          <div className="hospital-portal__queue-list">
            {incomingDispatches.map((d) => (
              <motion.div
                key={d.id}
                className="hospital-portal__queue-item clay-card--flat"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="hospital-portal__queue-top">
                  <div className="flex items-center gap-2">
                    <span className={`clay-badge clay-badge--${d.urgencyTier === 1 ? 'danger' : d.urgencyTier === 2 ? 'warning' : 'success'}`}>
                      {d.urgencyTier === 1 ? '🔴 CRITICAL' : d.urgencyTier === 2 ? '🟡 URGENT' : '🟢 STANDARD'}
                    </span>
                    <strong>{d.patientName || `Patient #${d.patientId.slice(0, 6)}`}</strong>
                  </div>
                  <span className="hospital-portal__queue-eta text-success font-bold">
                    <Clock size={14} /> ETA {formatTime(d.eta)}
                  </span>
                </div>

                <div className="hospital-portal__queue-details text-xs">
                  <span>Distance: {formatDistance(d.routeDistance)}</span>
                  {d.requiredSpecialty && <span>Needs: <strong>{d.requiredSpecialty}</strong></span>}
                </div>

                {/* Pre-arrival Checklist */}
                <div className="hospital-portal__prep-box">
                  <span className="text-xs font-bold text-secondary">Pre-Arrival Triage Prep:</span>
                  <div className="flex gap-2 flex-wrap mt-1">
                    <span className="clay-badge clay-badge--warning text-xs">Prepare Trauma Bay</span>
                    <span className="clay-badge clay-badge--info text-xs">Alert On-Call Specialist</span>
                    <span className="clay-badge clay-badge--success text-xs">Ready Stretcher</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bed Capacity Management */}
      <div className="hospital-portal__section clay-card">
        <div className="hospital-portal__section-header">
          <h3 className="hospital-portal__section-title">
            <BedDouble size={18} />
            Bed Capacity & Triage Allocation
          </h3>
          <span className="text-sm font-bold text-secondary">
            {hospital.bedsAvailable} / {hospital.bedsTotal} Free ({100 - bedOccupancy}% available)
          </span>
        </div>

        {/* Master Bed Occupancy Progress */}
        <div className="clay-progress" style={{ height: 10 }}>
          <div
            className={`clay-progress__fill ${
              bedOccupancy > 80 ? 'clay-progress__fill--danger' : bedOccupancy > 50 ? 'clay-progress__fill--warning' : ''
            }`}
            style={{ width: `${100 - bedOccupancy}%` }}
          />
        </div>

        <div className="hospital-portal__beds-grid">
          {/* General Ward */}
          <div className="hospital-portal__bed-control clay-card--inset">
            <div>
              <strong>General Ward Beds</strong>
              <p className="text-xs text-tertiary">Total Available: {hospital.bedsAvailable}</p>
            </div>
            <div className="hospital-portal__stepper">
              <button
                className="clay-btn clay-btn--icon"
                onClick={() => handleBedAdjust(-1)}
              >
                <Minus size={14} />
              </button>
              <span className="hospital-portal__stepper-val">{hospital.bedsAvailable}</span>
              <button
                className="clay-btn clay-btn--icon"
                onClick={() => handleBedAdjust(1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* ICU Beds */}
          <div className="hospital-portal__bed-control clay-card--inset">
            <div>
              <strong className="flex items-center gap-1">
                <Flame size={14} className="text-danger" /> ICU / Critical Care
              </strong>
              <p className="text-xs text-tertiary">Ventilator Equipped</p>
            </div>
            <div className="hospital-portal__stepper">
              <button
                className="clay-btn clay-btn--icon"
                onClick={() => setIcuBeds(Math.max(0, icuBeds - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="hospital-portal__stepper-val">{icuBeds}</span>
              <button
                className="clay-btn clay-btn--icon"
                onClick={() => setIcuBeds(icuBeds + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Oxygen Beds */}
          <div className="hospital-portal__bed-control clay-card--inset">
            <div>
              <strong className="flex items-center gap-1">
                <Droplet size={14} className="text-info" /> High-Flow Oxygen Beds
              </strong>
              <p className="text-xs text-tertiary">Central O2 Line</p>
            </div>
            <div className="hospital-portal__stepper">
              <button
                className="clay-btn clay-btn--icon"
                onClick={() => setOxygenBeds(Math.max(0, oxygenBeds - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="hospital-portal__stepper-val">{oxygenBeds}</span>
              <button
                className="clay-btn clay-btn--icon"
                onClick={() => setOxygenBeds(oxygenBeds + 1)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Medicine Inventory */}
      <div className="hospital-portal__section clay-card">
        <div className="hospital-portal__section-header">
          <h3 className="hospital-portal__section-title">
            <Pill size={18} />
            Emergency Pharmacy & Stock
          </h3>
        </div>

        <div className="hospital-portal__med-grid">
          {Object.entries(hospital.medicineStock).slice(0, 8).map(([med, qty]) => {
            const isLow = qty < 15;
            return (
              <div key={med} className="hospital-portal__med-item clay-card--flat">
                <div className="hospital-portal__med-info">
                  <strong className="text-sm capitalize">{med}</strong>
                  <span className={`text-xs font-bold ${isLow ? 'text-danger flex items-center gap-1' : 'text-success'}`}>
                    {isLow && <AlertTriangle size={12} />} {qty} units
                  </span>
                </div>
                <div className="hospital-portal__med-btns">
                  <button
                    className="clay-btn clay-btn--icon"
                    onClick={() => handleMedAdjust(med, qty, -5)}
                    title="Consume 5"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    className="clay-btn clay-btn--icon"
                    onClick={() => handleMedAdjust(med, qty, 10)}
                    title="Restock 10"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
