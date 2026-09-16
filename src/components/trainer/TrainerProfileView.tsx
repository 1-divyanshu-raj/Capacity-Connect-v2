import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Lock, 
  Unlock, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Plus, 
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ReAuthPasswordModal } from '../common/ReAuthPasswordModal';

export const TrainerProfileView: React.FC = () => {
  const { user, trainerDetails, updateUserSession } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio, setBio] = useState(trainerDetails?.bio || 'Senior Scientific Faculty directing ocean and meteorological numerical modeling capacity building.');
  const [qualifications, setQualifications] = useState(trainerDetails?.qualifications || 'Ph.D. in Physical Oceanography (IISc / NIO), MoES Lead Scientist');
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(
    trainerDetails?.expertise_areas && trainerDetails.expertise_areas.length > 0
      ? trainerDetails.expertise_areas
      : ['Operational Oceanography', 'Numerical Weather Prediction', 'Deep Ocean Mission', 'Satellite Meteorology']
  );

  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setOrganization(user.organization);
      setDepartment(user.department);
    }
    if (trainerDetails) {
      if (trainerDetails.bio) setBio(trainerDetails.bio);
      if (trainerDetails.qualifications) setQualifications(trainerDetails.qualifications);
      if (trainerDetails.expertise_areas) setExpertiseAreas(trainerDetails.expertise_areas);
    }
  }, [user, trainerDetails]);

  const handleStartEdit = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowReAuthModal(true);
  };

  const handleReAuthSuccess = () => {
    setIsEditing(true);
    setSuccessMessage('Password verified. You may now edit your official faculty credentials.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage(null);
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setOrganization(user.organization);
      setDepartment(user.department);
    }
    if (trainerDetails) {
      if (trainerDetails.bio) setBio(trainerDetails.bio);
      if (trainerDetails.qualifications) setQualifications(trainerDetails.qualifications);
      if (trainerDetails.expertise_areas) setExpertiseAreas(trainerDetails.expertise_areas);
    }
  };

  const handleAddExpertise = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpertise.trim() && !expertiseAreas.includes(newExpertise.trim())) {
      setExpertiseAreas([...expertiseAreas, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setExpertiseAreas(expertiseAreas.filter(e => e !== item));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await api.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        department: department.trim(),
        bio,
        qualifications,
        expertise_areas: expertiseAreas
      });

      if (res.success) {
        updateUserSession(res.user, res.trainee_details, res.trainer_details);
        setIsEditing(false);
        setSuccessMessage('Trainer faculty credentials saved successfully to the MoES repository.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving trainer profile modifications.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Header Card */}
      <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-xl font-black font-display shadow-md shadow-indigo-600/20 border border-white/20">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'TR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  {user?.full_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  MoES Certified Master Trainer
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {user?.department} • {user?.organization}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Faculty Details (Protected)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Faculty Record</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Protection Banner Notice */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            {isEditing ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Identity Verified: Faculty fields unlocked for editing.
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Protected Faculty Credentials: Requires administrator or re-authentication approval to modify.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Govt. of India Security Standard (IS/ISO 27001)
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Personnel Info */}
        <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Faculty Personnel Information
              </h3>
            </div>
            {!isEditing ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-Only
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Unlocked
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Faculty Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {fullName}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Institutional Email (Permanent)</label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span className="font-mono">{user?.email}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Contact</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {phone || 'Not provided'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">MoES Institute / Center</label>
              {isEditing ? (
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {organization}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department / Division</label>
              {isEditing ? (
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {department}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications & Expertise */}
        <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Academic & Instructional Credentials
              </h3>
            </div>
            {!isEditing ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-Only
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Unlocked
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Highest Academic Qualifications</label>
              {isEditing ? (
                <input
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {qualifications}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Faculty Biography / Research Focus</label>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {bio}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Areas of Instruction & Domain Mastery</label>
              <div className="flex flex-wrap gap-1.5">
                {expertiseAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
                  >
                    <span>{area}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExpertise(area)}
                        className="p-0.5 hover:text-rose-600 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {isEditing && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Add scientific domain..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExpertise(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddExpertise}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Password Re-Authentication Modal */}
      <ReAuthPasswordModal
        isOpen={showReAuthModal}
        onClose={() => setShowReAuthModal(false)}
        onSuccess={handleReAuthSuccess}
        userEmail={user?.email || ''}
      />
    </div>
  );
};
