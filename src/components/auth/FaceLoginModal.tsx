import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  requestCameraStream, 
  stopCameraStream, 
  extractBiometricSignature,
  getPresetDemoVector,
  CapturedBiometric
} from '../../lib/biometrics';
import { 
  ScanFace, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Sparkles, 
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Link as LinkIcon,
  ChevronRight,
  Info
} from 'lucide-react';

interface FaceLoginModalProps {
  onSuccess?: () => void;
}

export const FaceLoginModal: React.FC<FaceLoginModalProps> = ({ onSuccess }) => {
  const { faceLogin, linkFace } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'verify' | 'enroll'>('verify');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [scanProgress, setScanProgress] = useState(0);
  const [targetEmail, setTargetEmail] = useState('');
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string; similarity?: number } | null>(null);
  const [unmatchedCapture, setUnmatchedCapture] = useState<CapturedBiometric | null>(null);
  const [linkingLoading, setLinkingLoading] = useState<string | null>(null);

  // Enroll mode state
  const [enrollAccount, setEnrollAccount] = useState('alex.trainee@capacityconnect.org');
  const [customEnrollPassword, setCustomEnrollPassword] = useState('');

  // Initialize camera
  const startCamera = async () => {
    setCameraError(null);
    setResultMessage(null);
    try {
      const stream = await requestCameraStream();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check camera permissions or use the Instant Biometric buttons below.');
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
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Perform real capture & verification
  const handleScanAndVerify = async () => {
    if (!videoRef.current || !isCameraActive) {
      setCameraError('Camera stream is not active. Please enable camera.');
      return;
    }

    setIsScanning(true);
    setResultMessage(null);
    setUnmatchedCapture(null);
    setScanStep('Detecting face position & lighting...');
    setScanProgress(15);

    let currentSig: any = null;
    try {
      const signature = await extractBiometricSignature(
        videoRef.current,
        (stage, progress) => {
          setScanStep(stage);
          setScanProgress(progress);
        }
      );
      currentSig = signature;

      setScanStep('Matching 128-d descriptor against enrolled biometric database...');
      setScanProgress(90);

      const res = await faceLogin(
        signature.vector,
        signature.livenessScore,
        targetEmail.trim() || undefined
      );

      setScanProgress(100);
      setResultMessage({
        success: true,
        text: `Identity verified! Welcome back, ${res.user.full_name}. Match confidence: ${(res.similarity * 100).toFixed(1)}%`,
        similarity: res.similarity
      });

      setTimeout(() => {
        stopCamera();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      console.error('Face verification failed:', err);
      
      // Keep captured signature so user can immediately link it if desired
      if (currentSig) {
        setUnmatchedCapture(currentSig);
      } else {
        try {
          if (videoRef.current) {
            const quickSig = await extractBiometricSignature(videoRef.current);
            setUnmatchedCapture(quickSig);
          }
        } catch {
          // ignore fallback signature capture
        }
      }

      setResultMessage({
        success: false,
        text: err.message || 'Biometric verification failed. No enrolled identity matched the camera signature.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Link captured camera signature directly to an account
  const handleLinkCameraCapture = async (email: string) => {
    setLinkingLoading(email);
    setResultMessage(null);
    try {
      let sig = unmatchedCapture;
      if (!sig && videoRef.current && isCameraActive) {
        sig = await extractBiometricSignature(videoRef.current);
      }

      if (!sig) {
        throw new Error('No camera signature captured. Please ensure your camera is enabled.');
      }

      const res = await linkFace(email, sig.vector, sig.livenessScore);

      setResultMessage({
        success: true,
        text: `Camera face enrolled & authenticated as ${res.user.full_name}! Your face is now registered for future logins.`
      });

      setTimeout(() => {
        stopCamera();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      setResultMessage({
        success: false,
        text: err.message || 'Failed to link face biometric to account.'
      });
    } finally {
      setLinkingLoading(null);
    }
  };

  // Perform enrollment of current camera stream
  const handleDirectEnrollment = async () => {
    if (!videoRef.current || !isCameraActive) {
      setCameraError('Camera stream is not active.');
      return;
    }

    setIsScanning(true);
    setResultMessage(null);
    setScanStep('Capturing multi-frame biometric template for enrollment...');
    setScanProgress(25);

    try {
      const sig = await extractBiometricSignature(
        videoRef.current,
        (stage, progress) => {
          setScanStep(stage);
          setScanProgress(progress);
        }
      );

      setScanStep('Registering biometric vector to account...');
      setScanProgress(90);

      const res = await linkFace(
        enrollAccount,
        sig.vector,
        sig.livenessScore,
        customEnrollPassword || undefined
      );

      setScanProgress(100);
      setResultMessage({
        success: true,
        text: `Success! Enrolled camera face for ${res.user.full_name}. Logged in successfully!`
      });

      setTimeout(() => {
        stopCamera();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setResultMessage({
        success: false,
        text: err.message || 'Failed to enroll face biometric.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Preset quick verification for testing enrolled accounts directly
  const handleQuickPresetMatch = async (seed: number, userEmail: string, userName: string) => {
    setResultMessage(null);
    setUnmatchedCapture(null);
    setIsScanning(true);
    setScanStep(`Verifying pre-enrolled biometric template for ${userName}...`);
    setScanProgress(70);

    try {
      const vector = getPresetDemoVector(seed);
      const res = await faceLogin(vector, 0.95, userEmail);

      setScanProgress(100);
      setResultMessage({
        success: true,
        text: `Identity verified! Authenticated as ${userName}. Match: ${(res.similarity * 100).toFixed(1)}%`,
        similarity: res.similarity
      });

      setTimeout(() => {
        stopCamera();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      setResultMessage({
        success: false,
        text: err.message || 'Verification failed.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notice & Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-xl text-slate-600 text-xs flex items-start gap-2.5">
        <ScanFace className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Biometric Facial Recognition:</span> Multi-frame liveness verification generates a 128-d spatial descriptor. The template is compared on the server via cosine distance without saving raw photos. <em>Non-bank/government demo grade.</em>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setMode('verify'); setResultMessage(null); }}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mode === 'verify' 
              ? 'bg-white text-blue-700 shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ScanFace className="w-3.5 h-3.5" />
          <span>Verify Face (Login)</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('enroll'); setResultMessage(null); }}
          className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mode === 'enroll' 
              ? 'bg-white text-indigo-700 shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Enroll / Link Camera Face</span>
        </button>
      </div>

      {mode === 'verify' ? (
        <>
          {/* Target Email (Optional for 1:1 match) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Registered Email (Optional - speeds up 1:1 matching)
              </label>
              {targetEmail && (
                <button
                  type="button"
                  onClick={() => setTargetEmail('')}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Clear (Scan All)
                </button>
              )}
            </div>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="e.g. alex.trainee@capacityconnect.org (or leave blank to scan all enrolled)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setTargetEmail('alex.trainee@capacityconnect.org')}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  targetEmail === 'alex.trainee@capacityconnect.org'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Alex (Trainee)
              </button>
              <button
                type="button"
                onClick={() => setTargetEmail('dr.sharma@capacityconnect.org')}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  targetEmail === 'dr.sharma@capacityconnect.org'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dr. Sharma (Trainer)
              </button>
              <button
                type="button"
                onClick={() => setTargetEmail('sarah.admin@capacityconnect.org')}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  targetEmail === 'sarah.admin@capacityconnect.org'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sarah (Admin)
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Enroll Mode Target Account Selection */
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Select Account to Link Your Camera Face To:
          </label>
          <select
            value={enrollAccount}
            onChange={(e) => setEnrollAccount(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
          >
            <option value="alex.trainee@capacityconnect.org">Alex Rivera (Trainee - alex.trainee@capacityconnect.org)</option>
            <option value="dr.sharma@capacityconnect.org">Dr. Rajesh Sharma (Trainer - dr.sharma@capacityconnect.org)</option>
            <option value="sarah.admin@capacityconnect.org">Sarah Chen (Admin - sarah.admin@capacityconnect.org)</option>
          </select>
          <p className="text-[11px] text-slate-500">
            Position your face in the oval below and click Capture to enroll your live camera as the primary biometric template for this user.
          </p>
        </div>
      )}

      {/* Camera Live Viewport */}
      <div className="relative w-full aspect-4/3 max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner flex items-center justify-center">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            {/* Overlay target frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-48 h-56 border-2 rounded-[40px] relative shadow-lg transition-colors ${
                mode === 'enroll' ? 'border-indigo-400/90' : 'border-blue-400/80'
              }`}>
                <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg ${mode === 'enroll' ? 'border-indigo-500' : 'border-blue-500'}`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg ${mode === 'enroll' ? 'border-indigo-500' : 'border-blue-500'}`} />
                <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg ${mode === 'enroll' ? 'border-indigo-500' : 'border-blue-500'}`} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 rounded-br-lg ${mode === 'enroll' ? 'border-indigo-500' : 'border-blue-500'}`} />
                {isScanning && (
                  <div className={`w-full h-0.5 absolute top-0 animate-bounce shadow-md ${mode === 'enroll' ? 'bg-indigo-400 shadow-indigo-400/50' : 'bg-blue-400 shadow-blue-400/50'}`} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-slate-400 space-y-3">
            <Camera className="w-10 h-10 mx-auto text-slate-500" />
            <p className="text-xs text-slate-300">
              {cameraError || 'Camera feed is inactive.'}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Enable Camera
            </button>
          </div>
        )}

        {/* Progress bar inside video frame when scanning */}
        {isScanning && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs p-3 text-center">
            <p className="text-xs font-medium text-white mb-1.5">{scanStep}</p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${mode === 'enroll' ? 'bg-indigo-500' : 'bg-blue-500'}`}
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Result feedback */}
      {resultMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            resultMessage.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : (resultMessage.text || '').toLowerCase().includes('not enrolled')
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {resultMessage.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (resultMessage.text || '').toLowerCase().includes('not enrolled') ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            {(resultMessage.text || '').toLowerCase().includes('not enrolled') && (
              <span className="inline-block font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 mb-1">
                Face Recognition not enrolled
              </span>
            )}
            <p className="font-semibold leading-relaxed">{resultMessage.text}</p>
          </div>
        </div>
      )}

      {/* Smart Quick-Link helper card when no face was matched */}
      {resultMessage && !resultMessage.success && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
            <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Link Your Camera Face Instantly</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Your live camera hasn't been enrolled yet. Click below to immediately link your camera face to an account for instant 1-click Face Login:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              disabled={!!linkingLoading || isScanning}
              onClick={() => handleLinkCameraCapture('alex.trainee@capacityconnect.org')}
              className="p-2 rounded-lg bg-white border border-blue-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all shadow-2xs"
            >
              {linkingLoading === 'alex.trainee@capacityconnect.org' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <>
                  <span className="font-bold text-slate-800 block text-[11px]">Alex Rivera</span>
                  <span className="text-[10px] text-emerald-700">Link as Trainee</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!!linkingLoading || isScanning}
              onClick={() => handleLinkCameraCapture('dr.sharma@capacityconnect.org')}
              className="p-2 rounded-lg bg-white border border-blue-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all shadow-2xs"
            >
              {linkingLoading === 'dr.sharma@capacityconnect.org' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <>
                  <span className="font-bold text-slate-800 block text-[11px]">Dr. Rajesh Sharma</span>
                  <span className="text-[10px] text-indigo-700">Link as Trainer</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!!linkingLoading || isScanning}
              onClick={() => handleLinkCameraCapture('sarah.admin@capacityconnect.org')}
              className="p-2 rounded-lg bg-white border border-blue-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all shadow-2xs"
            >
              {linkingLoading === 'sarah.admin@capacityconnect.org' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              ) : (
                <>
                  <span className="font-bold text-slate-800 block text-[11px]">Sarah Chen</span>
                  <span className="text-[10px] text-amber-700">Link as Admin</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-1">
        {mode === 'verify' ? (
          <button
            type="button"
            onClick={handleScanAndVerify}
            disabled={isScanning || !isCameraActive}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying Biometrics...
              </>
            ) : (
              <>
                <ScanFace className="w-4 h-4" />
                Capture Face & Authenticate
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDirectEnrollment}
            disabled={isScanning || !isCameraActive}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enrolling Facial Biometrics...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Capture & Enroll Face to Selected Account
              </>
            )}
          </button>
        )}
      </div>

      {/* Instant Test Buttons for Enrolled Identities */}
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-slate-600">
            Instant Enrolled Biometric Verification (1-Click):
          </p>
          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            100% Pre-Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isScanning}
            onClick={() => handleQuickPresetMatch(42, 'alex.trainee@capacityconnect.org', 'Alex Rivera (Trainee)')}
            className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs transition-all group"
          >
            <span className="font-bold text-slate-800 block text-xs group-hover:text-emerald-700">
              Alex Rivera
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Trainee Biometric</span>
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => handleQuickPresetMatch(77, 'dr.sharma@capacityconnect.org', 'Dr. Rajesh Sharma (Trainer)')}
            className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-xs transition-all group"
          >
            <span className="font-bold text-slate-800 block text-xs group-hover:text-indigo-700">
              Dr. Rajesh Sharma
            </span>
            <span className="text-[10px] text-indigo-700 font-medium">Trainer Biometric</span>
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => handleQuickPresetMatch(101, 'sarah.admin@capacityconnect.org', 'Sarah Chen (Admin)')}
            className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-xs transition-all group"
          >
            <span className="font-bold text-slate-800 block text-xs group-hover:text-amber-700">
              Sarah Chen
            </span>
            <span className="text-[10px] text-amber-700 font-medium">Admin Biometric</span>
          </button>
        </div>
      </div>
    </div>
  );
};
