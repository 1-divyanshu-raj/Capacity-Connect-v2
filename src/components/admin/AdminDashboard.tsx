import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { UserProfile, Course, AuditLog } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Trash2, 
  ScanFace, 
  Clock, 
  Sparkles,
  BarChart3,
  Loader2
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefreshApprovalsCount?: (count: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  activeTab, 
  onTabChange,
  onRefreshApprovalsCount
}) => {
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, approvalsRes, coursesRes, auditRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getPendingApprovals(),
        api.getCourses(),
        api.getAuditLogs(100)
      ]);

      setStats(statsRes.stats);
      setUsers(usersRes.users || []);
      setPendingApprovals(approvalsRes.pending_users || []);
      setCourses(coursesRes.courses || []);
      setAuditLogs(auditRes.logs || []);

      if (onRefreshApprovalsCount) {
        onRefreshApprovalsCount(approvalsRes.pending_users?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveAdmin = async (userId: string, decision: 'approved' | 'rejected') => {
    setActionLoadingId(userId);
    try {
      await api.reviewPendingAdmin(userId, decision, `Reviewed and ${decision} by administrator ${user?.full_name}`);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (targetUser: UserProfile) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setActionLoadingId(targetUser.id);
    try {
      await api.updateUserStatus(targetUser.id, newStatus);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to remove this course from the national catalog?')) return;
    try {
      await api.deleteCourse(courseId);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course.');
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'All' || u.role === userRoleFilter.toLowerCase();
    const matchesStatus = userStatusFilter === 'All' || u.status === userStatusFilter.toLowerCase();
    const matchesSearch = !userSearchQuery ||
      u.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.organization.toLowerCase().includes(userSearchQuery.toLowerCase());
    return matchesRole && matchesStatus && matchesSearch;
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearchQuery) return true;
    const q = auditSearchQuery.toLowerCase();
    return log.action.toLowerCase().includes(q) ||
      (log.actor_email && log.actor_email.toLowerCase().includes(q)) ||
      log.ip_address.toLowerCase().includes(q) ||
      (log.status && log.status.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* 1. Admin Header & Governance KPIs */}
      <div className="liquid-glass-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                National Governance Dashboard
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Super Admin Access
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as {user?.full_name} • {user?.organization}
            </p>
          </div>

          {/* Pending Approvals quick badge */}
          {pendingApprovals.length > 0 && (
            <button
              onClick={() => onTabChange('approvals')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 animate-pulse transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{pendingApprovals.length} Admin Approvals Pending</span>
            </button>
          )}
        </div>

        {/* Governance KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Trainees</span>
            <p className="text-xl font-black text-slate-900 mt-1 font-display">{stats?.total_trainees || 0}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[11px] font-medium text-indigo-700">Trainers</span>
            <p className="text-xl font-black text-indigo-900 mt-1 font-display">{stats?.total_trainers || 0}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] font-medium text-amber-700">Pending Approvals</span>
            <p className="text-xl font-black text-amber-900 mt-1 font-display">{pendingApprovals.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-medium text-blue-700">Programs</span>
            <p className="text-xl font-black text-blue-900 mt-1 font-display">{stats?.total_courses || 0}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700">Face ID Active</span>
            <p className="text-xl font-black text-emerald-900 mt-1 font-display">{stats?.biometric_enrolled_count || 0}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <span className="text-[11px] font-medium text-purple-700">Certificates</span>
            <p className="text-xl font-black text-purple-900 mt-1 font-display">{stats?.total_certificates || 0}</p>
          </div>
        </div>
      </div>

      {/* 2. TAB: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Pending Approvals Callout */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Administrative Authorization Queue
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingApprovals.length} Requests
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                All administrative accounts are reviewed. No pending approvals in queue.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.full_name}</p>
                        <p className="text-[11px] text-slate-600">{p.email}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.organization} • {p.department}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        PENDING
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200/60 italic">
                      "{p.justification || 'Administrative governance role request.'}"
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApproveAdmin(p.id, 'approved')}
                        disabled={actionLoadingId === p.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Account
                      </button>
                      <button
                        onClick={() => handleApproveAdmin(p.id, 'rejected')}
                        disabled={actionLoadingId === p.id}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security & Audit Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Live Security & Audit Activity
              </h3>
              <button
                onClick={() => onTabChange('audit')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View Full Audit Logs
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {log.action}
                    </span>
                    <p className="text-slate-800 font-medium mt-1">
                      {log.actor_email || 'System Operation'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      IP: {log.ip_address} • {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: Pending Approvals Full View */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Pending Administrator Registration Requests ({pendingApprovals.length})
              </h3>
              <p className="text-xs text-slate-500">
                Rule enforcement: Newly registered Administrators cannot access the console until an existing administrator grants approval.
              </p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No pending administrator accounts.</p>
              <p className="mt-1">All admin requests have been processed and validated.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingApprovals.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{p.full_name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                        Status: Pending
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Email: <span className="font-mono">{p.email}</span> • Phone: {p.phone || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Organization: <strong>{p.organization}</strong> • Department: <strong>{p.department}</strong>
                    </p>
                    {p.justification && (
                      <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 mt-2 max-w-xl">
                        <strong className="text-slate-900">Submitted Justification:</strong> {p.justification}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleApproveAdmin(p.id, 'approved')}
                      disabled={actionLoadingId === p.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                    >
                      {actionLoadingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Authorize Admin
                    </button>
                    <button
                      onClick={() => handleApproveAdmin(p.id, 'rejected')}
                      disabled={actionLoadingId === p.id}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              User Directory & Privilege Governance ({filteredUsers.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user name, email, org..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl w-60"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option>All</option>
                <option value="trainee">Trainees</option>
                <option value="trainer">Trainers</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option>All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Organization & Dept</th>
                  <th className="py-3 px-4">Face ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{u.full_name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : u.role === 'trainer' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-medium">{u.organization}</p>
                      <p className="text-[11px] text-slate-400">{u.department}</p>
                    </td>
                    <td className="py-3 px-4">
                      {u.has_biometrics ? (
                        <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                          <ScanFace className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Not enrolled</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : u.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          disabled={actionLoadingId === u.id}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB: Course Catalog Oversight */}
      {activeTab === 'programs' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">
            National Training Catalog Oversight ({courses.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {course.category}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{course.level}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{course.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                  <p className="text-[11px] text-slate-400 mt-2">Instructor: {course.trainer_name || 'Assigned Faculty'}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{(course.modules || []).length} modules</span>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                National Security Audit Trail & Event Logs
              </h3>
              <p className="text-xs text-slate-500">
                Immutable event stream for all security actions, biometric verifications, and approvals.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Search action, IP, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-700 text-[11px]">
                      {log.actor_email || 'System'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
