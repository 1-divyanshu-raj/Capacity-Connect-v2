import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  Award, 
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
  Trash2,
  ScanFace
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ReAuthPasswordModal } from '../common/ReAuthPasswordModal';

export const TraineeProfileView: React.FC = () => {
  const { user, traineeDetails, updateUserSession } = useAuth();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [educationLevel, setEducationLevel] = useState(traineeDetails?.education_level || 'Postgraduate (M.Sc / M.Tech in Earth Sciences)');
  const [skillsInterests, setSkillsInterests] = useState<string[]>(
    traineeDetails?.skills_interests && traineeDetails.skills_interests.length > 0
      ? traineeDetails.skills_interests
      : ['Operational Oceanography', 'Numerical Weather Prediction', 'Deep Ocean Exploration']
  );
  const [targetCertifications, setTargetCertifications] = useState<string[]>(
    traineeDetails?.target_certifications && traineeDetails.target_certifications.length > 0
      ? traineeDetails.target_certifications
      : ['MoES Certified Ocean State Specialist', 'IMD Doppler Radar Analyst']
  );

  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState('');

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setOrganization(user.organization);
      setDepartment(user.department);
    }
    if (traineeDetails) {
      if (traineeDetails.education_level) setEducationLevel(traineeDetails.education_level);
      if (traineeDetails.skills_interests) setSkillsInterests(traineeDetails.skills_interests);
      if (traineeDetails.target_certifications) setTargetCertifications(traineeDetails.target_certifications);
    }
  }, [user, traineeDetails]);

  const handleStartEdit = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowReAuthModal(true);
  };

  const handleReAuthSuccess = () => {
    setIsEditing(true);
    setSuccessMessage('Password verified. You may now edit your official personnel credentials.');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage(null);
    // Reset to user values
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setOrganization(user.organization);
      setDepartment(user.department);
    }
    if (traineeDetails) {
      if (traineeDetails.education_level) setEducationLevel(traineeDetails.education_level);
      if (traineeDetails.skills_interests) setSkillsInterests(traineeDetails.skills_interests);
      if (traineeDetails.target_certifications) setTargetCertifications(traineeDetails.target_certifications);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skillsInterests.includes(newSkill.trim())) {
      setSkillsInterests([...skillsInterests, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsInterests(skillsInterests.filter(s => s !== skillToRemove));
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCert.trim() && !targetCertifications.includes(newCert.trim())) {
      setTargetCertifications([...targetCertifications, newCert.trim()]);
      setNewCert('');
    }
  };

  const handleRemoveCert = (certToRemove: string) => {
    setTargetCertifications(targetCertifications.filter(c => c !== certToRemove));
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
        education_level: educationLevel,
        skills_interests: skillsInterests,
        target_certifications: targetCertifications
      });

      if (res.success) {
        updateUserSession(res.user, res.trainee_details, res.trainer_details);
        setIsEditing(false);
        setSuccessMessage('Personnel profile details saved and synced successfully to the MoES repository.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving profile modifications.');
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center text-xl font-black font-display shadow-md shadow-cyan-600/20 border border-white/20">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'TR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  {user?.full_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Active MoES Trainee
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
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Details (Protected)</span>
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
                  <span>Save Changes</span>
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
                  Identity Verified: Fields are unlocked. Save your updates when finished.
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Protected Credentials: Profile is in read-only mode to safeguard official Ministry records.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
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

      {/* Main Profile Details Form */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Official Personnel & Contact Details */}
        <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Personnel & Institutional Information
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
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Legal Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter full name"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {fullName}
                </div>
              )}
            </div>

            {/* Email (Immutable Identity Key) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Official MoES / Organization Email</span>
                <span className="text-[10px] font-normal text-slate-400">(Permanent ID)</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span className="font-mono">{user?.email}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Contact & OTP Destination</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {phone || 'Not provided'}
                </div>
              )}
            </div>

            {/* Organization */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>MoES Institution / Partner Organization</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. INCOIS Hyderabad, IMD New Delhi"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {organization}
                </div>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Division / Scientific Cadre</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Ocean Modeling & Tsunami Warning Wing"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {department}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Scientific Skills, Education & Target Certifications */}
        <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Capacity Competencies & Certifications
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

          <div className="space-y-5">
            {/* Education Level */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Academic Background / Scientific Degree
              </label>
              {isEditing ? (
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Ph.D. in Ocean / Atmospheric Sciences">Ph.D. in Ocean / Atmospheric Sciences</option>
                  <option value="Postgraduate (M.Sc / M.Tech in Earth Sciences)">Postgraduate (M.Sc / M.Tech in Earth Sciences)</option>
                  <option value="B.Tech in Marine / Environmental Engineering">B.Tech in Marine / Environmental Engineering</option>
                  <option value="Scientific Officer (MoES Central Pool)">Scientific Officer (MoES Central Pool)</option>
                  <option value="Junior Research Fellow (JRF / SRF)">Junior Research Fellow (JRF / SRF)</option>
                </select>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-900 dark:text-white font-semibold">
                  {educationLevel}
                </div>
              )}
            </div>

            {/* Skills & Scientific Research Interests */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Key Domain Competencies & Research Specializations
              </label>
              <div className="flex flex-wrap gap-1.5">
                {skillsInterests.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5"
                  >
                    <span>{skill}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
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
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add scientific skill (e.g. Swell Nowcasting, WRF Modeling)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>

            {/* Target Certifications */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target MoES Competency Certifications
              </label>
              <div className="flex flex-wrap gap-1.5">
                {targetCertifications.map((cert, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5"
                  >
                    <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{cert}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(cert)}
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
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    placeholder="Add target certificate..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCert(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>

            {/* Biometrics Status */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Biometric Face ID Status:
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                user?.has_biometrics 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {user?.has_biometrics ? 'Enrolled & Verified' : 'Enrollment Required'}
              </span>
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
