import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Course, CourseModule, Enrollment, Assessment } from '../../types';
import { TrainerAiGrader } from './TrainerAiGrader';
import { TrainerExperimentReviews } from './TrainerExperimentReviews';
import { TrainerProfileView } from './TrainerProfileView';
import { useTheme } from '../../context/ThemeContext';
import { 
  BookOpen, 
  Users, 
  FileCheck2, 
  BarChart3, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Search, 
  X, 
  Trash2, 
  GraduationCap, 
  Award,
  Loader2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TrainerDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ activeTab, onTabChange }) => {
  const { user, trainerDetails } = useAuth();
  const { isDark } = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Course Creation Modal
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Cloud & DevOps');
  const [newLevel, setNewLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newDuration, setNewDuration] = useState(30);
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop');
  const [newSkills, setNewSkills] = useState('Kubernetes, Docker, CI/CD Pipelines');
  const [newModules, setNewModules] = useState<CourseModule[]>([
    { id: 'm1', title: 'Curriculum Foundations & Core Theory', duration_minutes: 45, content: 'Introduction to domain concepts and architectural foundations.' },
    { id: 'm2', title: 'Hands-on Implementation & Lab Simulation', duration_minutes: 60, content: 'Practical deployment patterns and scenario troubleshooting.' }
  ]);
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Assessment Creation Modal
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [selectedCourseForAssessment, setSelectedCourseForAssessment] = useState('');
  const [assessTitle, setAssessTitle] = useState('');
  const [assessDesc, setAssessDesc] = useState('');
  const [assessPassing, setAssessPassing] = useState(70);
  const [assessTime, setAssessTime] = useState(25);
  const [assessQuestions, setAssessQuestions] = useState([
    {
      id: 'q1',
      question: 'Which architecture pattern best ensures fault tolerance across regional cloud zones?',
      options: ['Multi-region active-active replicas', 'Single local monolith', 'Unreplicated local disk', 'Manual cold standby'],
      correct_option_index: 0
    }
  ]);
  const [creatingAssessment, setCreatingAssessment] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, eRes, aRes] = await Promise.all([
        api.getCourses(),
        api.getEnrollments(),
        api.getAssessments()
      ]);
      setCourses(cRes.courses || []);
      setEnrollments(eRes.enrollments || []);
      setAssessments(aRes.assessments || []);
      if (cRes.courses && cRes.courses.length > 0) {
        setSelectedCourseForAssessment(cRes.courses[0].id);
      }
    } catch (err) {
      console.error('Failed to load trainer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddModule = () => {
    const nextNum = newModules.length + 1;
    setNewModules([
      ...newModules,
      {
        id: `m${Date.now()}`,
        title: `Module ${nextNum}: Advanced Competency Practice`,
        duration_minutes: 45,
        content: 'Technical guidelines, specifications, and lab exercises.'
      }
    ]);
  };

  const handleRemoveModule = (index: number) => {
    setNewModules(newModules.filter((_, i) => i !== index));
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      await api.createCourse({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        level: newLevel,
        duration_hours: Number(newDuration) || 20,
        cover_image: newCover,
        skills_acquired: newSkills.split(',').map(s => s.trim()).filter(Boolean),
        modules: newModules
      });
      setShowCreateCourseModal(false);
      setNewTitle('');
      setNewDesc('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create course.');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleCreateAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForAssessment) {
      alert('Please select a course.');
      return;
    }
    setCreatingAssessment(true);
    try {
      await api.createAssessment({
        course_id: selectedCourseForAssessment,
        title: assessTitle,
        description: assessDesc,
        passing_score: Number(assessPassing) || 70,
        time_limit_minutes: Number(assessTime) || 20,
        questions: assessQuestions
      });
      setShowCreateAssessmentModal(false);
      setAssessTitle('');
      setAssessDesc('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create assessment.');
    } finally {
      setCreatingAssessment(false);
    }
  };

  // Trainees analytics data for Recharts
  const chartData = courses.map(c => {
    const courseEnrollments = enrollments.filter(e => e.course_id === c.id);
    const completed = courseEnrollments.filter(e => e.status === 'completed').length;
    return {
      name: c.title.length > 18 ? c.title.slice(0, 18) + '...' : c.title,
      enrolled: courseEnrollments.length,
      completed: completed
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Trainer Header & KPIs (Restricted to Courses Overview Route) */}
      {activeTab === 'courses' && (
        <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  Instructor Console: {user?.full_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Verified Master Trainer
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {user?.department} • {user?.organization}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateCourseModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Training Program
              </button>
              <button
                onClick={() => setShowCreateAssessmentModal(true)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                New Assessment
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="liquid-glass-metric-card p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Active Programs</span>
                <BookOpen className="w-4 h-4 text-[#0077B6]" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-display">{courses.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Under instruction</p>
            </div>

            <div className="liquid-glass-metric-card p-4 rounded-2xl border border-teal-200 dark:border-teal-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">Total Trainees</span>
                <Users className="w-4 h-4 text-[#00A896]" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-display">{enrollments.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active candidates</p>
            </div>

            <div className="liquid-glass-metric-card p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Program Completions</span>
                <CheckCircle2 className="w-4 h-4 text-[#FFB703]" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-display">
                {enrollments.filter(e => e.status === 'completed').length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Certified trainees</p>
            </div>

            <div className="liquid-glass-metric-card p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Assessments Published</span>
                <FileCheck2 className="w-4 h-4 text-[#6366F1]" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-display">{assessments.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Evaluation rubrics</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: My Training Programs */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Managed Curricula & Programs ({courses.length})
            </h3>
            <button
              onClick={() => setShowCreateCourseModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Program
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const enrolledInThis = enrollments.filter(e => e.course_id === course.id);
              const completedInThis = enrolledInThis.filter(e => e.status === 'completed').length;

              return (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    {course.cover_image && (
                      <div className="h-32 w-full overflow-hidden relative">
                        <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white">
                          {course.level}
                        </span>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {course.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 font-display line-clamp-1">{course.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                      
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                        <span>{(course.modules || []).length} modules</span>
                        <span>{enrolledInThis.length} enrolled ({completedInThis} completed)</span>
                      </div>

                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onTabChange('trainees')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      View Trainee Roster
                    </button>
                    <span className="text-[10px] text-slate-400">Created by {course.trainer_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB: Trainees & Attendance */}
      {activeTab === 'trainees' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Trainee Roster & Program Attendance
              </h3>
              <p className="text-xs text-slate-500">
                Monitor trainee curriculum progression, module completion, and competency readiness.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {enrollments.length} Active Records
            </span>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[620px] sm:min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Trainee Candidate</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Program Track</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Modules Completed</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Overall Progress</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Status</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{enr.user_name || 'Alex Rivera'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{enr.user_email || 'trainee@capacityconnect.org'}</p>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-slate-800 dark:text-slate-200">
                      {enr.course?.title || 'Program Track'}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {enr.completed_modules.length} / {enr.course?.modules.length || 0}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden inline-block align-middle mr-2">
                        <div 
                          className={`h-full ${enr.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${enr.progress_percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">{enr.progress_percentage}%</span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        enr.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                      }`}>
                        {enr.status === 'completed' ? 'Graduated' : 'In Progress'}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-500 dark:text-slate-400">
                      {new Date(enr.enrolled_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: Assessments Builder */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Published Assessments & Rubrics
                </h3>
                <p className="text-xs text-slate-500">
                  Assessments validate mastery and trigger automated cryptographic certification upon passing.
                </p>
              </div>
              <button
                onClick={() => setShowCreateAssessmentModal(true)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Assessment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((a) => (
                <div key={a.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {a.course_title || 'Course'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Passing: {a.passing_score}%
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                  <p className="text-xs text-slate-500">{a.description}</p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-slate-600 border-t border-slate-200">
                    <span>⏱ {a.time_limit_minutes} min limit</span>
                    <span>❓ {a.questions.length} questions included</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Automated Assignment & Quiz Grader */}
      {activeTab === 'grader' && (
        <TrainerAiGrader courses={courses} />
      )}

      {/* Review & Grade Experiment Videos */}
      {activeTab === 'experiment-reviews' && (
        <TrainerExperimentReviews courses={courses} />
      )}

      {/* 5. TAB: Program Performance Chart */}
      {activeTab === 'analytics' && (
        <div className="liquid-glass-card rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Program Enrollment & Completion Analytics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Real-time visual comparison of enrolled participants versus graduated trainees across MoES curricula.
              </p>
            </div>
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
              {courses.length} Active Tracks
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#475569' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderRadius: '12px', 
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a', 
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                  }}
                />
                <Bar isAnimationActive={false} dataKey="enrolled" fill={isDark ? '#38bdf8' : '#0077b6'} name="Total Enrolled" radius={[6, 6, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="completed" fill={isDark ? '#2dd4bf' : '#00a896'} name="Completed Modules" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 6. TAB: Trainer Profile (Protected with Re-Authentication) */}
      {activeTab === 'profile' && (
        <TrainerProfileView />
      )}

      {/* MODAL: Create Course */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 font-display">Create Training Program</h3>
              <button onClick={() => setShowCreateCourseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Enterprise Cloud Native Architecture"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option>Cloud & DevOps</option>
                    <option>Artificial Intelligence</option>
                    <option>Cybersecurity</option>
                    <option>Sustainable Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Objectives</label>
                <textarea
                  rows={2}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Comprehensive training outline..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Skills (comma separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Modules Builder */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Curriculum Modules ({newModules.length})</span>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Module
                  </button>
                </div>

                {newModules.map((mod, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-400">#{idx + 1}</span>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const updated = [...newModules];
                        updated[idx].title = e.target.value;
                        setNewModules(updated);
                      }}
                      className="flex-1 px-2 py-1 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      value={mod.duration_minutes}
                      onChange={(e) => {
                        const updated = [...newModules];
                        updated[idx].duration_minutes = Number(e.target.value);
                        setNewModules(updated);
                      }}
                      className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center"
                    />
                    <span className="text-[10px] text-slate-400">mins</span>
                    {newModules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModule(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={creatingCourse}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Course to National Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Assessment */}
      {showCreateAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 font-display">Create Assessment Rubric</h3>
              <button onClick={() => setShowCreateAssessmentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Associated Course</label>
                <select
                  value={selectedCourseForAssessment}
                  onChange={(e) => setSelectedCourseForAssessment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={assessTitle}
                  onChange={(e) => setAssessTitle(e.target.value)}
                  placeholder="e.g. Master Verification Exam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={assessDesc}
                  onChange={(e) => setAssessDesc(e.target.value)}
                  placeholder="e.g. Complete 5 scenario questions with passing threshold"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Threshold (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={assessPassing}
                    onChange={(e) => setAssessPassing(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={assessTime}
                    onChange={(e) => setAssessTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingAssessment}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingAssessment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Publish Assessment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
