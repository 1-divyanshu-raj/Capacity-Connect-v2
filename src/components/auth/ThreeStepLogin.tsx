import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { api } from '../../lib/api';
import { 
  requestCameraStream, 
  stopCameraStream, 
  extractBiometricSignature,
  getPresetDemoVector 
} from '../../lib/biometrics';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ScanFace, 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Camera, 
  Sparkles,
  Shield,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  Clock,
  Send
} from 'lucide-react';

interface ThreeStepLoginProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

const DEMO_PRESETS: Record<UserRole, { email: string; pass: string; name: string; seed: number; desc: string }> = {
  trainee: {
    email: 'alex.trainee@capacityconnect.org',
    pass: 'TraineeSecure2026!',
    name: 'Alex Rivera',
    seed: 42,
    desc: 'Candidate / Skill Development Learner'
  },
  trainer: {
    email: 'dr.sharma@capacityconnect.org',
    pass: 'TrainerSecure2026!',
    name: 'Dr. Priya Sharma',
    seed: 77,
    desc: 'Certified Master Faculty & Course Creator'
  },
  admin: {
    email: 'sarah.admin@capacityconnect.org',
    pass: 'AdminMaster2026!',
    name: 'Sarah Chen',
    seed: 101,
    desc: 'Institutional Capacity Building Administrator'
  }
};

