import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { UserRole } from '../../types';

interface FastDemoLoginProps {
  onSuccess?: () => void;
}

export const FastDemoLogin: React.FC<FastDemoLoginProps> = ({ onSuccess }) => {
  const { demoLogin } = useAuth();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = async (role: UserRole) => {
    setLoadingRole(role);
    setError(null);
    try {
      await demoLogin(role);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo account.');
    } finally {
      setLoadingRole(null);
    }
  };

  const demoProfiles = [
    {
      role: 'trainee' as UserRole,
      title: 'Trainee Account',
      name: 'Alex Rivera',
      email: 'alex.trainee@capacityconnect.org',
      dept: 'State Digital Talent Consortium',
      tag: 'Learner & Certification Seeker',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      btnClass: 'hover:border-emerald-500 hover:bg-emerald-50/30',
      icon: CheckCircle2,
      accentColor: 'text-emerald-600',
      description: 'Access enrolled courses, interactive modules, assessments, and verified certificates.'
    },
    {
      role: 'trainer' as UserRole,
      title: 'Trainer Account',
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma@capacityconnect.org',
      dept: 'Cloud Systems & AI Division',
      tag: 'Senior Master Instructor',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      btnClass: 'hover:border-indigo-500 hover:bg-indigo-50/30',
      icon: Sparkles,
      accentColor: 'text-indigo-600',
      description: 'Design training curricula, manage trainee attendance, publish assessments, and review analytics.'
    },
    {
      role: 'admin' as UserRole,
      title: 'Administrator Account',
      name: 'Sarah Chen',
      email: 'sarah.admin@capacityconnect.org',
      dept: 'National Capacity & Skills Mission',
      tag: 'Platform Director & Approver',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      btnClass: 'hover:border-amber-500 hover:bg-amber-50/30',
      icon: ShieldCheck,
      accentColor: 'text-amber-600',
      description: 'Approve pending administrator registrations, manage users, catalog oversight, and audit logs.'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed">
        <p className="font-semibold mb-0.5">🚀 1-Click Fast Login / Demo Environment</p>
        Select any dedicated role to test full authorization privileges with pre-configured relational data. Demo sessions are bound to genuine database accounts.
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {demoProfiles.map((p) => {
          const Icon = p.icon;
          const isLoading = loadingRole === p.role;
          return (
            <div
              key={p.role}
              onClick={() => !loadingRole && handleDemo(p.role)}
              className={`group relative p-4 rounded-xl border border-slate-200 bg-white transition-all cursor-pointer shadow-xs hover:shadow-md ${p.btnClass} ${
                loadingRole ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${p.badgeClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${p.badgeClass}`}>
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="shrink-0 p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100 leading-normal">
                {p.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
