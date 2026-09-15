import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, RefreshCw, LogOut, CheckCircle2, Clock, Building2 } from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      await refreshUser();
      setMessage('Status updated. If an administrator has approved your account, your dashboard will load automatically.');
    } catch {
      setMessage('Could not check status right now.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200/80 shadow-xl overflow-hidden p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600 shadow-md shadow-amber-500/10">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            Status: PENDING ADMINISTRATIVE REVIEW
          </span>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            Administrator Authorization Pending
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Hello, <strong className="text-slate-800">{user?.full_name}</strong>. In accordance with platform security governance, all Administrator accounts require manual review and authorization by an existing Administrator.
          </p>
        </div>

        {/* Account Details Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Email:</span>
            <span className="font-semibold text-slate-800">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Organization:</span>
            <span className="font-semibold text-slate-800">{user?.organization}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="font-semibold text-slate-800">{user?.department}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Requested At:</span>
            <span className="font-semibold text-slate-800">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </span>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-left flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            Check Approval Status
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out / Switch Account
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Tip: You can log into the <strong>Admin Demo account (Sarah Chen)</strong> via Fast Demo Login to test approving this account.
        </p>
      </div>
    </div>
  );
};
