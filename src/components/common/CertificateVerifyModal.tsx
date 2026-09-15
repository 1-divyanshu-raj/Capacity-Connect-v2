import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Certificate } from '../../types';
import { ShieldCheck, Search, X, CheckCircle2, AlertTriangle, Award, Loader2 } from 'lucide-react';

interface CertificateVerifyModalProps {
  onClose: () => void;
}

export const CertificateVerifyModal: React.FC<CertificateVerifyModalProps> = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ verified: boolean; certificate?: Certificate; message?: string } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.verifyCertificate(code.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        verified: false,
        message: err.message || 'Verification failed. Please check the code.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Official Credential Verification
            </h3>
            <p className="text-xs text-slate-500">
              Verify credentials issued under Capacity Connect National Mission
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certificate Verification Code
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. VERIFY-CC-77A91-04"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sample test code: <button type="button" onClick={() => setCode('VERIFY-CC-77A91-04')} className="text-blue-600 font-mono underline">VERIFY-CC-77A91-04</button>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Validate in National Registry
          </button>
        </form>

        {result && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            {result.verified && result.certificate ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Valid & Authenticated Certificate</span>
                </div>
                <div className="text-xs space-y-1 text-slate-700 pt-1">
                  <p><strong>Candidate:</strong> {result.certificate.user_name}</p>
                  <p><strong>Training Program:</strong> {result.certificate.course_title}</p>
                  <p><strong>Issued On:</strong> {result.certificate.issue_date}</p>
                  <p><strong>Grade:</strong> <span className="text-emerald-700 font-semibold">{result.certificate.grade}</span></p>
                  <p><strong>Instructor:</strong> {result.certificate.trainer_name}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{result.message || 'No record matched this verification code.'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
