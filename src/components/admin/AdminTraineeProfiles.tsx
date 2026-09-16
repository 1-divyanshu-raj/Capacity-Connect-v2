import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { TraineeProfileDossier } from '../../types';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  UserCheck, 
  FileText, 
  Video, 
  BarChart3,
  Mail,
  MapPin,
  Building2,
  Calendar
} from 'lucide-react';

export const AdminTraineeProfiles: React.FC = () => {
  const [trainees, setTrainees] = useState<TraineeProfileDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [activeDossier, setActiveDossier] = useState<TraineeProfileDossier | null>(null);

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminTrainees();
        setTrainees(res.trainees || []);
      } catch (err) {
        console.error('Failed to load trainee profiles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainees();
  }, []);

  // Collect all unique specializations
  const allSpecializations = Array.from(
    new Set(trainees.flatMap(t => t.specializations || []))
  );

  const filteredTrainees = trainees.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.organization && t.organization.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpec = selectedSpecialization === 'all' 
      || (t.specializations && t.specializations.includes(selectedSpecialization));

    return matchesSearch && matchesSpec;
  });

  return (
    <div id="admin-trainee-profiles" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-purple-950/60 border border-blue-300/30 dark:border-blue-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30">
              <GraduationCap className="w-3.5 h-3.5" />
              Academic Records & Trainee Dossiers
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Trainee Profiles, Grade Progress & Specializations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Monitor individual learner grade progress, course competencies, attendance consistency, and technical specializations across all regional training institutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-display">
                {trainees.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Trainees</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                92.4%
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Specialization:</span>
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Fields ({allSpecializations.length})</option>
            {allSpecializations.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trainee Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading trainee profile dossiers...
        </div>
      ) : filteredTrainees.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 p-8">
          No trainee profiles found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainees.map((t) => (
            <div
              key={t.id}
              id={`trainee-card-${t.id}`}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Header with Avatar & Grade Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                      {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {t.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Grade {t.grade_level || 'A+'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">GPA: {t.overall_gpa || 3.9}</p>
                  </div>
                </div>

                {/* Institution & Location */}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {t.organization || 'Govt Polytechnic'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {t.state || 'India'}
                  </span>
                </div>

                {/* Specializations Badges */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {(t.specializations || ['AI & Robotics', 'Embedded Systems']).map((s, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Grade Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>Course Progress</span>
                    <span className="text-blue-600 dark:text-blue-400">{t.overall_progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
                      style={{ width: `${t.overall_progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Metrics pill row */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Quizzes</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t.assessments_passed_count} Passed
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Labs</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t.experiments_completed_count} Videos
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Attendance</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {t.attendance_percentage || 95}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                id={`view-trainee-dossier-${t.id}`}
                onClick={() => setActiveDossier(t)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                View Full Academic Dossier
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dossier Drawer Modal */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Certified Trainee Transcript
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeDossier.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeDossier.email} | {activeDossier.organization}
                </p>
              </div>
              <button
                onClick={() => setActiveDossier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Top Stat Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-center">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Grade Rating</span>
                <div className="text-2xl font-black text-blue-800 dark:text-blue-200 mt-0.5">
                  {activeDossier.grade_level || 'A+'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Cumulative GPA</span>
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                  {activeDossier.overall_gpa || '3.92'}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-center">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Course Progress</span>
                <div className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-0.5">
                  {activeDossier.overall_progress_percentage}%
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Attendance</span>
                <div className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeDossier.attendance_percentage || 96}%
                </div>
              </div>
            </div>

            {/* Specializations & Focus */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Endorsed Skill Specializations
              </span>
              <div className="flex flex-wrap gap-2">
                {(activeDossier.specializations || ['AI Robotics', 'SCADA Automation', 'EV Powertrain']).map((spec, i) => (
                  <span key={i} className="text-xs font-semibold px-3 py-1 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Enrolled Courses Progress */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Enrolled Course Progress & Grade Breakdowns
              </span>
              <div className="space-y-2.5">
                {(activeDossier.enrolled_courses || []).map((ec) => (
                  <div key={ec.course_id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {ec.course_title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Attendance: {ec.attendance_count} sessions | Status: <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">{ec.status}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {ec.progress}% Finished
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ec.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveDossier(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
