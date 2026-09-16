import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AssignmentSubmission, AssessmentResult, Course } from '../../types';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Award, 
  UserCheck, 
  HelpCircle, 
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface TrainerAiGraderProps {
  courses: Course[];
}

export const TrainerAiGrader: React.FC<TrainerAiGraderProps> = ({ courses }) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [scoreInput, setScoreInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.getSubmissions();
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSelectSubmission = (sub: AssignmentSubmission) => {
    setSelectedSubmission(sub);
    setScoreInput(sub.score ?? (sub.ai_report?.score_estimate ?? 90));
    setFeedbackInput(sub.trainer_feedback || (sub.ai_report?.summary || ''));
    setMessage(null);
  };

  const handleGenerateAiReport = async () => {
    if (!selectedSubmission) return;
    try {
      setGeneratingAi(true);
      setMessage(null);
      const res = await api.generateAiGraderReport(selectedSubmission.id);
      setSelectedSubmission(res.submission);
      setScoreInput(res.ai_report?.score_estimate ?? 90);
      setFeedbackInput(res.ai_report?.summary ?? '');
      setMessage({ type: 'success', text: 'AI rubric grader report generated successfully!' });
      await fetchSubmissions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate AI report.' });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      setSavingGrade(true);
      setMessage(null);
      const res = await api.gradeSubmission(selectedSubmission.id, {
        score: Number(scoreInput),
        trainer_feedback: feedbackInput.trim()
      });
      setSelectedSubmission(res.submission);
      setMessage({ type: 'success', text: `Grade (${scoreInput}%) and feedback finalized and saved!` });
      await fetchSubmissions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save grade.' });
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div id="trainer-ai-grader-section" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/40 dark:from-indigo-950/60 dark:via-purple-950/50 dark:to-blue-950/60 border border-indigo-300/30 dark:border-indigo-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Automated Evaluation Pipeline
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              AI Assignment & Quiz Grader
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Accelerate assessment workflows using Gemini-assisted neural rubric scoring. Evaluate trainee coursework against rigorous standards, view criteria-by-criteria deductions, and verify scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-display">
                {submissions.filter(s => s.status === 'submitted').length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Needs Grading</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {submissions.filter(s => s.status === 'graded').length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Submissions List Column */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Trainee Submissions ({submissions.length})
            </h3>
            <span className="text-xs text-slate-400">Click to assess</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No submissions found.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {submissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                const isGraded = sub.status === 'graded';
                const hasAi = !!sub.ai_report;

                return (
                  <button
                    key={sub.id}
                    id={`submission-item-${sub.id}`}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {sub.course_title}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {sub.assignment_title}
                        </h4>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                          Student: <strong className="text-slate-900 dark:text-white">{sub.user_name}</strong>
                        </p>
                      </div>

                      <div>
                        {isGraded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {sub.score}%
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="truncate max-w-[180px]">File: {sub.file_name}</span>
                      {hasAi && (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md">
                          <Sparkles className="w-3 h-3" />
                          AI Evaluated ({sub.ai_report?.score_estimate}%)
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Evaluation & Grading Workspace Column */}
        <div className="lg:col-span-7">
          {selectedSubmission ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Grading Console
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedSubmission.assignment_title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submitted by <strong className="text-slate-800 dark:text-slate-200">{selectedSubmission.user_name}</strong> on {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </p>
                </div>

                {/* AI Grader trigger button */}
                <button
                  id="run-ai-grader-btn"
                  onClick={handleGenerateAiReport}
                  disabled={generatingAi}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 hover:scale-102 active:scale-98 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
                  {generatingAi ? 'Assessing Rubric...' : selectedSubmission.ai_report ? 'Regenerate AI Report' : 'Generate AI Grader Report'}
                </button>
              </div>

              {/* Message alert */}
              {message && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                  {message.text}
                </div>
              )}

              {/* Submission Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">Submitted Artifact:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedSubmission.file_name} ({selectedSubmission.file_size})
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block mb-1">Trainee Annotations:</span>
                  <p className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 leading-relaxed font-sans">
                    {selectedSubmission.notes || 'No extra notes provided by student.'}
                  </p>
                </div>
              </div>

              {/* AI Rubric Evaluation Report Section */}
              {selectedSubmission.ai_report && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        AI Rubric Assessment ({selectedSubmission.ai_report.model_used || 'Gemini 2.5 Flash'})
                      </span>
                    </div>
                    <span className="text-xs font-black text-purple-800 dark:text-purple-200 bg-purple-200/70 dark:bg-purple-900/80 px-3 py-1 rounded-full">
                      Estimated Score: {selectedSubmission.ai_report.score_estimate}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-purple-200/50 dark:border-purple-800/40">
                    "{selectedSubmission.ai_report.summary}"
                  </p>

                  {/* Rubric item cards */}
                  {selectedSubmission.ai_report.rubric_evaluations && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                        Detailed Criteria Scoring
                      </span>
                      <div className="space-y-2">
                        {selectedSubmission.ai_report.rubric_evaluations.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-purple-200/60 dark:border-purple-800/50 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-900 dark:text-white">{item.criteria}</span>
                              <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                                {item.points} / {item.max_points} pts
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.reasoning}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {selectedSubmission.ai_report.key_strengths && (
                      <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                          Key Strengths
                        </span>
                        <ul className="text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside space-y-1">
                          {selectedSubmission.ai_report.key_strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedSubmission.ai_report.areas_for_improvement && (
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                          Areas for Improvement
                        </span>
                        <ul className="text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside space-y-1">
                          {selectedSubmission.ai_report.areas_for_improvement.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Master Trainer Final Grade Form */}
              <form onSubmit={handleSaveGrade} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Instructor Final Evaluation & Grade
                  </span>
                  {selectedSubmission.ai_report && (
                    <button
                      type="button"
                      onClick={() => setScoreInput(selectedSubmission.ai_report!.score_estimate)}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Adopt AI Score ({selectedSubmission.ai_report.score_estimate}%)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Final Score (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      id="trainer-score-input"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(Number(e.target.value))}
                      className="w-full text-base font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Instructor Rationale & Guidance
                    </label>
                    <input
                      type="text"
                      required
                      id="trainer-feedback-input"
                      placeholder="e.g., Code modularity verified. Good error handling on the telemetry stream."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    id="save-final-grade-btn"
                    disabled={savingGrade}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {savingGrade ? 'Finalizing...' : 'Save & Publish Official Grade'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Select a Trainee Submission to Begin
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select any assignment or quiz from the list on the left to run AI automated evaluation reports, inspect student code, and register verified marks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