export const ThreeStepLogin: React.FC<ThreeStepLoginProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword
}) => {
  const { setSession } = useAuth();

  // Stage: 0 = Role Selection, 1 = Email+Password, 2 = OTP, 3 = Face Biometrics, 4 = Success
  // Default to Step 1 directly so user sees credentials inputs immediately
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainee');

  // Step 1 State: MUST be empty on page load; never pre-fill credentials by default
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  // Step 2 State (OTP)
  const [otpCode, setOtpCode] = useState('');
  const [activeChannel, setActiveChannel] = useState<'email' | 'phone'>('email');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(300);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Step 3 State (Face Biometrics)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [faceCaptureProgress, setFaceCaptureProgress] = useState(0);
  const [faceCaptureStage, setFaceCaptureStage] = useState('');
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);

  // General Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUserInfo, setCurrentUserInfo] = useState<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    has_biometrics: boolean;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // When changing role, maintain empty fields so user enters their own credentials
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError(null);
    setCurrentStep(1);
  };


  // Cooldown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Camera management for Step 3
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await requestCameraStream();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream request failed:', err);
      setCameraError(err.message || 'Unable to access live webcam. You may use the Verified Biometric Template simulation below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (currentStep === 3) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [currentStep]);

  // ==========================================
  // STEP 1: Verify Role + Email + Password
  // ==========================================
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.loginStep1(email.trim(), password, selectedRole);
      setChallengeToken(res.challenge_token);
      setCurrentUserInfo(res.user);
      setMaskedEmail(res.masked_email);
      setMaskedPhone(res.masked_phone);
      setActiveChannel(res.active_channel || 'email');
      setDemoOtpCode(res.demo_code || null);
      setOtpExpiresIn(res.expires_in_seconds || 300);
      setResendCooldown(30);
      setSuccessMessage('Step 1 verified: Credentials and target role authenticated.');
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async (channel: 'email' | 'phone') => {
    if (!challengeToken || resendCooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.resendLoginOtp(challengeToken, channel);
      setActiveChannel(channel);
      setDemoOtpCode(res.demo_code || null);
      setOtpExpiresIn(res.expires_in_seconds || 300);
      setResendCooldown(30);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to re-dispatch OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 2: Verify Single-Use OTP Code
  // ==========================================
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) {
      setError('Session expired. Please restart login from Step 1.');
      setCurrentStep(1);
      return;
    }

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.loginStep2(challengeToken, otpCode.trim());
      // Advance to step 2 completed challenge token
      setChallengeToken(res.challenge_token);
      setCurrentUserInfo(res.user);
      setSuccessMessage('Step 2 verified: Multi-factor OTP confirmed.');
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 3: Verify Live Face Biometric Descriptor
  // ==========================================
  const handleFaceVerifyLive = async () => {
    if (!challengeToken) {
      setError('Challenge session expired. Please restart login.');
      setCurrentStep(1);
      return;
    }

    if (!videoRef.current || !isCameraActive) {
      setCameraError('Camera is not active. Please allow camera permissions or use the template fallback.');
      return;
    }

    setIsCapturingFace(true);
    setError(null);
    setFaceCaptureStage('Detecting facial landmark geometry...');
    setFaceCaptureProgress(25);

    try {
      const signature = await extractBiometricSignature(
        videoRef.current,
        (stage, progress) => {
          setFaceCaptureStage(stage);
          setFaceCaptureProgress(progress);
        }
      );

      setFaceCaptureStage('Transmitting descriptor for server-side cosine matching...');
      setFaceCaptureProgress(90);

      const session = await api.loginStep3(
        challengeToken,
        signature.vector,
        signature.livenessScore,
        signature.frameCount
      );

      setSimilarityScore(session.similarity);
      setSuccessMessage(session.message || 'All 3 verification factors validated successfully!');
      setCurrentStep(4);

      // Establish authenticated session in context
      setSession(session);
      stopCamera();

      if (onSuccess) {
        setTimeout(onSuccess, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Biometric verification failed. Face did not match enrolled signature.');
    } finally {
      setIsCapturingFace(false);
    }
  };

  // Fast/Fallback Verification using Enrolled Template (for demo & headless environments)
  const handleFaceVerifyWithPreset = async () => {
    if (!challengeToken) {
      setError('Challenge session expired. Please restart login.');
      setCurrentStep(1);
      return;
    }

    setIsCapturingFace(true);
    setError(null);
    setFaceCaptureStage('Loading enrolled identity template vector...');
    setFaceCaptureProgress(40);

    try {
      const preset = DEMO_PRESETS[selectedRole];
      const vector = getPresetDemoVector(preset.seed);

      setFaceCaptureStage('Executing server-side cosine similarity check...');
      setFaceCaptureProgress(85);

      const session = await api.loginStep3(challengeToken, vector, 0.92, 4);

      setSimilarityScore(session.similarity);
      setSuccessMessage(session.message || 'All 3 verification factors validated successfully!');
      setCurrentStep(4);

      setSession(session);
      stopCamera();

      if (onSuccess) {
        setTimeout(onSuccess, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Face verification failed.');
    } finally {
      setIsCapturingFace(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
      {/* Header & Step Progression Breadcrumbs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                3-Step Verification Login
              </h2>
              <p className="text-[11px] text-blue-200/70">
                Mandatory Multi-Factor & Biometric Security
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-blue-300 border border-white/15 uppercase tracking-wide">
            {selectedRole}
          </span>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
          {[
            { num: 0, title: 'Role', sub: 'Access Level' },
            { num: 1, title: 'Credentials', sub: 'Step 1' },
            { num: 2, title: 'OTP Code', sub: 'Step 2' },
            { num: 3, title: 'Face ID', sub: 'Step 3' },
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center text-center p-1.5 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-blue-500/20 border border-blue-400/30'
                    : isCompleted
                    ? 'bg-emerald-500/10'
                    : 'opacity-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {isCompleted ? '✓' : s.num === 0 ? 'R' : s.num}
                </div>
                <span className="text-[11px] font-semibold text-white truncate max-w-full">
                  {s.title}
                </span>
                <span className="text-[9px] text-slate-300 hidden sm:inline">
                  {s.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && !error && currentStep !== 4 && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 0: Role Selection                               */}
        {/* ==================================================== */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Select Your System Role
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each role enforces isolated authorization policies and permission controls.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  role: 'trainee' as UserRole,
                  title: 'Trainee',
                  icon: GraduationCap,
                  color: 'blue',
                  desc: 'Learners enrolled in courses, taking assessments, and earning verified credentials.'
                },
                {
                  role: 'trainer' as UserRole,
                  title: 'Trainer',
                  icon: Briefcase,
                  color: 'indigo',
                  desc: 'Faculty creating courses, conducting training, and tracking participant outcomes.'
                },
                {
                  role: 'admin' as UserRole,
                  title: 'Admin',
                  icon: ShieldCheck,
                  color: 'purple',
                  desc: 'System governance, user approvals, audit logging, and institutional reporting.'
                }
              ].map((item) => {
                const isSelected = selectedRole === item.role;
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleSelectRole(item.role)}
                    className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between group hover:border-blue-500 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-600">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need an account?</span>
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
              >
                Register with Biometrics
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 1: Email + Password                             */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Step 1 — Email & Password
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your registered credentials to authenticate your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Role Overview
                </button>
              </div>

              {/* Quick Role Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                {(['trainee', 'trainer', 'admin'] as UserRole[]).map((r) => {
                  const isSelected = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r);
                        setEmail('');
                        setPassword('');
                        setError(null);
                      }}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold capitalize transition-all ${
                        isSelected
                          ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo Credentials Autofill Helper */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Demonstration Account ({DEMO_PRESETS[selectedRole].name})
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Preset: <span className="font-mono text-slate-600">{DEMO_PRESETS[selectedRole].email}</span>
                </p>
              </div>
              <button
                type="button"
                id="btn-autofill-credentials"
                onClick={() => {
                  const p = DEMO_PRESETS[selectedRole];
                  setEmail(p.email);
                  setPassword(p.pass);
                }}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>AutoFill Credentials</span>
              </button>
            </div>


            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.gov.in"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Password
                </label>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Credentials & Role...
                </>
              ) : (
                <>
                  Verify Step 1 & Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================== */}
        {/* STEP 2: OTP Verification                             */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Step 2 — OTP Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter the 6-digit security code dispatched to your verified contact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Back to Step 1
              </button>
            </div>

            {/* Destination Pill & Channel Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  {activeChannel === 'email' ? (
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  Dispatched to {activeChannel.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-800">
                  {activeChannel === 'email' ? maskedEmail : maskedPhone}
                </span>
              </div>

              {/* Toggle Email vs Phone */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                <span className="text-[11px] text-slate-500">Switch channel:</span>
                <button
                  type="button"
                  disabled={loading || activeChannel === 'email'}
                  onClick={() => handleResendOtp('email')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    activeChannel === 'email'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  disabled={loading || activeChannel === 'phone' || !maskedPhone}
                  onClick={() => handleResendOtp('phone')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    activeChannel === 'phone'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Phone SMS
                </button>
              </div>
            </div>

            {/* Demo Sandbox Auto-Code Helper */}
            {demoOtpCode && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Sandbox Demo Verification Code
                  </span>
                  <span className="font-mono text-base font-extrabold text-amber-900 tracking-widest">
                    {demoOtpCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtpCode)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                >
                  Use Code
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                6-Digit Security Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base tracking-widest font-mono text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expires in ~{Math.ceil(otpExpiresIn / 60)} min
              </span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleResendOtp(activeChannel)}
                className="font-bold text-blue-600 hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying OTP Code...
                </>
              ) : (
                <>
                  Verify Step 2 & Proceed to Face ID
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================== */}
        {/* STEP 3: Face Biometrics Verification                 */}
        {/* ==================================================== */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ScanFace className="w-4 h-4 text-blue-600" />
                  Step 3 — Biometric Face Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm identity match against enrolled biometric template for{' '}
                  <strong className="text-slate-800">{currentUserInfo?.full_name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Back to OTP
              </button>
            </div>

            {/* Video Viewport & Scanning Overlay */}
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isCameraActive ? 'block' : 'hidden'
                }`}
              />

              {!isCameraActive && (
                <div className="text-center p-6 text-slate-400">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Webcam not active</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    Enable Camera
                  </button>
                </div>
              )}

              {/* Targeting Oval & Guide Frame */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div
                    className={`w-48 h-60 rounded-[45%] border-2 transition-all ${
                      isCapturingFace
                        ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.6)] animate-pulse'
                        : 'border-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                    }`}
                  />
                  <span className="mt-3 px-3 py-1 rounded-full bg-slate-900/80 text-[11px] font-bold text-white backdrop-blur-xs border border-white/20">
                    {isCapturingFace ? faceCaptureStage : 'Center your face within the frame'}
                  </span>
                </div>
              )}

              {/* Capture Progress Bar */}
              {isCapturingFace && (
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${faceCaptureProgress}%` }}
                  />
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <p className="font-semibold mb-1">Camera Notice:</p>
                <p className="text-[11px] leading-relaxed">{cameraError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isCapturingFace || !isCameraActive}
                onClick={handleFaceVerifyLive}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCapturingFace ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {faceCaptureStage || 'Analyzing Biometric Signature...'}
                  </>
                ) : (
                  <>
                    <ScanFace className="w-4 h-4" />
                    Capture Face & Complete Multi-Factor Login
                  </>
                )}
              </button>

              {/* Template Verification Fallback */}
              <button
                type="button"
                disabled={isCapturingFace}
                onClick={handleFaceVerifyWithPreset}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Authenticate with Registered Biometric Template
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: Login Verified & Successful                  */}
        {/* ==================================================== */}
        {currentStep === 4 && (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                3-Factor Authentication Succeeded!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Email/Password, Single-Use OTP, and Biometric Face signature have all been verified by the server.
              </p>
              {similarityScore !== null && (
                <div className="inline-block mt-3 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  Biometric Cosine Match: {(similarityScore * 100).toFixed(1)}%
                </div>
              )}
            </div>

            <div className="pt-3">
              <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                Redirecting to your {selectedRole.toUpperCase()} dashboard...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Helper Switch */}
      <div className="px-5 sm:px-7 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Capacity Connect 2026</span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-blue-600 hover:underline"
        >
          New user? Register now
        </button>
      </div>
    </div>
  );
};
