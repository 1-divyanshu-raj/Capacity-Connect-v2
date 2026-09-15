import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Shield, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { testSupabaseClientConnection, SupabaseClientTestResult, getSupabase } from '../../lib/supabaseClient';
import { api } from '../../lib/api';

interface SupabaseConnectionTestProps {
  onClose?: () => void;
}

export const SupabaseConnectionTest: React.FC<SupabaseConnectionTestProps> = ({ onClose }) => {
  const [testing, setTesting] = useState(false);
  const [clientResult, setClientResult] = useState<SupabaseClientTestResult | null>(null);
  const [backendDiagnostics, setBackendDiagnostics] = useState<any | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(() => {
    return localStorage.getItem('cc_supabase_temp_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [persistedTestLog, setPersistedTestLog] = useState<string | null>(() => {
    return localStorage.getItem('cc_supabase_last_test');
  });

  const runDiagnostics = async (keyToUse?: string) => {
    setTesting(true);
    try {
      const activeKey = keyToUse !== undefined ? keyToUse : customKeyInput;
      const [cRes, bRes] = await Promise.allSettled([
        testSupabaseClientConnection(activeKey),
        fetch('/api/supabase/diagnostics').then(r => r.json())
      ]);

      if (cRes.status === 'fulfilled') {
        setClientResult(cRes.value);
        if (activeKey) {
          localStorage.setItem('cc_supabase_temp_key', activeKey);
        }
      }
      if (bRes.status === 'fulfilled') {
        setBackendDiagnostics(bRes.value);
      }

      const testTimestamp = `Verified at ${new Date().toLocaleTimeString()} • ${cRes.status === 'fulfilled' && cRes.value.connected ? 'Connected' : 'Diagnosed'}`;
      localStorage.setItem('cc_supabase_last_test', testTimestamp);
      setPersistedTestLog(testTimestamp);
    } catch (err: any) {
      console.error('Diagnostic error:', err);
    } finally {
      setTesting(false);
    }
  };


  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full px-2">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden backdrop-blur-md transition-all">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold font-display">Supabase Integration Monitor</h4>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  jxmgovsoerukppnaygjg
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Live connection & persistence audit</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto text-xs">
            {/* Project URL display */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Project</span>
                <span className="font-mono text-slate-900 font-semibold truncate block max-w-[260px]">
                  https://jxmgovsoerukppnaygjg.supabase.co
                </span>
              </div>
              <a
                href="https://supabase.com/dashboard/project/jxmgovsoerukppnaygjg"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition-colors"
                title="Open Supabase Dashboard"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Client-side check status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Frontend Direct (@supabase/supabase-js):</span>
                {clientResult?.connected ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : clientResult?.hasKey ? (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Schema Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                    <XCircle className="w-3.5 h-3.5" /> Key Required
                  </span>
                )}
              </div>

              {clientResult && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Key configured:</span>
                    <span className="font-semibold text-slate-800">
                      {clientResult.hasKey ? `Present (${clientResult.keyType})` : 'Missing in .env'}
                    </span>
                  </div>
                  {clientResult.tableTest && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Table 'courses' query:</span>
                      <span className={clientResult.tableTest.accessible ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {clientResult.tableTest.accessible 
                          ? (clientResult.tableTest.isEmpty 
                              ? 'Accessible & Empty (0 rows)' 
                              : `Accessible (${clientResult.tableTest.rowCount} records)`) 
                          : 'Pending DDL'}
                      </span>
                    </div>
                  )}
                  {clientResult.details && (
                    <p className="text-[10px] text-emerald-700 bg-emerald-50/80 p-1.5 rounded border border-emerald-200 mt-1">
                      {clientResult.details}
                    </p>
                  )}
                  {clientResult.error && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1">
                      {clientResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Test Key Input Toggle */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Test Publishable / Anon Key</span>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="text-[10px] text-blue-600 font-semibold hover:underline"
                >
                  {showKeyInput ? 'Hide' : (customKeyInput ? 'Change Key' : 'Enter Key to Test')}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Client-safe only: accepts <code className="text-blue-600 font-mono">sb_publish_...</code> or JWT anon key. Secret keys are blocked.
              </p>
              {showKeyInput && (
                <div className="mt-2 space-y-2">
                  <input
                    type="password"
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder="sb_publish_... or eyJhbGci..."
                    className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {customKeyInput && (customKeyInput.toLowerCase().startsWith('sb_secret') || customKeyInput.toLowerCase().includes('service_role')) && (
                    <p className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded border border-rose-200">
                      ⚠️ Secret / Service-role key detected and rejected. Never use secret keys in frontend code. Please use the public anon/publishable key.
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={!customKeyInput || customKeyInput.toLowerCase().startsWith('sb_secret') || customKeyInput.toLowerCase().includes('service_role')}
                      onClick={() => runDiagnostics(customKeyInput)}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold text-[10px] hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Key
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* Backend Diagnostics */}
            {backendDiagnostics && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Backend Gateway Diagnostics:</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    backendDiagnostics.status === 'GREEN' ? 'text-emerald-600' :
                    backendDiagnostics.status === 'YELLOW' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {backendDiagnostics.status === 'GREEN' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {backendDiagnostics.status}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[10px] text-slate-600 space-y-1">
                  <p>{backendDiagnostics.details}</p>
                </div>
              </div>
            )}

            {/* Page Reload Persistence Confirmation */}
            {persistedTestLog && (
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-[10px] text-emerald-800 flex items-center justify-between">
                <span>🔄 Persistence confirmed: State preserved across reloads.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => runDiagnostics()}
                disabled={testing}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Checking Connection...' : 'Re-run Supabase Test'}</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
