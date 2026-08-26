import React, { useState } from 'react';
import {
  Radio,
  Shield,
  Lock,
  Mail,
  User,
  Headphones,
  Stethoscope,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  Zap,
  Building2,
  Truck,
  Plane,
  Home,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';
import { User as UserType } from '../types';
import { soundEffects } from '../services/soundEffects';

export const LoginPage: React.FC = () => {
  const { login } = useHealthcareStore();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<'Director' | 'Dispatcher' | 'Surgeon'>('Director');
  const [email, setEmail] = useState('e.vasquez@ruralhealth.ops.gov');
  const [password, setPassword] = useState('•••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const roleProfiles: Record<string, { email: string; user: UserType }> = {
    Director: {
      email: 'e.vasquez@ruralhealth.ops.gov',
      user: {
        id: 'usr-001',
        name: 'Dr. Evelyn Vasquez',
        email: 'e.vasquez@ruralhealth.ops.gov',
        role: 'COMMAND_DIRECTOR',
        badgeNumber: 'CMD-9941',
        department: 'Central Emergency Command Directorate',
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      },
    },
    Dispatcher: {
      email: 'l.ross@ruralhealth.dispatch.gov',
      user: {
        id: 'usr-002',
        name: 'Liam Ross',
        email: 'l.ross@ruralhealth.dispatch.gov',
        role: 'FLEET_DISPATCHER',
        badgeNumber: 'DSP-4410',
        department: 'Tactical Fleet & Drone Medivac Wing',
        avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      },
    },
    Surgeon: {
      email: 'a.thorne@apollo.trauma.org',
      user: {
        id: 'usr-003',
        name: 'Dr. Aris Thorne',
        email: 'a.thorne@apollo.trauma.org',
        role: 'HOSPITAL_CHIEF',
        badgeNumber: 'MED-1102',
        department: 'Regional Trauma Surgery Consortium',
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      },
    },
  };

  const handleRoleSelect = (role: 'Director' | 'Dispatcher' | 'Surgeon') => {
    setSelectedRole(role);
    setEmail(roleProfiles[role].email);
    soundEffects.playClick();
  };

  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    soundEffects.playDispatchConfirmed();
    setTimeout(() => {
      login(roleProfiles[selectedRole].user);
    }, 600);
  };

  const handleQuickLogin = (role: 'Director' | 'Dispatcher' | 'Surgeon') => {
    setSelectedRole(role);
    setEmail(roleProfiles[role].email);
    setIsLoading(true);
    soundEffects.playSuccess();
    setTimeout(() => {
      login(roleProfiles[role].user);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-between p-6 md:p-10 select-none overflow-x-hidden font-sans relative">
      {/* Subtle Topographic Terrain Background Vector */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* ========================================================================= */}
      {/* TOP BAR: Brand Header & Security Badge                                    */}
      {/* ========================================================================= */}
      <header className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
                VAHAK 3D COMMAND CENTER
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold tracking-wider uppercase">
                LIVE OPS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Intelligent Rural Healthcare Dispatch & Routing Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Authorized Personnel Only</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN CONTAINER                                                 */}
      {/* ========================================================================= */}
      <main className="w-full max-w-7xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center py-6 z-10">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: Hero Pitch, 4 Stat Cards, 2 Feature Cards, Trust Badges   */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-7">
          {/* Main Title Heading */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Decentralized Emergency<br />
              Operations with<br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                A* Routing & AI Triage
              </span>
            </h2>
            <p className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
              Powering real-time, intelligent healthcare across rural India with advanced routing, tele-consultation, and resource optimization.
            </p>
          </div>

          {/* 4 Metrics / Stat Cards (1 Row of 4) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Stat 1 */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <Home className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">50</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                Rural Villages<br />Connected
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">10</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                Trauma Hospitals<br />Network
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">50</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                Ambulances<br />On Standby
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 mb-3">
                <Plane className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">EVTOL</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                Medicine Drones<br />Delivery
              </div>
            </div>
          </div>

          {/* 2 Feature Cards (1 Row of 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className="bg-white/95 backdrop-blur-sm p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">A* Topological Mesh</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Instant reroute around landslides, flooded roads & dynamic obstacles.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/95 backdrop-blur-sm p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Gemini Clinical AI</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Specialist qualification, bed capacity locks & intelligent triage assistance.
                </p>
              </div>
            </div>
          </div>

          {/* 3 Trust Pill Badges (Horizontal Row) */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Enterprise Grade Security</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Real-time Live Operations</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI-Powered Decisions</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Pixel-Perfect White Auth Card                             */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[460px] bg-white rounded-3xl p-7 md:p-8 border border-slate-100 shadow-2xl shadow-slate-200/80 space-y-5">
            
            {/* Top Segmented Tab Switcher */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Register Operator</span>
              </button>
            </div>

            {/* SELECT COMMAND PROFILE Section */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold text-slate-500 tracking-wider uppercase">
                SELECT COMMAND PROFILE
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Director */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('Director')}
                  className={`p-3 rounded-2xl text-left transition-all relative cursor-pointer ${
                    selectedRole === 'Director'
                      ? 'border-2 border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/10'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <User className={`w-4 h-4 ${selectedRole === 'Director' ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  <div className={`text-xs font-bold ${selectedRole === 'Director' ? 'text-blue-600' : 'text-slate-800'}`}>
                    Director
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Full Access</div>

                  {selectedRole === 'Director' && (
                    <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>

                {/* Dispatcher */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('Dispatcher')}
                  className={`p-3 rounded-2xl text-left transition-all relative cursor-pointer ${
                    selectedRole === 'Dispatcher'
                      ? 'border-2 border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/10'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <Headphones className={`w-4 h-4 ${selectedRole === 'Dispatcher' ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  <div className={`text-xs font-bold ${selectedRole === 'Dispatcher' ? 'text-blue-600' : 'text-slate-800'}`}>
                    Dispatcher
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Operations</div>

                  {selectedRole === 'Dispatcher' && (
                    <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>

                {/* Surgeon */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('Surgeon')}
                  className={`p-3 rounded-2xl text-left transition-all relative cursor-pointer ${
                    selectedRole === 'Surgeon'
                      ? 'border-2 border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/10'
                      : 'border border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <Stethoscope className={`w-4 h-4 ${selectedRole === 'Surgeon' ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  <div className={`text-xs font-bold ${selectedRole === 'Surgeon' ? 'text-blue-600' : 'text-slate-800'}`}>
                    Surgeon
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Medical Access</div>

                  {selectedRole === 'Surgeon' && (
                    <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Auth Form Inputs */}
            <form onSubmit={handleAuthenticate} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-500 tracking-wider uppercase block">
                  OFFICIAL EMAIL ADDRESS
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <Check className="w-4 h-4 text-emerald-500 absolute right-3.5" />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-500 tracking-wider uppercase block">
                  SECURITY PASSCODE
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="accent-blue-600 rounded w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Remember this device</span>
                </label>
                <a href="#forgot" className="text-blue-600 font-semibold hover:underline">
                  Forgot passcode?
                </a>
              </div>

              {/* Authenticate & Enter Command Center Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isLoading ? 'AUTHENTICATING ENCLAVE...' : 'AUTHENTICATE & ENTER COMMAND CENTER'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center pt-1">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest absolute">
                OR
              </span>
            </div>

            {/* QUICK ACCESS (1-CLICK) Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase text-center">
                QUICK ACCESS (1-CLICK)
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Director')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Director</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('Dispatcher')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Dispatcher</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('Surgeon')}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Surgeon</span>
                </button>
              </div>
            </div>

            {/* End-to-End Encryption Footer */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>All communications are end-to-end encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER: Secure Portal Status & Operational Indicator               */}
      {/* ========================================================================= */}
      <footer className="w-full flex items-center justify-between text-xs text-slate-500 font-medium z-10 pt-4">
        <span>Enterprise Secure Portal</span>
        <span className="flex items-center gap-2 text-emerald-600 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>System Operational</span>
        </span>
      </footer>
    </div>
  );
};
