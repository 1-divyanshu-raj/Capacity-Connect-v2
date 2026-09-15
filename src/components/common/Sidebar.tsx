import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, 
  Award, 
  FileCheck2, 
  ScanFace, 
  Users, 
  PlusCircle, 
  BarChart3, 
  ShieldAlert, 
  FileText, 
  Settings, 
  X, 
  Compass, 
  CheckCircle, 
  GraduationCap 
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingApprovalsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  pendingApprovalsCount = 0
}) => {
  const { role } = useAuth();

  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', label: 'Platform Overview', icon: BarChart3 },
          { 
            id: 'approvals', 
            label: 'Pending Approvals', 
            icon: ShieldAlert, 
            badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
            badgeColor: 'bg-amber-600 text-white' 
          },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'programs', label: 'Course Catalog', icon: BookOpen },
          { id: 'audit', label: 'Audit Logs & Security', icon: FileText },
        ];
      case 'trainer':
        return [
          { id: 'courses', label: 'My Training Programs', icon: BookOpen },
          { id: 'trainees', label: 'Trainees & Attendance', icon: Users },
          { id: 'assessments', label: 'Assessments Builder', icon: FileCheck2 },
          { id: 'analytics', label: 'Program Performance', icon: BarChart3 },
          { id: 'profile', label: 'Trainer Profile', icon: GraduationCap },
        ];
      case 'trainee':
      default:
        return [
          { id: 'my-courses', label: 'My Enrolled Programs', icon: BookOpen },
          { id: 'catalog', label: 'Browse Training Catalog', icon: Compass },
          { id: 'assessments', label: 'Assessments & Tests', icon: FileCheck2 },
          { id: 'certificates', label: 'My Certificates', icon: Award },
          { id: 'biometrics', label: 'Biometric Face ID', icon: ScanFace },
          { id: 'profile', label: 'Skills & Profile', icon: Settings },
        ];
    }
  };

  const menuItems = getMenuItems();

  const renderNavList = () => (
    <div className="space-y-1 py-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-xs ${item.badgeColor || 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar (Liquid glass card, sticky, centered) */}
      <aside className="hidden lg:block w-64 shrink-0 pr-6">
        <div className="sticky top-20 liquid-glass rounded-3xl border border-slate-200/80 dark:border-white/10 p-3.5 shadow-sm flex flex-col justify-between min-h-[calc(100vh-8rem)]">
          <div>
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation Menu
            </div>
            {renderNavList()}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Theme</span>
            <ThemeToggle variant="pill" />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Liquid glass for phones) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full liquid-glass shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200/80 dark:border-white/10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    CC
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-display">CapacityConnect</span>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Role Portals
                </div>
                {renderNavList()}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Theme mode</span>
                <ThemeToggle variant="pill" />
              </div>
              <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                Capacity Connect • Governance Platform
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
