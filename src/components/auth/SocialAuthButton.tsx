import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { UserRole } from '../../types';
import { ChevronDown, Loader2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export type SocialProvider = 'google' | 'apple' | 'microsoft';

interface SocialAuthButtonProps {
  mode: 'login' | 'register';
  selectedRole?: UserRole;
  onSuccess?: () => void;
  onProviderSelect?: (provider: SocialProvider, profileData?: any) => void;
  className?: string;
  variant?: 'compact' | 'full';
}

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.03-.5 2.68-1.27z" />
  </svg>
);

export const MicrosoftIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 23 23">
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

export const PROVIDERS_CONFIG: Array<{
  id: SocialProvider;
  name: string;
  sub: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
}> = [
  {
    id: 'google',
    name: 'Google',
    sub: 'Google Workspace & Gmail',
    icon: GoogleIcon,
    accentColor: 'hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
  },
  {
    id: 'apple',
    name: 'Apple',
    sub: 'Apple ID & iCloud',
    icon: AppleIcon,
    accentColor: 'hover:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    sub: 'Microsoft 365 & Entra ID',
    icon: MicrosoftIcon,
    accentColor: 'hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30'
  }
];

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
  mode,
  selectedRole = 'trainee',
  onSuccess,
  onProviderSelect,
  className = '',
  variant = 'compact'
}) => {
  const { setSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleProviderAuth = async (provider: SocialProvider) => {
    setLoadingProvider(provider);
    setFeedback(null);

    try {
      if (onProviderSelect) {
        onProviderSelect(provider);
      }

      if (mode === 'login') {
        const res = await api.socialLogin(provider, selectedRole);
        setFeedback({
          type: 'success',
          message: `Authenticated with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`
        });

        // Set auth session
        setSession({
          token: res.token,
          user: res.user,
          trainee_details: res.trainee_details,
          trainer_details: res.trainer_details
        });

        setTimeout(() => {
          setIsOpen(false);
          if (onSuccess) onSuccess();
        }, 400);
      } else {
        // Register mode
        const res = await api.socialRegister(provider, selectedRole);
        if (res.pending) {
          setFeedback({
            type: 'success',
            message: 'Administrator account submitted for approval.'
          });
        } else {
          setFeedback({
            type: 'success',
            message: `Account registered via ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`
          });
          if (res.token) {
            setSession({
              token: res.token,
              user: res.user,
              trainee_details: res.trainee_details,
              trainer_details: res.trainer_details
            });
          }
        }

        setTimeout(() => {
          setIsOpen(false);
          if (onSuccess) onSuccess();
        }, 500);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || `Failed to authenticate with ${provider}.`
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const actionTitle = mode === 'login' ? 'Log in with' : 'Register with';
  const buttonId = mode === 'login' ? 'btn-login-with' : 'btn-register-with';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Primary Trigger Button */}
      <button
        type="button"
        id={buttonId}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loadingProvider !== null}
        className={`h-9 px-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] w-full sm:w-auto whitespace-nowrap ${
          isOpen ? 'ring-2 ring-blue-500/30 border-blue-500 bg-blue-50/30' : ''
        }`}
        title={`${actionTitle} Auth 2.0 (Google, Apple, or Microsoft)`}
      >
        {loadingProvider ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
            <span className="font-bold">
              Connecting {loadingProvider.charAt(0).toUpperCase() + loadingProvider.slice(1)}...
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center -space-x-1 shrink-0">
              <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-2xs border border-slate-200/60 p-0.5 shrink-0">
                <GoogleIcon className="w-2.5 h-2.5" />
              </span>
              <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xs border border-slate-800 p-0.5 shrink-0">
                <AppleIcon className="w-2.5 h-2.5" />
              </span>
              <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-2xs border border-slate-200/60 p-0.5 shrink-0">
                <MicrosoftIcon className="w-2.5 h-2.5" />
              </span>
            </div>
            <span className="font-bold tracking-tight">{actionTitle}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Expandable Dropdown Menu with Google, Apple, and Microsoft Options */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={buttonId}
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl shadow-slate-900/10 z-50 p-2 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Menu Header */}
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              Auth 2.0
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {selectedRole}
            </span>
          </div>

          {/* Feedback message if any */}
          {feedback && (
            <div
              className={`mb-2 p-2 rounded-xl text-[11px] flex items-center gap-1.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold leading-tight">{feedback.message}</span>
            </div>
          )}

          {/* Provider Options List */}
          <div className="space-y-1">
            {PROVIDERS_CONFIG.map((provider) => {
              const Icon = provider.icon;
              const isSelected = loadingProvider === provider.id;

              return (
                <button
                  key={provider.id}
                  id={`btn-${mode}-provider-${provider.id}`}
                  type="button"
                  role="menuitem"
                  disabled={loadingProvider !== null}
                  onClick={() => handleProviderAuth(provider.id)}
                  className={`w-full p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left transition-all flex items-center justify-between group cursor-pointer ${
                    provider.accentColor
                  } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white dark:bg-slate-850'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <span>{mode === 'login' ? 'Log in with' : 'Register with'} {provider.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {provider.sub}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                        Connect →
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Helper note */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 text-center">
            Institutional verification & audit logs apply
          </div>
        </div>
      )}
    </div>
  );
};
