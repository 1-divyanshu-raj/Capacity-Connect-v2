import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Assignment, AssignmentSubmission, Course } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Download,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  FileCheck
} from 'lucide-react';

interface TraineeAssignmentsProps {
  courses: Course[];
}

export const TraineeAssignments: React.FC<TraineeAssignmentsProps> = ({ courses }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [viewSubmissionModal, setViewSubmissionModal] = useState<AssignmentSubmission | null>(null);

  // Upload Form State
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [asgRes, subRes] = await Promise.all([
        api.getAssignments(selectedCourseId !== 'all' ? selectedCourseId : undefined),
        api.getSubmissions()
      ]);
      setAssignments(asgRes.assignments || []);
      setSubmissions(subRes.submissions || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setSelectedFile({
        name: file.name,
        size: `${sizeMb} MB`,
        type: file.type || 'application/octet-stream'
      });
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    if (!selectedFile) {
      setSubmitError('Please select an assignment file (PDF, ZIP, DOCX, or Code repo).');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await api.submitAssignment({
        assignment_id: activeAssignment.id,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        notes: uploadNotes.trim()
      });

      setSubmitSuccess(`Assignment "${activeAssignment.title}" submitted successfully!`);
      setActiveAssignment(null);
      setSelectedFile(null);
      setUploadNotes('');
      await fetchData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  return (
    <div id="trainee-assignments-section" className="space-y-6">
      {/* Header Banner with vibrant palette */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-purple-950/60 border border-blue-300/30 dark:border-blue-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30">
              <UploadCloud className="w-3.5 h-3.5" />
              Technical Coursework & Capstones
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Course Assignments & Projects
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Submit lab deliverables, architectural designs, and capstone code. Receive automated AI rubric evaluations and certified instructor grading.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-display">
                {assignments.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Tasks</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {submissions.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Submitted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-sm font-semibold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Registered Courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {submitSuccess && (
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {submitSuccess}
          </div>
        )}
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
          Loading course assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No assignments found for this filter.</p>
          <p className="text-xs text-slate-500 mt-1">Select another course or check back once your instructor assigns new lab tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assignments.map((assignment) => {
            const submission = getSubmissionForAssignment(assignment.id);
            const isGraded = submission?.status === 'graded';
            const isSubmitted = !!submission;

            return (
              <div 
                key={assignment.id}
                id={`assignment-card-${assignment.id}`}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      {assignment.course_title}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-3">
                    {assignment.description}
                  </p>

                  {/* Rubric Points Chips */}
                  {assignment.rubric && assignment.rubric.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        Evaluation Rubric ({assignment.total_points} Pts)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {assignment.rubric.map((r, idx) => (
                          <span 
                            key={idx} 
                            className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                          >
                            {r.criteria}: <strong className="text-blue-600 dark:text-blue-400">{r.max_points} pts</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status & Actions Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    {isGraded ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Graded: {submission.score} / {assignment.total_points}
                        </span>
                      </div>
                    ) : isSubmitted ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Under Review
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        Not Submitted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {submission && (
                      <button
                        id={`view-submission-${submission.id}`}
                        onClick={() => setViewSubmissionModal(submission)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                        View Report
                      </button>
                    )}

                    <button
                      id={`upload-assignment-btn-${assignment.id}`}
                      onClick={() => {
                        setActiveAssignment(assignment);
                        setSelectedFile(null);
                        setUploadNotes('');
                        setSubmitError(null);
                      }}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      {isSubmitted ? 'Resubmit' : 'Upload Submission'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal Drawer */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Submission Portal
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveAssignment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 relative">
                <input 
                  type="file" 
                  id="assignment-file-input"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  accept=".pdf,.zip,.docx,.tar.gz,.py,.ts,.cpp,.json"
                />
                <UploadCloud className="w-10 h-10 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">Size: {selectedFile.size}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Click to browse or drag and drop file here
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports PDF, ZIP, DOCX, Code tarball (Max 50MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Submission Notes & Architectural Rationale
                </label>
                <textarea
                  id="assignment-notes-textarea"
                  rows={3}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Provide test execution commands, key design assumptions, or instructions for the evaluator..."
                  className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {submitError && (
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-submit-assignment-btn"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {submitting ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Submission & AI Report Modal */}
      {viewSubmissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Submission Feedback & Report
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {viewSubmissionModal.assignment_title}
                </h3>
              </div>
              <button
                onClick={() => setViewSubmissionModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Overview pill grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Status</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                  {viewSubmissionModal.status}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Score</span>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {viewSubmissionModal.score !== undefined ? `${viewSubmissionModal.score} / 100` : 'Pending Review'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Submitted File</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={viewSubmissionModal.file_name}>
                  {viewSubmissionModal.file_name}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Timestamp</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {new Date(viewSubmissionModal.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Trainer Notes */}
            {viewSubmissionModal.trainer_feedback && (
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Evaluator Feedback by {viewSubmissionModal.reviewed_by || 'Master Trainer'}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewSubmissionModal.trainer_feedback}
                </p>
              </div>
            )}

            {/* AI Automated Grader Report Card */}
            {viewSubmissionModal.ai_report ? (
              <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      AI Rubric Assessment ({viewSubmissionModal.ai_report.model_used || 'Gemini 2.5 Flash'})
                    </span>
                  </div>
                  <span className="text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1 rounded-full">
                    Score Estimate: {viewSubmissionModal.ai_report.score_estimate}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{viewSubmissionModal.ai_report.summary}"
                </p>

                {/* Rubric items breakdown */}
                {viewSubmissionModal.ai_report.rubric_evaluations && (
                  <div className="space-y-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                      Criteria Breakdown
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {viewSubmissionModal.ai_report.rubric_evaluations.map((re: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-200/50 dark:border-purple-800/40">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-800 dark:text-slate-200">{re.criteria}</span>
                            <span className="text-purple-600 dark:text-purple-400">{re.points}/{re.max_points} pts</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {re.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <Sparkles className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  AI grader evaluation report will be generated when instructor reviews this submission.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewSubmissionModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
