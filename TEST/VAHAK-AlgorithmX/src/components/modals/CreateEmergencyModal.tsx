import React, { useState } from 'react';
import {
  X,
  Flame,
  User,
  Phone,
  MapPin,
  Stethoscope,
  Activity,
  Heart,
  Plane,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { SeverityLevel } from '../../types';

export const CreateEmergencyModal: React.FC = () => {
  const { createEmergencyModalOpen, villages, createNewEmergency } = useHealthcareStore();

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number>(42);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [callerPhone, setCallerPhone] = useState('+91 98450 12345');
  const [selectedVillageId, setSelectedVillageId] = useState(villages[0]?.id || 'vil-01');
  const [condition, setCondition] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('Critical');
  const [requiredSpecialist, setRequiredSpecialist] = useState('Emergency Physician');
  const [droneSupportRequested, setDroneSupportRequested] = useState(false);
  const [heartRate, setHeartRate] = useState(115);
  const [bloodPressure, setBloodPressure] = useState('145/95');
  const [spO2, setSpO2] = useState(91);

  if (!createEmergencyModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVillage = villages.find((v) => v.id === selectedVillageId) || villages[0];

    createNewEmergency({
      patientName: patientName || 'Distress Beacon Caller',
      patientAge: Number(patientAge),
      patientGender,
      callerPhone,
      villageId: selectedVillage.id,
      villageName: selectedVillage.name,
      position: selectedVillage.position,
      condition: condition || 'Acute unclassified distress reported via emergency SOS.',
      severity,
      requiredSpecialist,
      droneSupportRequested,
      vitals: {
        heartRate: Number(heartRate),
        bloodPressure,
        spO2: Number(spO2),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Log New Rural Medical Emergency (SOS Intake)
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Broadcasting immediate priority beacon to 3D Command Dispatchers
              </p>
            </div>
          </div>

          <button
            onClick={() => useHealthcareStore.setState({ createEmergencyModalOpen: false })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indian Rural Emergency Dummy Case Presets Bar */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>1-CLICK INDIAN RURAL DUMMY CASES:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-sans">Click to auto-populate scenario</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPatientName('Ravi Kisku');
                setPatientAge(34);
                setPatientGender('Male');
                setCondition('Acute Russell Viper Envenomation (Neurotoxic & Hemotoxic with Compartment Syndrome)');
                setSeverity('Critical');
                setRequiredSpecialist('Toxicologist / Antivenom Lead');
                setDroneSupportRequested(true);
                setHeartRate(138);
                setBloodPressure('82/48');
                setSpO2(86);
              }}
              className="px-2 py-1.5 text-left rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-[10px] font-mono text-slate-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 truncate"
            >
              <span>🐍</span>
              <span className="truncate font-semibold">Bihar: Snakebite Envenomation</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPatientName('Sunita Majhi');
                setPatientAge(26);
                setPatientGender('Female');
                setCondition('Severe Postpartum Hemorrhage & Class III Hypovolemic Shock in Remote Hilltop');
                setSeverity('Critical');
                setRequiredSpecialist('High-Risk Obstetrician');
                setDroneSupportRequested(true);
                setHeartRate(146);
                setBloodPressure('70/40');
                setSpO2(84);
              }}
              className="px-2 py-1.5 text-left rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-[10px] font-mono text-slate-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 truncate"
            >
              <span>🤰</span>
              <span className="truncate font-semibold">Odisha: Postpartum Shock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPatientName('Dinesh Rawat');
                setPatientAge(48);
                setPatientGender('Male');
                setCondition('High-Altitude Highway Landslide Vehicle Rollover with Depressed Skull Fracture');
                setSeverity('Critical');
                setRequiredSpecialist('Trauma Surgeon');
                setDroneSupportRequested(false);
                setHeartRate(118);
                setBloodPressure('155/100');
                setSpO2(88);
              }}
              className="px-2 py-1.5 text-left rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-[10px] font-mono text-slate-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 truncate"
            >
              <span>⛰️</span>
              <span className="truncate font-semibold">Uttarakhand: Landslide Trauma</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPatientName('Laxman Soren');
                setPatientAge(42);
                setPatientGender('Male');
                setCondition('Severe Agricultural Organophosphate Pesticide Inhalation with Severe Bronchospasm');
                setSeverity('Critical');
                setRequiredSpecialist('Toxicologist / Antivenom Lead');
                setDroneSupportRequested(true);
                setHeartRate(52);
                setBloodPressure('90/60');
                setSpO2(81);
              }}
              className="px-2 py-1.5 text-left rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[10px] font-mono text-slate-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 truncate"
            >
              <span>🌾</span>
              <span className="truncate font-semibold">Jharkhand: Pesticide Poisoning</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPatientName('Baby of Anita Saikia');
                setPatientAge(1);
                setPatientGender('Female');
                setCondition('River Island Flood Inundation Neonatal Respiratory Distress & Sepsis');
                setSeverity('Critical');
                setRequiredSpecialist('Pediatric Critical Care');
                setDroneSupportRequested(true);
                setHeartRate(175);
                setBloodPressure('65/35');
                setSpO2(78);
              }}
              className="px-2 py-1.5 text-left rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[10px] font-mono text-slate-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 truncate"
            >
              <span>🌊</span>
              <span className="truncate font-semibold">Assam: Island Neonatal Distress</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPatientName('Bhanu Pratap Baghel');
                setPatientAge(61);
                setPatientGender('Male');
                setCondition('Acute STEMI Inferior Wall Cardiac Arrest with Cardiogenic Shock');
                setSeverity('Critical');
                setRequiredSpecialist('Interventional Cardiologist');
                setDroneSupportRequested(false);
                setHeartRate(132);
                setBloodPressure('78/46');
                setSpO2(87);
              }}
              className="px-2 py-1.5 text-left rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-[10px] font-mono text-slate-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 truncate"
            >
              <span>🫀</span>
              <span className="truncate font-semibold">Bastar: STEMI Cardiac Shock</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 font-sans text-xs bg-slate-50">
          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-slate-700 font-bold uppercase">
                Patient Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-sans shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-700 font-bold uppercase">
                Age & Gender
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="115"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-16 px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono shadow-sm"
                />
                <select
                  value={patientGender}
                  onChange={(e: any) => setPatientGender(e.target.value)}
                  className="flex-1 px-2 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono shadow-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Village & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-700 font-bold uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Incident Village Settlement</span>
              </label>
              <select
                value={selectedVillageId}
                onChange={(e) => setSelectedVillageId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono shadow-sm"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Pop: {v.population})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-700 font-bold uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Caller / ASHA Worker Contact</span>
              </label>
              <input
                type="text"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono shadow-sm"
              />
            </div>
          </div>

          {/* Symptoms & Condition */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-700 font-bold uppercase">
              Condition & Reported Symptoms
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Acute severe chest pain radiating to left arm, shortness of breath, diaphoretic..."
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 font-sans shadow-sm"
            />
          </div>

          {/* Urgency & Specialist Needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-700 font-bold uppercase">
                Severity Level
              </label>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                {(['Critical', 'High', 'Medium', 'Low'] as SeverityLevel[]).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                      severity === s
                        ? s === 'Critical'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : s === 'High'
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : s === 'Medium'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-700 font-bold uppercase">
                Required Specialist
              </label>
              <select
                value={requiredSpecialist}
                onChange={(e) => setRequiredSpecialist(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-xs shadow-sm"
              >
                <option value="Interventional Cardiologist">Interventional Cardiologist</option>
                <option value="Trauma Surgeon">Trauma Surgeon</option>
                <option value="High-Risk Obstetrician">High-Risk Obstetrician</option>
                <option value="Pediatric Critical Care">Pediatric Critical Care</option>
                <option value="Toxicologist / Antivenom Lead">Toxicologist / Antivenom Lead</option>
                <option value="Emergency Physician">Emergency Physician</option>
              </select>
            </div>
          </div>

          {/* Vitals Telemetry */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
              Reported Vitals (ASHA Pulse Oximeter / BP Cuff)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-600 font-mono">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-mono">Blood Pressure</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 font-mono">SpO2 (%)</label>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(Number(e.target.value))}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* eVTOL Drone Support Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Plane className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-bold text-slate-900 text-xs">Request eVTOL Drone Medical Airdrop</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Auto-dispatches medicine payload (Antivenom, Blood, Oxytocin)
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={droneSupportRequested}
              onChange={(e) => setDroneSupportRequested(e.target.checked)}
              className="accent-purple-600 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <button
              type="button"
              onClick={() => useHealthcareStore.setState({ createEmergencyModalOpen: false })}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-600 hover:text-slate-900 bg-white border border-slate-200 transition-colors cursor-pointer shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>BROADCAST SOS TO COMMAND CENTER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
