import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { TraineeDashboard } from './components/trainee/TraineeDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CertificateVerifyModal } from './components/common/CertificateVerifyModal';
import { SupabaseConnectionTest } from './components/common/SupabaseConnectionTest';
import { NotificationItem } from './types';
import { api } from './lib/api';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, role, status, isLoading } = useAuth();

  // Navigation tab state (defaults per role)
  const [activeTab, setActiveTab] = useState<string>('my-courses');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [showSupabaseTest, setShowSupabaseTest] = useState<boolean>(true);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
          <span className="text-xl">CC</span>
        </div>
        <p className="text-sm font-bold text-slate-800 font-display">CapacityConnect</p>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
          Verifying security authorization session...
        </p>
      </div>
    );
  }

  // Unauthenticated: Show Auth Modal
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">
              <span>CC</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white font-display">
                Capacity<span className="text-blue-400">Connect</span>
              </span>
              <p className="text-[11px] text-blue-200/70 hidden sm:block">
                National Capacity Building & Skill Development System
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowVerifyModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            Verify Credential
          </button>
        </div>

        {/* Center Auth Modal */}
        <div className="w-full flex items-center justify-center my-auto py-4">
          <AuthModal />
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto w-full text-center text-[11px] text-slate-400 pt-6">
          Capacity Connect • Enterprise Capacity Building & Skill Development Governance Platform
        </div>

        {showVerifyModal && (
          <CertificateVerifyModal onClose={() => setShowVerifyModal(false)} />
        )}

        {showSupabaseTest && (
          <SupabaseConnectionTest onClose={() => setShowSupabaseTest(false)} />
        )}
      </div>
    );
  }

  // Pending Authorization Account (e.g. pending administrator)
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header 
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenVerifyModal={() => setShowVerifyModal(true)}
          notifications={notifications}
          onRefreshNotifications={fetchNotifications}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <PendingApprovalView />
        </main>
        {showVerifyModal && (
          <CertificateVerifyModal onClose={() => setShowVerifyModal(false)} />
        )}
        {showSupabaseTest && (
          <SupabaseConnectionTest onClose={() => setShowSupabaseTest(false)} />
        )}
      </div>
    );
  }

  // Active Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col text-slate-800">
      {/* Top Header */}
      <Header
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenVerifyModal={() => setShowVerifyModal(true)}
        notifications={notifications}
        onRefreshNotifications={fetchNotifications}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Responsive Sidebar (Desktop stick, phone hamburger) */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            pendingApprovalsCount={pendingApprovalsCount}
          />

          {/* Main Dynamic Viewport */}
          <main className="flex-1 min-w-0">
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

      {/* Temporary Supabase Connection Test & Audit Widget */}
      {showSupabaseTest && (
        <SupabaseConnectionTest onClose={() => setShowSupabaseTest(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
