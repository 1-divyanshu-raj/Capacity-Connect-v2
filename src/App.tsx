import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/common/ThemeToggle';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { TraineeDashboard } from './components/trainee/TraineeDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CertificateVerifyModal } from './components/common/CertificateVerifyModal';
import { NotificationItem } from './types';
import { api } from './lib/api';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, role, status, isLoading } = useAuth();

  // Navigation tab state (defaults per role)
  const [activeTab, setActiveTab] = useState<string>('my-courses');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  // Update default tab when role changes
  useEffect(() => {
    if (role === 'admin') {
      setActiveTab('overview');
    } else if (role === 'trainer') {
      setActiveTab('courses');
    } else if (role === 'trainee') {
      setActiveTab('my-courses');
    }
  }, [role]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-slate-800 dark:text-white flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
          <span className="text-xl">CC</span>
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-white font-display">CapacityConnect</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          Verifying security authorization session...
        </p>
      </div>
    );
  }

  // Unauthenticated: Show Auth Modal (Centered, Reactive, Liquid Glass)
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300">
        {/* Ambient liquid glow refraction spheres */}
        <div className="ambient-glow-light dark:ambient-glow-dark -top-40 -left-40 w-96 h-96 bg-blue-300/40 dark:bg-blue-600/30" />
        <div className="ambient-glow-light dark:ambient-glow-dark top-1/3 -right-40 w-96 h-96 bg-indigo-300/30 dark:bg-indigo-600/20" />
        <div className="ambient-glow-light dark:ambient-glow-dark -bottom-40 left-1/3 w-96 h-96 bg-sky-200/40 dark:bg-purple-900/30" />

        {/* Center-Oriented Top Bar */}
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <span className="font-display tracking-tight text-base">CC</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-display">
                Capacity<span className="text-blue-600 dark:text-blue-400">Connect</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                National Capacity Building & Skill Development Governance Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Functional Light/Dark Mode Toggle Switch */}
            <ThemeToggle variant="pill" />

            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-3.5 py-1.5 rounded-2xl liquid-glass text-slate-700 dark:text-white text-xs font-bold transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden xs:inline">Verify Credential</span>
              <span className="xs:hidden">Verify</span>
            </button>
          </div>
        </div>

        {/* Center-Oriented Container for Auth Card */}
        <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center my-auto py-4 relative z-10">
          <AuthModal />
        </div>

        {/* Center-Oriented Footer */}
        <div className="max-w-xl mx-auto w-full text-center text-[11px] text-slate-500 dark:text-slate-400 pt-6 relative z-10 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-pill text-[11px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Capacity Connect</span>
            <span>•</span>
            <span>Skill Development & Governance Platform</span>
          </div>
        </div>

        {showVerifyModal && (
          <CertificateVerifyModal onClose={() => setShowVerifyModal(false)} />
        )}
      </div>
    );
  }

  // Pending Authorization Account (e.g. pending administrator)
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex flex-col transition-colors duration-300 relative">
        <Header 
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenVerifyModal={() => setShowVerifyModal(true)}
          notifications={notifications}
          onRefreshNotifications={fetchNotifications}
        />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
          <PendingApprovalView />
        </main>
        {showVerifyModal && (
          <CertificateVerifyModal onClose={() => setShowVerifyModal(false)} />
        )}
      </div>
    );
  }

  // Active Authenticated Dashboard (Fully Centered, Reactive, Liquid Glass)
  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex flex-col transition-colors duration-300 relative overflow-x-hidden">
      {/* Ambient liquid glow refraction spheres */}
      <div className="ambient-glow-light dark:ambient-glow-dark -top-60 -right-40 w-120 h-120 bg-blue-300/30 dark:bg-blue-600/25" />
      <div className="ambient-glow-light dark:ambient-glow-dark top-1/2 -left-60 w-120 h-120 bg-indigo-200/30 dark:bg-indigo-700/20" />
      <div className="ambient-glow-light dark:ambient-glow-dark -bottom-60 right-1/4 w-120 h-120 bg-cyan-200/30 dark:bg-purple-900/25" />

      {/* Top Header with liquid glass */}
      <Header
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenVerifyModal={() => setShowVerifyModal(true)}
        notifications={notifications}
        onRefreshNotifications={fetchNotifications}
      />

      {/* Main Center-Oriented Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Responsive Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            pendingApprovalsCount={pendingApprovalsCount}
          />

          {/* Main Dynamic Center-Oriented Viewport */}
          <main className="flex-1 min-w-0 w-full">
            {role === 'trainee' && (
              <TraineeDashboard
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}

            {role === 'trainer' && (
              <TrainerDashboard
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}

            {role === 'admin' && (
              <AdminDashboard
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onRefreshApprovalsCount={(count) => setPendingApprovalsCount(count)}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Certificate Verification Modal */}
      {showVerifyModal && (
        <CertificateVerifyModal onClose={() => setShowVerifyModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
