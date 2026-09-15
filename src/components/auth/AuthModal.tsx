import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FastDemoLogin } from './FastDemoLogin';
import { FaceLoginModal } from './FaceLoginModal';
import { OtpLoginModal } from './OtpLoginModal';
import { RegisterWizard } from './RegisterWizard';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ThreeStepLogin } from './ThreeStepLogin';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ScanFace, 
  Phone, 
  Sparkles, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  Layers
} from 'lucide-react';

export type AuthVerificationTab = 'threestep' | 'password' | 'otp' | 'face' | 'demo' | 'register' | 'forgot';

interface AuthModalProps {
  onSuccess?: () => void;
  defaultTab?: 'login' | 'threestep' | 'password' | 'otp' | 'face' | 'demo' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, defaultTab = 'threestep' }) => {
  const { login } = useAuth();

  // Normalize defaultTab (handle legacy 'login' string)
  const initialTab: AuthVerificationTab = defaultTab === 'login' ? 'threestep' : (defaultTab as AuthVerificationTab);
  const [activeTab, setActiveTab] = useState<AuthVerificationTab>(initialTab);

  // Normal Password Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(loginEmail.trim(), loginPassword);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto liquid-glass rounded-3xl border border-slate-200/80 dark:border-white/15 shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 dark:from-slate-950 dark:via-neutral-950 dark:to-blue-950 text-white relative overflow-hidden border-b border-white/10">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 dark:bg-white/10 text-white backdrop-blur-xs">
                Portal
              </span>
              <span className="text-[10px] font-semibold text-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-300" />
                3-Factor Biometric Security
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight font-display">
              Capacity<span className="text-blue-300">Connect</span>
            </h2>
            <p className="text-xs text-blue-100/80 mt-1 max-w-md leading-relaxed">
              National Capacity Building & Skill Development Governance System
            </p>
          </div>

          {/* Quick Register / Login Toggle Pill */}
          <div className="shrink-0">
            {activeTab === 'register' ? (
              <button
                type="button"
                onClick={() => { setActiveTab('threestep'); setError(null); }}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-xs transition-colors"
              >
                ← Back to Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-700" />
                <span>Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Glow decoration */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
      </div>

      {/* Body Content Container */}
      <div className="p-6">
        {/* Main Authentication Flow */}
        {activeTab === 'threestep' && (
          <ThreeStepLogin 
            onSuccess={onSuccess} 
            onSwitchToRegister={() => setActiveTab('register')}
            onForgotPassword={() => setActiveTab('forgot')}
          />
        )}

        {/* Verification Method 1: Password Verification Fallback */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Password Verification</span>
              <p className="text-[11px] text-slate-500">
                Authenticate with your official Capacity Connect credentials and secure Supabase-persisted session.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Registered Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@capacityconnect.org"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !loginEmail || !loginPassword}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating via Supabase...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In with Password</span>
                </>
              )}
            </button>

            {/* Return to Multi-Step Login */}
            <div className="pt-3 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => { setActiveTab('threestep'); setError(null); }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                ← Return to standard login
              </button>
            </div>
          </form>
        )}

        {/* Verification Method 2: OTP Verification */}
        {activeTab === 'otp' && (
          <OtpLoginModal 
            onSuccess={onSuccess}
            onSwitchToPassword={() => setActiveTab('threestep')}
            onSwitchToFace={() => setActiveTab('threestep')}
          />
        )}

        {/* Verification Method 3: Face Recognition Verification */}
        {activeTab === 'face' && (
          <FaceLoginModal onSuccess={onSuccess} />
        )}

        {/* Fast Demo / Evaluation Option */}
        {activeTab === 'demo' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800">Evaluator & Demonstration Logins</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('threestep')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                ← Return to Login
              </button>
            </div>
            <FastDemoLogin onSuccess={onSuccess} />
          </div>
        )}

        {/* Registration with Biometric Enrollment Wizard */}
        {activeTab === 'register' && (
          <RegisterWizard 
            onSuccess={onSuccess} 
            onSwitchToLogin={() => setActiveTab('threestep')}
          />
        )}

        {/* Password Reset Modal */}
        {activeTab === 'forgot' && (
          <ForgotPasswordModal onBackToLogin={() => setActiveTab('threestep')} />
        )}
      </div>

      {/* Footer System Status Badge */}
      <div className="px-6 py-3 bg-slate-50/70 dark:bg-black/40 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-600 dark:text-slate-300">Supabase Auth & Biometric Cluster Online</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== 'demo' && (
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-bold hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Demo Accounts</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
