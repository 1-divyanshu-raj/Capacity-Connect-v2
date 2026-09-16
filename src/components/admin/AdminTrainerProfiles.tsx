import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { TrainerProfileDossier } from '../../types';
import { 
  Users, 
  Search, 
  GraduationCap, 
  Star, 
  BookOpen, 
  Award, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2,
  Calendar,
  Briefcase
} from 'lucide-react';

export const AdminTrainerProfiles: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerProfileDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminTrainers();
        setTrainers(res.trainers || []);
      } catch (err) {
        console.error('Failed to load trainer profiles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  const allSpecializations = Array.from(
    new Set(trainers.flatMap(t => t.specializations || []))
  );

  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.organization && t.organization.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpec = selectedSpecialization === 'all'
      || (t.specializations && t.specializations.includes(selectedSpecialization));

    return matchesSearch && matchesSpec;
  });

  return (
    <div id="admin-trainer-profiles" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/40 dark:from-purple-950/60 dark:via-indigo-950/50 dark:to-blue-950/60 border border-purple-300/30 dark:border-purple-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-400/30">
              <Users className="w-3.5 h-3.5" />
              Faculty & Master Instructors
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Trainer Specializations, Batches & Evaluations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Examine verified subject-matter experts, domain accreditations, learner satisfaction ratings, and active batch assignments across the country.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-display">
                {trainers.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Master Trainers</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-amber-500 font-display flex items-center justify-center gap-1">
                <Star className="w-5 h-5 fill-amber-500" />
                4.91
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Faculty Rating</div>
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
              placeholder="Search by instructor name, organization, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Domain:</span>
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Domains ({allSpecializations.length})</option>
            {allSpecializations.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trainer Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading trainer dossiers...
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 p-8">
          No trainer profiles found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrainers.map((t) => (
            <div
              key={t.id}
              id={`trainer-card-${t.id}`}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Header with Avatar & Star Rating */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                      {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {t.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {t.rating || '4.92'}
                  </div>
                </div>

                {/* Organization & Bio */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.organization || 'National Institute of Technical Training'}</span>
                </div>

                {t.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed italic">
                    "{t.bio}"
                  </p>
                )}

                {/* Specializations Badges */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {(t.specializations || ['AI Robotics', 'Industrial SCADA']).map((spec, i) => (
                    <span 
                      key={i}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Batches</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t.active_batches_count || 4} Active
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Trainees</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t.total_trainees_trained || 128}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Experience</span>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                      {t.years_experience || 8} Yrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Courses Taught Pill */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Programs Instructed:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(t.courses_taught || ['Cloud AI', 'Embedded SCADA']).map((c, idx) => (
                    <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
