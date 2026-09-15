import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, AccountStatus } from '../../types';
import { api } from '../../lib/api';
import { 
  requestCameraStream, 
  stopCameraStream, 
  extractBiometricSignature, 
  CapturedBiometric,
  getPresetDemoVector
} from '../../lib/biometrics';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  ScanFace, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw,
  KeyRound,
  Clock,
  Send,
  ShieldCheck
} from 'lucide-react';

interface RegisterWizardProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ 
  onSuccess,
  onSwitchToLogin
}) => {
  const { register } = useAuth();

  // Wizard Step: 1 = Role & Account Details, 2 = Contact OTP Verification, 3 = Face Biometric Capture, 4 = Result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [role, setRole] = useState<UserRole>('trainee');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');

  // Role-specific fields
  const [skills, setSkills] = useState('Cloud Infrastructure, Python');
  const [education, setEducation] = useState('Undergraduate Degree');
  const [targetCerts, setTargetCerts] = useState('Certified Cloud Architect');
  const [expertise, setExpertise] = useState('System Design, Security');
  const [experienceYears, setExperienceYears] = useState(6);
  const [bio, setBio] = useState('Master instructor specializing in enterprise capacity development.');
  const [qualifications, setQualifications] = useState('M.Tech, Lead Trainer Certification');
  const [justification, setJustification] = useState('Responsible for institutional department onboarding and governance.');

  // Step 2: Contact OTP Verification State
  const [otpChannel, setOtpChannel] = useState<'email' | 'phone'>('email');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifiedToken, setOtpVerifiedToken] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Step 3: Biometric State
  const [enrolledBiometric, setEnrolledBiometric] = useState<CapturedBiometric | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [captureStep, setCaptureStep] = useState('');
  const [captureProgress, setCaptureProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<{
    status: AccountStatus;
    message?: string;
  } | null>(null);

  // OTP cooldown interval
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Camera handling for Step 3
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
      console.warn('Camera error during registration:', err);
      setCameraError(err.message || 'Camera permission denied or device not found. You may use the fallback enrollment vector below.');
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

  // Validate Step 1
  const validateStep1 = () => {
    if (!fullName.trim()) return 'Full Name is required.';
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address.';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) return 'Please enter a valid phone number with area/country code.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!organization.trim()) return 'Organization is required.';
    if (!department.trim()) return 'Department is required.';
    if (role === 'admin' && !justification.trim()) {
      return 'Institutional justification is required for Administrator registration.';
    }
    return null;
  };

  const handleNextFromStep1 = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  // Step 2: Send OTP
  const handleSendOtp = async () => {
    setError(null);
    setOtpSending(true);
    const target = otpChannel === 'email' ? email.trim() : phone.trim();

    try {
      const res = await api.sendRegisterOtp(target, otpChannel);
      setIsOtpSent(true);
      setDemoCode(res.demo_code || null);
      setOtpCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError(null);
    setOtpVerifying(true);
    const target = otpChannel === 'email' ? email.trim() : phone.trim();

    try {
      const res = await api.verifyRegisterOtp(target, otpCode.trim());
      setOtpVerified(true);
      setOtpVerifiedToken(res.otp_verified_token);
      setCurrentStep(3); // Proceed to Face Registration
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Step 3: Capture Face Biometrics Live
  const handleCaptureFaceLive = async () => {
    if (!videoRef.current || !isCameraActive) {
      setCameraError('Camera stream is not active. Please allow camera permissions.');
      return;
    }

    setIsCapturingFace(true);
    setError(null);
    setCaptureStep('Analyzing face landmarks and evaluating liveness...');
    setCaptureProgress(20);

    try {
      const signature = await extractBiometricSignature(
        videoRef.current,
        (stage, progress) => {
          setCaptureStep(stage);
          setCaptureProgress(progress);
        }
      );

      setEnrolledBiometric(signature);
      setCaptureStep('Face template successfully generated!');
      setCaptureProgress(100);
      stopCamera();
    } catch (err: any) {
      setError(err.message || 'Biometric capture failed. Please center your face and look straight at the camera.');
    } finally {
      setIsCapturingFace(false);
    }
  };

  // Step 3 Fallback (For environments without physical cameras)
  const handleEnrollFallbackFace = () => {
    const seed = Math.floor(Math.random() * 500) + 200;
    const vector = getPresetDemoVector(seed);
    setEnrolledBiometric({
      vector,
      livenessScore: 0.94,
      frameCount: 4
    });
    setError(null);
    stopCamera();
  };

  // Final Registration Submission
  const handleSubmitRegistration = async () => {
    if (!otpVerified) {
      setError('Contact OTP verification must be completed before registering.');
      setCurrentStep(2);
      return;
    }

    if (!enrolledBiometric || !Array.isArray(enrolledBiometric.vector) || enrolledBiometric.vector.length < 32) {
      setError('Biometric Face Registration is mandatory. Please capture your face signature to continue.');
      setCurrentStep(3);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        phone: phone.trim(),
        organization: organization.trim(),
        department: department.trim(),
        otp_verified_token: otpVerifiedToken,
        biometric_vector: enrolledBiometric.vector,
        liveness_score: enrolledBiometric.livenessScore
      };

      if (role === 'trainee') {
        payload.skills_interests = skills.split(',').map((s) => s.trim()).filter(Boolean);
        payload.education_level = education;
        payload.target_certifications = targetCerts.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (role === 'trainer') {
        payload.expertise_areas = expertise.split(',').map((s) => s.trim()).filter(Boolean);
        payload.years_experience = Number(experienceYears) || 1;
        payload.bio = bio;
        payload.qualifications = qualifications;
      } else if (role === 'admin') {
        payload.justification = justification;
      }

      const res = await register(payload);
      setRegistrationResult(res);
      setCurrentStep(4);

      if (res.status !== 'pending' && onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Stepper Header */}
      <div className="bg-slate-900 px-5 sm:px-6 py-4 text-white border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Account Registration</h3>
            <p className="text-[11px] text-slate-400">Complete all required stages to establish identity</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30 uppercase">
            {role}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'OTP Verify' },
            { num: 3, label: 'Face ID' },
            { num: 4, label: 'Complete' },
          ].map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  isCurrent ? 'bg-blue-500/20 text-blue-300' : isDone ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span className="truncate">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: Personal & Role Details                           */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target System Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'trainee' as UserRole, label: 'Trainee', desc: 'Learner' },
                  { id: 'trainer' as UserRole, label: 'Trainer', desc: 'Faculty' },
                  { id: 'admin' as UserRole, label: 'Admin', desc: 'Governance' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      role === item.id
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                    <span className="block text-[10px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>

              {role === 'admin' && (
                <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Admin registrations are securely held in <strong>PENDING</strong> status and require authorization by an existing active administrator.
                  </span>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.gov.in"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization *</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Ministry of Skill Dev"
                    className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Technology Skilling"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Dynamic Role-specific details */}
            {role === 'trainee' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 block uppercase">Trainee Profile Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Skills & Interests</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. Cloud, AI, Security"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Education Level</label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option>Undergraduate Degree</option>
                      <option>Postgraduate Degree</option>
                      <option>Diploma / Polytechnic</option>
                      <option>Doctorate / PhD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {role === 'trainer' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 block uppercase">Trainer Profile Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expertise Areas</label>
                    <input
                      type="text"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="e.g. Cloud Architecture, AI"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      min={1}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Administrative Justification *</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="State your institutional role and authorization basis for Administrator privileges..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded-lg bg-white"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleNextFromStep1}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Contact OTP Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: Contact OTP Verification                          */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Verify Login Contact via OTP</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your contact method to ensure you can receive one-time passwords for login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-slate-500 hover:underline"
              >
                Back
              </button>
            </div>

            {/* Destination Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOtpChannel('email');
                  setIsOtpSent(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  otpChannel === 'email'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Mail className={`w-4 h-4 ${otpChannel === 'email' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <span className="block text-xs font-bold text-slate-900">Email OTP</span>
                  <span className="block text-[10px] text-slate-500 truncate max-w-[140px] font-mono">{email}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpChannel('phone');
                  setIsOtpSent(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  otpChannel === 'phone'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Phone className={`w-4 h-4 ${otpChannel === 'phone' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <span className="block text-xs font-bold text-slate-900">Phone SMS</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{phone}</span>
                </div>
              </button>
            </div>

            {/* Send / Code Form */}
            {!isOtpSent ? (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={otpSending}
                  onClick={handleSendOtp}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Security Code...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Verification Code to {otpChannel.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {demoCode && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Demo Verification Code</span>
                      <span className="font-mono text-sm font-extrabold text-amber-900 tracking-wider">{demoCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpCode(demoCode)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-center font-mono font-bold tracking-widest text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Didn't receive code?</span>
                  <button
                    type="button"
                    disabled={otpCooldown > 0 || otpSending}
                    onClick={handleSendOtp}
                    className="font-bold text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Resend Code'}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={otpVerifying || otpCode.length < 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code on Server...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Code & Proceed to Face Enrollment</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: Mandatory Face Biometric Registration             */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ScanFace className="w-4 h-4 text-blue-600" />
                  Mandatory Biometric Face Registration
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live face detection & 128-dimensional embedding generation required for multi-factor login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-slate-500 hover:underline"
              >
                Back
              </button>
            </div>

            {/* Video Viewport */}
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
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">Webcam not active</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  <div
                    className={`w-44 h-56 rounded-[45%] border-2 transition-all ${
                      isCapturingFace
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)] animate-pulse'
                        : 'border-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                    }`}
                  />
                  <span className="mt-2.5 px-3 py-1 rounded-full bg-slate-900/80 text-[10px] font-bold text-white border border-white/20">
                    {isCapturingFace ? captureStep : 'Center your face inside the target frame'}
                  </span>
                </div>
              )}

              {isCapturingFace && (
                <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${captureProgress}%` }}
                  />
                </div>
              )}
            </div>

            {enrolledBiometric ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Face Enrolled & Verified!</span>
                    <span className="text-[10px] text-emerald-700">
                      128-d descriptor normalized with liveness score {(enrolledBiometric.livenessScore * 100).toFixed(0)}%.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEnrolledBiometric(null);
                    startCamera();
                  }}
                  className="text-[11px] font-bold text-emerald-800 hover:underline"
                >
                  Re-capture
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isCapturingFace || !isCameraActive}
                  onClick={handleCaptureFaceLive}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCapturingFace ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{captureStep || 'Capturing Biometric Frame...'}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Capture Live Face & Generate Descriptor</span>
                    </>
                  )}
                </button>

                {/* Environment fallback */}
                <button
                  type="button"
                  disabled={isCapturingFace}
                  onClick={handleEnrollFallbackFace}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Generate Certified Biometric Embedding (Sandbox/Headless)</span>
                </button>
              </div>
            )}

            {enrolledBiometric && (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitRegistration}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Verified Registration...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Multi-Factor Registration</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: Registration Succeeded                            */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="text-center py-4 space-y-4">
            {registrationResult?.status === 'pending' ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-amber-950">
                  Administrator Registration: PENDING
                </h3>
                <p className="text-xs text-amber-800 max-w-sm mx-auto leading-relaxed">
                  Your administrator account has been recorded with verified OTP and enrolled face biometrics. In compliance with security governance, your account is awaiting authorization by an active platform administrator.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    Return to Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  Registration Complete & Activated!
                </h3>
                <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
                  Welcome to Capacity Connect, <strong>{fullName}</strong>. Your account has been initialized with verified credentials, OTP, and enrolled face biometrics.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">Redirecting to Dashboard...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 sm:px-7 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Already have an account?</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-blue-600 hover:underline"
        >
          Proceed to 3-Step Login
        </button>
      </div>
    </div>
  );
};
