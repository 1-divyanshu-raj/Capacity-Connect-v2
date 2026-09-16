import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  ShieldAlert,
  Bell, 
  LogOut, 
  Menu, 
  User, 
  ScanFace, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { api } from '../../lib/api';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenVerifyModal?: () => void;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenMobileMenu, 
  onOpenVerifyModal,
  notifications,
  onRefreshNotifications
}) => {
  const { user, role, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    onRefreshNotifications();
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50 shadow-xs whitespace-nowrap shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            Administrator
          </span>
        );
      case 'trainer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 shadow-xs whitespace-nowrap shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            Trainer / Instructor
          </span>
        );
      case 'trainee':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 shadow-xs whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Trainee
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 liquid-glass border-b border-slate-200/80 dark:border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors focus:outline-hidden shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
                <span className="text-sm sm:text-base tracking-tighter">CC</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap">
                    Capacity<span className="text-blue-600 dark:text-blue-400">Connect</span>
                  </span>
                  <span className="hidden lg:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-600/40 whitespace-nowrap shrink-0">
                    MoES, Govt. of India
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium hidden xl:block leading-none truncate">
                  Ministry of Earth Sciences • National Capacity & Research Portal
                </p>
              </div>
            </div>
          </div>

          {/* Center/Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Verify Certificate Link */}
            {onOpenVerifyModal && (
              <button
                onClick={onOpenVerifyModal}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 liquid-glass-pill px-3 py-1.5 rounded-xl transition-all hover:scale-102 active:scale-98 whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Verify Certificate</span>
              </button>
            )}

            {/* Role Badge (Shown on lg+ desktop, available in dropdown on tablet/mobile) */}
            <div className="hidden lg:block shrink-0">
              {getRoleBadge()}
            </div>

            {/* Biometric Status Indicator */}
            {user?.has_biometrics && (
              <div 
                title="Biometric Face ID Enrolled & Active" 
                className="hidden 2xl:flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-700/40 shrink-0"
              >
                <ScanFace className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Face ID Ready</span>
              </div>
            )}

            {/* Theme Toggle Button (Compact single-tap on phones/tablets/laptops, Segmented pill on xl+) */}
            <div className="hidden xl:flex items-center shrink-0">
              <ThemeToggle variant="pill" />
            </div>
            <div className="xl:hidden flex items-center shrink-0">
              <ThemeToggle variant="compact" />
            </div>

            {/* Notifications Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-96 liquid-glass rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-w-[calc(100vw-1.5rem)]"
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{notifications.length} total</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">
                        No notifications at this time.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-3.5 hover:bg-slate-50/70 dark:hover:bg-white/5 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.title}</p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                            {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/10 transition-colors focus:outline-hidden"
              >
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'User'}`}
                  alt={user?.full_name}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/20 object-cover bg-slate-100 dark:bg-slate-800"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                    {user?.full_name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight">
                    {user?.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {showUserMenu && (
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-64 liquid-glass rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-w-[calc(100vw-1.5rem)]">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{user?.organization}</p>
                  </div>
                  <div className="px-2 py-1 lg:hidden">
                    <div className="py-1 px-2">{getRoleBadge()}</div>
                  </div>
                  {onOpenVerifyModal && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenVerifyModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/10 flex items-center gap-2 transition-colors lg:hidden"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                      Verify Certificate
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
