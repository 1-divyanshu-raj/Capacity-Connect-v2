import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Assessment, AssessmentResult, Course } from '../../types';
import confetti from 'canvas-confetti';
import { 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Trophy,
  BookOpen,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';

interface TraineeQuizzesProps {
  courses: Course[];
  onQuizCompleted?: () => void;
}

export const TraineeQuizzes: React.FC<TraineeQuizzesProps> = ({ courses, onQuizCompleted }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [myResults, setMyResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');

  // Active Playing State
  const [activeQuiz, setActiveQuiz] = useState<Assessment | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswerExplanation, setShowAnswerExplanation] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [finalScoreResult, setFinalScoreResult] = useState<{ score: number; percentage: number; passed: boolean } | null>(null);

  const fetchQuizzesAndResults = async () => {
    try {
      setLoading(true);
      const [assRes, resRes] = await Promise.all([
        api.getAssessments(selectedCourseId !== 'all' ? selectedCourseId : undefined),
        api.getAssessmentResults()
      ]);
      setAssessments(assRes.assessments || []);
      setMyResults(resRes.results || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndResults();
  }, [selectedCourseId]);

  // Quiz Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeQuiz && !quizFinished && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleCompleteQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeQuiz, quizFinished, timeRemainingSeconds]);

  const handleStartQuiz = (quiz: Assessment) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setShowAnswerExplanation(false);
    setQuizFinished(false);
    setFinalScoreResult(null);
    setTimeRemainingSeconds((quiz.time_limit_minutes || 15) * 60);
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (!activeQuiz || showAnswerExplanation) return;
    const currentQ = activeQuiz.questions[currentQuestionIdx];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIdx
    }));
  };

  const handleNextOrFinish = () => {
    if (!activeQuiz) return;
    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setShowAnswerExplanation(false);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setSubmittingQuiz(true);
      // calculate score
      let correct = 0;
      activeQuiz.questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correct_index) {
          correct += 1;
        }
      });
      const total = activeQuiz.questions.length;
      const percentage = Math.round((correct / total) * 100);
      const passed = percentage >= (activeQuiz.passing_score || 70);

      await api.submitAssessment(activeQuiz.id, selectedAnswers);

      setFinalScoreResult({
        score: correct,
        percentage,
        passed
      });
      setQuizFinished(true);

      if (passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      await fetchQuizzesAndResults();
      if (onQuizCompleted) onQuizCompleted();
    } catch (err) {
      console.error('Failed to submit quiz score:', err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Active Quiz View
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentQuestionIdx];
    const totalQuestions = activeQuiz.questions.length;
    const selectedOption = selectedAnswers[currentQ.id];

    return (
      <div id="quiz-player-screen" className="space-y-6 max-w-3xl mx-auto">
        {/* Top Navigation & Status */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Interactive Examination
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeQuiz.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 ${
              timeRemainingSeconds < 120 
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse'
                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeRemainingSeconds)}
            </div>

            <button
              onClick={() => setActiveQuiz(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Exit Quiz
            </button>
          </div>
        </div>

        {/* Finished Results Screen */}
        {quizFinished && finalScoreResult ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl shadow-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
              {finalScoreResult.passed ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">
                {finalScoreResult.passed ? 'Quiz Passed with Distinction!' : 'Quiz Attempt Finished'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {finalScoreResult.passed 
                  ? 'Congratulations! Your score has been verified and registered to your permanent trainee grade dossier.' 
                  : 'You scored below the passing threshold. Review the core concepts and attempt the quiz again.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Score</span>
                <div className="text-xl font-black text-purple-800 dark:text-purple-200">
                  {finalScoreResult.percentage}%
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Correct</span>
                <div className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {finalScoreResult.score} / {totalQuestions}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                <div className={`text-base font-black ${finalScoreResult.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {finalScoreResult.passed ? 'PASSED' : 'RETRY'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => handleStartQuiz(activeQuiz)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz
              </button>
              <button
                onClick={() => setActiveQuiz(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 transition-colors flex items-center gap-1.5"
              >
                Return to Quizzes Catalog
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Card */
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            {/* Progress Header */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>Question {currentQuestionIdx + 1} of {totalQuestions}</span>
                <span>{Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correct_index;
                let optionStyle = "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400 dark:hover:border-purple-500";

                if (showAnswerExplanation) {
                  if (isCorrect) {
                    optionStyle = "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold";
                  } else if (isSelected && !isCorrect) {
                    optionStyle = "bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200";
                  }
                } else if (isSelected) {
                  optionStyle = "bg-purple-50 dark:bg-purple-950/50 border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-200 shadow-xs";
                }

                return (
                  <button
                    key={idx}
                    id={`quiz-option-${currentQuestionIdx}-${idx}`}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={showAnswerExplanation}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs sm:text-sm ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </div>

                    {showAnswerExplanation && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    {showAnswerExplanation && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {showAnswerExplanation && currentQ.explanation && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 animate-in fade-in duration-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Engineering Insight & Explanation:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAnswerExplanation(!showAnswerExplanation)}
                disabled={selectedOption === undefined}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-40"
              >
                {showAnswerExplanation ? 'Hide Rationale' : 'Show Rationale'}
              </button>

              <button
                id="next-quiz-question-btn"
                onClick={handleNextOrFinish}
                disabled={selectedOption === undefined || submittingQuiz}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 disabled:opacity-40 transition-all flex items-center gap-2 hover:scale-102 active:scale-98"
              >
                {currentQuestionIdx < totalQuestions - 1 ? (
                  <>
                    Next Question
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    {submittingQuiz ? 'Submitting...' : 'Submit & Finish Quiz'}
                    <Award className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quizzes Catalog View
  return (
    <div id="trainee-quizzes-catalog" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/40 dark:from-purple-950/60 dark:via-indigo-950/50 dark:to-blue-950/60 border border-purple-300/30 dark:border-purple-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-400/30">
              <HelpCircle className="w-3.5 h-3.5" />
              Gamified Knowledge Assessments
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Course Quizzes & Knowledge Checks
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Test your understanding across all course modules. Instant grading with detailed technical rationale, question explanations, and permanent competence badges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-display">
                {assessments.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available Quizzes</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {myResults.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Passed Tests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-sm font-semibold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Registered Courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Passing Threshold: <strong className="text-purple-600 dark:text-purple-400">70% Minimum</strong>
        </div>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading course quizzes...
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No quizzes available for this course filter.</p>
          <p className="text-xs text-slate-500 mt-1">Please select "All Courses" or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {assessments.map((quiz) => {
            const myAttempt = myResults.find(r => r.assessment_id === quiz.id);
            const isPassed = myAttempt?.passed;

            return (
              <div 
                key={quiz.id}
                id={`quiz-card-${quiz.id}`}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      {quiz.course_title}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.duration_minutes || 15} Mins
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">
                    {quiz.description}
                  </p>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Questions: <strong className="text-slate-700 dark:text-slate-200">{quiz.questions.length}</strong>
                    </div>
                    <div>
                      Pass Score: <strong className="text-slate-700 dark:text-slate-200">{quiz.passing_score}%</strong>
                    </div>
                    <div>
                      Attempts: <strong className="text-slate-700 dark:text-slate-200">{quiz.max_attempts || 'Unlimited'}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    {isPassed ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Best Score: {myAttempt.score_percentage}%
                      </span>
                    ) : myAttempt ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        Previous Score: {myAttempt.score_percentage}%
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Not Attempted
                      </span>
                    )}
                  </div>

                  <button
                    id={`start-quiz-btn-${quiz.id}`}
                    onClick={() => handleStartQuiz(quiz)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1.5 hover:scale-102 active:scale-98"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {myAttempt ? 'Play Again' : 'Start Quiz'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
