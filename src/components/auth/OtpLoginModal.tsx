import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  KeyRound, 
  Mail, 
  Phone, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface OtpLoginModalProps {
  onSuccess?: () => void;
  onSwitchToPassword?: () => void;
  onSwitchToFace?: () => void;
}

export const OtpLoginModal: React.FC<OtpLoginModalProps> = ({ 
  onSuccess,
  onSwitchToPassword,
  onSwitchToFace
}) => {
  const { sendOtp, otpLogin } = useAuth();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    maskedDestination: string;
    demoCode?: string;
    userName?: string;
    role?: string;
  } | null>(null);

  // Cooldown countdown timer
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async (targetId?: string) => {
    const idToUse = (targetId || identifier).trim();
    if (!idToUse) {
      setError('Please enter your registered email address or phone number.');
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting a new verification code.`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await sendOtp(idToUse);
      setSuccessInfo({
        maskedDestination: res.masked_destination,
        demoCode: res.demo_code,
        userName: res.target_user_name,
        role: res.role
      });
      if (res.demo_code) {
        // Auto-fill in demo/sandbox if convenient, but let user see and edit
        setCode(res.demo_code);
      }
      setStep('verify');
      setCooldown(30); // 30-second rate-limit cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await otpLogin(identifier.trim(), code.trim());
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAccount = (email: string) => {
    setIdentifier(email);
    setError(null);
    handleSendOtp(email);
  };

  return (
    <div className="space-y-5">
      {/* Header Info Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900">
        <div className="flex items-center gap-2 font-bold mb-1 text-blue-950">
          <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Two-Factor OTP Security Protocol</span>
        </div>
        <p className="text-blue-800 leading-relaxed">
          Access your account using a time-sensitive, single-use 6-digit OTP code dispatched to your registered email address or phone number.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {step === 'request' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Registered Email or Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. alex.trainee@capacityconnect.org or +91 99887 76655"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden transition-all"
                autoFocus
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {identifier.includes('@') ? (
                  <Mail className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter the contact information registered with your Capacity Connect profile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleSendOtp()}
            disabled={loading || !identifier.trim() || cooldown > 0}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching Security OTP...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Wait {cooldown}s to Resend</span>
              </>
            ) : (
              <>
                <span>Send One-Time Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Pre-filled Evaluation Accounts */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Quick Test Registered Accounts
              </span>
              <span className="text-[10px] text-slate-500">1-Click OTP Dispatch</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectQuickAccount('alex.trainee@capacityconnect.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-300 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-xs group-hover:text-emerald-800">Alex Rivera</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">Trainee</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono block truncate">+91 99887 76655</span>
              </button>

              <button
                type="button"
                onClick={() => selectQuickAccount('dr.sharma@capacityconnect.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/70 hover:border-indigo-300 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-800">Dr. Sharma</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded">Trainer</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono block truncate">+91 98765 43210</span>
              </button>

              <button
                type="button"
                onClick={() => selectQuickAccount('sarah.admin@capacityconnect.org')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50/70 hover:border-purple-300 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-xs group-hover:text-purple-800">Sarah Chen</span>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">Admin</span>
                </div>
                <span className="text-[10px] text-slate-600 font-mono block truncate">+91 91234 56789</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Dispatch Notice Card */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">
                Verification Code Dispatched!
              </p>
              <p className="text-emerald-800 mt-0.5">
                Sent to <span className="font-mono font-bold text-emerald-950">{successInfo?.maskedDestination}</span> for user <span className="font-bold">{successInfo?.userName}</span>.
              </p>
              {successInfo?.demoCode && (
                <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-700">Sandbox Preview OTP:</span>
                  <span className="font-mono font-bold bg-white text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 text-xs">
                    {successInfo.demoCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Enter 6-Digit OTP Code
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Valid for 5 mins
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full tracking-[0.5em] text-center text-xl font-bold py-3 border-2 border-blue-300 focus:border-blue-600 rounded-xl focus:outline-hidden bg-blue-50/30 text-blue-950 transition-all font-mono"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length < 6}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying OTP & Authorizing Session...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Complete Login</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setError(null);
              }}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Change email or phone
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => handleSendOtp()}
              className="text-blue-600 hover:text-blue-800 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Alternative verification shortcuts */}
      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
        <span>Prefer another verification method?</span>
        <div className="flex items-center gap-3">
          {onSwitchToPassword && (
            <button
              type="button"
              onClick={onSwitchToPassword}
              className="text-blue-600 hover:underline font-semibold"
            >
              Password
            </button>
          )}
          {onSwitchToFace && (
            <button
              type="button"
              onClick={onSwitchToFace}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Face Recognition
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
