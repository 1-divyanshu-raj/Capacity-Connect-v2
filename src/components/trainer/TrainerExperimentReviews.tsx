import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ExperimentVideo, Course } from '../../types';
import { 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  Eye, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Filter,
  Film,
  Award,
  ChevronRight
} from 'lucide-react';

interface TrainerExperimentReviewsProps {
  courses: Course[];
}

export const TrainerExperimentReviews: React.FC<TrainerExperimentReviewsProps> = ({ courses }) => {
  const [experiments, setExperiments] = useState<ExperimentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentVideo | null>(null);

  // Grade Form
  const [scoreInput, setScoreInput] = useState<number>(85);
  const [statusInput, setStatusInput] = useState<'approved' | 'revision_needed'>('approved');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const res = await api.getExperiments({
        courseId: selectedCourseId !== 'all' ? selectedCourseId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setExperiments(res.experiments || []);
    } catch (err) {
      console.error('Failed to load experiments for trainer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [selectedCourseId, statusFilter]);

  const handleSelectExp = (exp: ExperimentVideo) => {
    setSelectedExperiment(exp);
    setScoreInput(exp.score ?? 85);
    setStatusInput(exp.status === 'revision_needed' ? 'revision_needed' : 'approved');
    setFeedbackInput(exp.trainer_feedback || '');
    setGradeSuccess(null);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExperiment) return;

    try {
      setSubmittingGrade(true);
      setGradeSuccess(null);

      const res = await api.gradeExperiment(selectedExperiment.id, {
        score: Number(scoreInput),
        status: statusInput,
        trainer_feedback: feedbackInput.trim()
      });

      setSelectedExperiment(res.experiment);
      setGradeSuccess(`Experiment "${selectedExperiment.title}" has been graded successfully (${scoreInput}% - ${statusInput.toUpperCase()})!`);
      await fetchExperiments();
    } catch (err: any) {
      alert(err.message || 'Failed to submit grade.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div id="trainer-experiment-reviews" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-900/40 via-cyan-900/30 to-blue-900/40 dark:from-teal-950/60 dark:via-cyan-950/50 dark:to-blue-950/60 border border-teal-300/30 dark:border-teal-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 dark:bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-400/30">
              <Video className="w-3.5 h-3.5" />
              Laboratory Practical Assessment
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Review & Grade Experiment Videos
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Inspect video submissions in all common video formats (MP4, WebM, AVI, MOV, MKV). Verify physical instrumentation, safety precautions, and telemetry readings before awarding passing credits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
                {experiments.filter(e => e.status === 'under_review').length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">To Review</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {experiments.filter(e => e.status === 'approved').length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Submissions</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="revision_needed">Revision Needed</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <strong className="text-slate-900 dark:text-white">{experiments.length}</strong> lab videos
        </div>
      </div>

      {/* Split Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Videos List Column */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Trainee Lab Submissions
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading experiment videos...
            </div>
          ) : experiments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No experiment videos found for this filter.
            </div>
          ) : (
            <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
              {experiments.map((exp) => {
                const isSelected = selectedExperiment?.id === exp.id;
                const isApproved = exp.status === 'approved';
                const isRevision = exp.status === 'revision_needed';

                return (
                  <button
                    key={exp.id}
                    id={`exp-item-${exp.id}`}
                    onClick={() => handleSelectExp(exp)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 shadow-md ring-1 ring-teal-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                            .{exp.video_format}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
                            {exp.course_title}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {exp.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Trainee: <strong className="text-slate-900 dark:text-white">{exp.user_name}</strong>
                        </p>
                      </div>

                      <div>
                        {isApproved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {exp.score}%
                          </span>
                        ) : isRevision ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Revise
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Review
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                      <span>Duration: {Math.round((exp.duration_seconds || 180) / 60)} min</span>
                      <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Video Player & Grading Form Column */}
        <div className="lg:col-span-7">
          {selectedExperiment ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    Video Player & Evaluation
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedExperiment.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trainee: <strong className="text-slate-800 dark:text-slate-200">{selectedExperiment.user_name}</strong> | Format: <span className="font-mono uppercase font-bold text-teal-600 dark:text-teal-400">.{selectedExperiment.video_format}</span>
                  </p>
                </div>
              </div>

              {gradeSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {gradeSuccess}
                </div>
              )}

              {/* HTML5 Video Box */}
              <div className="rounded-2xl overflow-hidden bg-black aspect-video relative flex items-center justify-center shadow-inner">
                <video
                  controls
                  key={selectedExperiment.id}
                  className="w-full h-full object-contain"
                  src={selectedExperiment.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>

              {/* Lab Metadata & Procedure Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block mb-1">Execution Summary:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {selectedExperiment.description}
                  </p>
                </div>

                {selectedExperiment.lab_parameters && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-500 block mb-1">Instrumentation & Parameters:</span>
                    <p className="font-mono text-xs text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      {selectedExperiment.lab_parameters}
                    </p>
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Trainer Laboratory Assessment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Performance Score (0 - 100%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      id="trainer-experiment-score"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(Number(e.target.value))}
                      className="w-full text-base font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Verification Outcome
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value as any)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="approved">Approved (Competency Satisfied)</option>
                      <option value="revision_needed">Revision Needed (Safety / Spec Failure)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Evaluator Feedback & Safety Recommendations
                  </label>
                  <textarea
                    rows={3}
                    required
                    id="trainer-experiment-feedback"
                    placeholder="Provide notes on sensor wiring, calibration accuracy, step sequence..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    id="submit-experiment-grade-btn"
                    disabled={submittingGrade}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {submittingGrade ? 'Recording Grade...' : 'Save & Publish Lab Review'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <Film className="w-12 h-12 text-teal-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Select an Experiment Video to Review
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select any trainee experiment video from the column on the left to start playback, inspect telemetry, and award graded marks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
