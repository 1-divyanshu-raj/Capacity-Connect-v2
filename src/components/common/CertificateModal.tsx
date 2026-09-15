import React, { useEffect } from 'react';
import { Certificate } from '../../types';
import { Award, X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
  triggerCelebration?: boolean;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  triggerCelebration = false
}) => {
  useEffect(() => {
    if (triggerCelebration && certificate) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [triggerCelebration, certificate]);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative max-w-3xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold tracking-tight">Verified Digital Certificate of Completion</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-8 sm:p-12 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 relative border-8 border-double border-amber-800/20 m-4 rounded-2xl">
          {/* Watermark / Logo background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-96 h-96 text-amber-900" />
          </div>

          <div className="text-center relative z-10 space-y-6">
            {/* Seal & Org */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-900">
                Capacity Connect • National Skill Mission
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                Certificate of Competency
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-1" />
            </div>

            {/* Recipient text */}
            <div className="space-y-2 py-2">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                This is proudly presented to
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-blue-900 font-display underline decoration-amber-400 decoration-2 underline-offset-8">
                {certificate.user_name}
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                for demonstrating exceptional technical proficiency and successfully completing all modular curricula, practical labs, and rigorous competency assessments in
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 max-w-xl mx-auto pt-1 font-display">
                {certificate.course_title}
              </h3>
            </div>

            {/* Grade & Verification Details */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80 max-w-xl mx-auto text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Award Date</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{certificate.issue_date}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Standing</p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">{certificate.grade}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Instructor</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{certificate.trainer_name}</p>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold">Cryptographically Signed & Authenticated</span>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Verification ID</p>
                <p className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                  {certificate.verification_code}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
