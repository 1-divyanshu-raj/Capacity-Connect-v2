import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  Course, 
  Enrollment, 
  Assessment, 
  AssessmentResult, 
  Certificate 
} from '../../types';
import { CertificateModal } from '../common/CertificateModal';
import { 
  requestCameraStream, 
  stopCameraStream, 
  extractBiometricSignature 
} from '../../lib/biometrics';
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  FileText, 
  Layers, 
  Search, 
  Filter, 
  ScanFace, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Camera,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface TraineeDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TraineeDashboard: React.FC<TraineeDashboardProps> = ({ activeTab, onTabChange }) => {
  const { user, traineeDetails, enrollFace, refreshUser } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  // Interactive Course Viewer Modal
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  // Active Assessment Taking Modal
  const [takingAssessment, setTakingAssessment] = useState<Assessment | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<AssessmentResult | null>(null);

  // Certificate Modal
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);
  const [triggerCelebration, setTriggerCelebration] = useState(false);

  // Biometric Enrollment State
  const [bioVideoActive, setBioVideoActive] = useState(false);
  const [bioScanning, setBioScanning] = useState(false);
  const [bioStep, setBioStep] = useState('');
  const [bioProgress, setBioProgress] = useState(0);
  const [bioMessage, setBioMessage] = useState<{ success: boolean; text: string } | null>(null);
  const bioVideoRef = useRef<HTMLVideoElement | null>(null);
  const bioStreamRef = useRef<MediaStream | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollRes, assessRes, resultsRes, certsRes] = await Promise.all([
        api.getCourses(),
        api.getEnrollments(),
        api.getAssessments(),
        api.getAssessmentResults(),
        api.getCertificates()
      ]);
      setCourses(coursesRes.courses || []);
      setEnrollments(enrollRes.enrollments || []);
      setAssessments(assessRes.assessments || []);
      setResults(resultsRes.results || []);
      setCertificates(certsRes.certificates || []);
    } catch (err) {
      console.error('Failed to load trainee dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Enrollment
  const handleEnroll = async (courseId: string) => {
    try {
      await api.enrollCourse(courseId);
      await fetchData();
      onTabChange('my-courses');
    } catch (err: any) {
      alert(err.message || 'Failed to enroll.');
    }
  };

  // Handle Module Complete in Course Viewer
  const handleMarkModuleComplete = async (courseId: string, moduleId: string) => {
    try {
      const res = await api.updateProgress(courseId, moduleId);
      await fetchData();
      if (res.certificate) {
        setViewingCertificate(res.certificate);
        setTriggerCelebration(true);
      }
    } catch (err: any) {
      console.error('Failed to update progress:', err);
    }
  };

  // Assessment Submit
  const handleQuizSubmit = async () => {
    if (!takingAssessment) return;
    setQuizSubmitting(true);
    try {
      const res = await api.submitAssessment(takingAssessment.id, quizAnswers);
      setQuizResult(res.result);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit assessment.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Camera Enrollment
  const startBioCamera = async () => {
    setBioMessage(null);
    try {
      const stream = await requestCameraStream();
      bioStreamRef.current = stream;
      if (bioVideoRef.current) {
        bioVideoRef.current.srcObject = stream;
        bioVideoRef.current.play();
      }
      setBioVideoActive(true);
    } catch (err: any) {
      setBioMessage({ success: false, text: err.message || 'Could not access camera for biometric enrollment.' });
    }
  };

  const stopBioCamera = () => {
    stopCameraStream(bioStreamRef.current);
    bioStreamRef.current = null;
    if (bioVideoRef.current) bioVideoRef.current.srcObject = null;
    setBioVideoActive(false);
  };

  const handleCaptureAndEnroll = async () => {
    if (!bioVideoRef.current) return;
    setBioScanning(true);
    setBioMessage(null);
    try {
      const sig = await extractBiometricSignature(bioVideoRef.current, (stage, progress) => {
        setBioStep(stage);
        setBioProgress(progress);
      });

      await enrollFace(sig.vector, sig.livenessScore);
      setBioMessage({
        success: true,
        text: 'Facial biometric enrolled successfully! You can now log in seamlessly using 1-click Face Recognition.'
      });
      stopBioCamera();
      refreshUser();
    } catch (err: any) {
      setBioMessage({ success: false, text: err.message || 'Failed to enroll face.' });
    } finally {
      setBioScanning(false);
    }
  };

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || c.level === selectedLevel;
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills_acquired.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));

  return (
    <div className="space-y-6">
      {/* 1. Trainee Overview Header & Metric Cards */}
      <div className="liquid-glass-card rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                Welcome back, {user?.full_name}!
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Active Trainee
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user?.department} • {user?.organization}
            </p>
          </div>

          {/* Quick Biometric Status Card */}
          <div className="flex items-center gap-3">
            {user?.has_biometrics ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Biometric Face ID Enrolled</span>
              </div>
            ) : (
              <button
                onClick={() => onTabChange('biometrics')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
              >
                <ScanFace className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Enroll Face Recognition</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Enrolled Programs</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display">{enrollments.length}</p>
            <p className="text-[11px] text-blue-600/80 mt-0.5">Active curriculum tracks</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Completed Courses</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display">
              {enrollments.filter(e => e.status === 'completed').length}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">100% finished modules</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Certificates Earned</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display">{certificates.length}</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Verified credentials</p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-700">Assessments Passed</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display">
              {results.filter(r => r.passed).length}
            </p>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">High competency standing</p>
          </div>
        </div>
      </div>

      {/* 2. TAB: My Enrolled Programs */}
      {activeTab === 'my-courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              My Enrolled Training Tracks ({enrollments.length})
            </h3>
            <button
              onClick={() => onTabChange('catalog')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">You have not enrolled in any training program yet.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore high-impact courses in Cloud, AI, and Cybersecurity to start developing capacity.
              </p>
              <button
                onClick={() => onTabChange('catalog')}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700"
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((enr) => {
                const course = enr.course;
                if (!course) return null;
                const isComplete = enr.progress_percentage === 100;

                return (
                  <div 
                    key={enr.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {course.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isComplete 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isComplete ? 'Completed' : `${enr.progress_percentage}% In Progress`}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 font-display">
                        {course.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Progress</span>
                          <span>{enr.completed_modules.length} / {(course.modules || []).length} modules</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${enr.progress_percentage}%` }}
                          />
                        </div>
                      </div>

                    </div>

                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setViewingCourse(course);
                          setActiveModuleIndex(0);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        {isComplete ? 'Review Modules' : 'Continue Learning'}
                      </button>

                      {/* Assessment / Certificate CTA */}
                      {isComplete ? (
                        <button
                          onClick={() => {
                            const cert = certificates.find(c => c.course_id === course.id);
                            if (cert) setViewingCertificate(cert);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Award className="w-4 h-4" />
                          View Certificate
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const asm = assessments.find(a => a.course_id === course.id);
                            if (asm) {
                              setTakingAssessment(asm);
                              setQuizAnswers({});
                              setQuizResult(null);
                            } else {
                              alert('Assessment not published yet for this course.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
                        >
                          Take Assessment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: Browse Training Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search training programs or skills..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
              >
                <option>All</option>
                <option>Cloud & DevOps</option>
                <option>Artificial Intelligence</option>
                <option>Cybersecurity</option>
                <option>Sustainable Infrastructure</option>
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
              >
                <option>All</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((c) => {
              const isEnrolled = enrolledCourseIds.has(c.id);

              return (
                <div 
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {c.cover_image && (
                      <div className="h-36 w-full overflow-hidden relative">
                        <img 
                          src={c.cover_image} 
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                          {c.level}
                        </span>
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 font-display line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {c.duration_hours}h duration
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {(c.modules || []).length} modules
                        </span>

                      </div>

                      {/* Skills acquired */}
                      <div className="flex flex-wrap gap-1 pt-2">
                        {c.skills_acquired.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {isEnrolled ? (
                      <button
                        onClick={() => onTabChange('my-courses')}
                        className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Already Enrolled (View Track)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(c.id)}
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        Enroll in Program
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB: Assessments & Tests */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-base font-bold text-slate-900 font-display mb-1">
              Available Program Assessments
            </h3>
            <p className="text-xs text-slate-500">
              Clear competency assessments to unlock your verified Digital Certificate.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((asm) => {
                const existingResult = results.find(r => r.assessment_id === asm.id);

                return (
                  <div key={asm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {asm.course_title || 'Training Program'}
                        </span>
                        {existingResult && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            existingResult.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            Score: {existingResult.score}% ({existingResult.passed ? 'Passed' : 'Failed'})
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{asm.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{asm.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                        <span>⏱ {asm.time_limit_minutes} mins</span>
                        <span>🎯 Passing Score: {asm.passing_score}%</span>
                        <span>❓ {asm.questions.length} Questions</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTakingAssessment(asm);
                        setQuizAnswers({});
                        setQuizResult(null);
                      }}
                      className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                    >
                      {existingResult ? 'Retake Assessment' : 'Start Assessment'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB: My Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-display">
              Earned Certifications ({certificates.length})
            </h3>
          </div>

          {certificates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No certificates earned yet.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Complete all modules and pass assessments in your enrolled training programs to receive verifiable certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div 
                  key={cert.id}
                  className="bg-white rounded-2xl border-2 border-amber-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {cert.verification_code}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-3 font-display">
                    {cert.course_title}
                  </h4>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    {cert.grade}
                  </p>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Issued: {cert.issue_date}</span>
                    <button
                      onClick={() => setViewingCertificate(cert)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      View & Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB: Biometric Face ID Enrollment */}
      {activeTab === 'biometrics' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <div className="max-w-xl">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-blue-600" />
              Biometric Facial ID Enrollment
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Enroll your live facial biometric descriptor to enable instant, camera-based authentication on Capacity Connect. The system captures multi-frame micro-variance (liveness) and computes a 128-d spatial vector without storing raw photos.
            </p>
          </div>

          <div className="max-w-sm mx-auto bg-slate-900 rounded-2xl aspect-4/3 overflow-hidden relative flex items-center justify-center border-2 border-slate-200">
            {bioVideoActive ? (
              <>
                <video
                  ref={bioVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-52 border-2 border-blue-400 rounded-[35px] relative">
                    {bioScanning && (
                      <div className="w-full h-0.5 bg-blue-400 absolute top-0 animate-bounce shadow-md shadow-blue-400/50" />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <Camera className="w-10 h-10 mx-auto text-slate-500" />
                <p className="text-xs text-slate-300">Camera preview inactive</p>
                <button
                  type="button"
                  onClick={startBioCamera}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Turn On Camera
                </button>
              </div>
            )}

            {bioScanning && (
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 p-3 text-center">
                <p className="text-xs text-white font-medium mb-1">{bioStep}</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all duration-200" style={{ width: `${bioProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {bioMessage && (
            <div className={`p-3 rounded-xl border text-xs max-w-sm mx-auto flex items-start gap-2 ${
              bioMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {bioMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{bioMessage.text}</span>
            </div>
          )}

          <div className="max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleCaptureAndEnroll}
              disabled={bioScanning || !bioVideoActive}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {bioScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
              Capture Face & Enroll Template
            </button>
          </div>
        </div>
      )}

      {/* 7. TAB: Skills & Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 font-display">
            Trainee Professional Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-700">Account Details</p>
              <p><span className="text-slate-500">Name:</span> {user?.full_name}</p>
              <p><span className="text-slate-500">Email:</span> {user?.email}</p>
              <p><span className="text-slate-500">Phone:</span> {user?.phone || 'N/A'}</p>
              <p><span className="text-slate-500">Organization:</span> {user?.organization}</p>
              <p><span className="text-slate-500">Department:</span> {user?.department}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-700">Skills & Target Certifications</p>
              <p><span className="text-slate-500">Education:</span> {traineeDetails?.education_level || 'Undergraduate'}</p>
              <div>
                <span className="text-slate-500">Key Interests:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(traineeDetails?.skills_interests || ['Cloud', 'Kubernetes', 'DevOps']).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Course Curriculum Viewer */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="max-w-3xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400">{viewingCourse.category}</span>
                <h3 className="text-sm font-bold truncate max-w-lg">{viewingCourse.title}</h3>
              </div>
              <button 
                onClick={() => setViewingCourse(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
              {/* Module List sidebar */}
              <div className="border-r border-slate-200 p-3 overflow-y-auto space-y-1 bg-slate-50/50">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Curriculum Modules</p>
                {viewingCourse.modules.map((m, idx) => {
                  const enr = enrollments.find(e => e.course_id === viewingCourse.id);
                  const isDone = enr?.completed_modules.includes(m.id);

                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveModuleIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start gap-2 ${
                        activeModuleIndex === idx ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${activeModuleIndex === idx ? 'text-white' : 'text-emerald-600'}`} />
                      ) : (
                        <span className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 ${activeModuleIndex === idx ? 'border-white' : 'border-slate-400'}`} />
                      )}
                      <span className="line-clamp-2">{m.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Module Content */}
              <div className="md:col-span-2 p-6 overflow-y-auto space-y-4">
                {viewingCourse.modules[activeModuleIndex] && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 uppercase">
                        Module {activeModuleIndex + 1} of {viewingCourse.modules.length}
                      </span>
                      <span className="text-xs text-slate-500">
                        {viewingCourse.modules[activeModuleIndex].duration_minutes} Minutes
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 font-display">
                      {viewingCourse.modules[activeModuleIndex].title}
                    </h4>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-3">
                      <p>{viewingCourse.modules[activeModuleIndex].content}</p>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                        <strong>Practical Learning Goal:</strong> Synthesize core competencies, review code architectures, and prepare for the evaluation quiz.
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                      <button
                        onClick={() => handleMarkModuleComplete(viewingCourse.id, viewingCourse.modules[activeModuleIndex].id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Module as Completed
                      </button>

                      {activeModuleIndex < viewingCourse.modules.length - 1 && (
                        <button
                          onClick={() => setActiveModuleIndex(activeModuleIndex + 1)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                        >
                          Next Module
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Taking Assessment */}
      {takingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Competency Examination
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-display mt-1">
                  {takingAssessment.title}
                </h3>
              </div>
              <button 
                onClick={() => setTakingAssessment(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Exit
              </button>
            </div>

            {/* Questions list */}
            {!quizResult ? (
              <div className="space-y-6">
                {takingAssessment.questions.map((q, qIndex) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-xs font-bold text-slate-900">
                      Q{qIndex + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => (
                        <label 
                          key={optIndex}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            quizAnswers[q.id] === optIndex
                              ? 'bg-blue-50 border-blue-400 font-semibold text-blue-900'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={quizAnswers[q.id] === optIndex}
                            onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIndex })}
                            className="text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleQuizSubmit}
                  disabled={quizSubmitting || Object.keys(quizAnswers).length < takingAssessment.questions.length}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {quizSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Submit Assessment for Automated Evaluation
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  {quizResult.passed ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>

                <h4 className="text-xl font-bold text-slate-900">
                  {quizResult.passed ? 'Assessment Successfully Cleared!' : 'Score Did Not Meet Passing Criteria'}
                </h4>
                <p className="text-sm font-semibold text-slate-700">
                  Your Score: <span className={quizResult.passed ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                    {quizResult.score}%
                  </span> (Required: {takingAssessment.passing_score}%)
                </p>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setTakingAssessment(null);
                      setQuizResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Official Certificate View */}
      {viewingCertificate && (
        <CertificateModal
          certificate={viewingCertificate}
          onClose={() => setViewingCertificate(null)}
          triggerCelebration={triggerCelebration}
        />
      )}
    </div>
  );
};
