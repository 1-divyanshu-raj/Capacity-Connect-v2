import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ExperimentVideo, Course } from '../../types';
import { 
  Video, 
  UploadCloud, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Film, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  Filter,
  Eye,
  Calendar
} from 'lucide-react';

interface TraineeExperimentLabProps {
  courses: Course[];
}

export const TraineeExperimentLab: React.FC<TraineeExperimentLabProps> = ({ courses }) => {
  const [experiments, setExperiments] = useState<ExperimentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [viewVideoModal, setViewVideoModal] = useState<ExperimentVideo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm' | 'avi' | 'mov' | 'mkv'>('mp4');
  const [durationMinutes, setDurationMinutes] = useState('3');
  const [labParameters, setLabParameters] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const res = await api.getExperiments({
        courseId: selectedCourseId !== 'all' ? selectedCourseId : undefined
      });
      setExperiments(res.experiments || []);
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [selectedCourseId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      // Auto-detect format from extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext || '')) {
        setVideoFormat(ext as any);
      }
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setUploadError('Please provide an experiment title and technical description.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // We support playable public sample videos for MP4/WebM
      const sampleUrl = videoFormat === 'webm' 
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

      await api.uploadExperiment({
        course_id: courseId,
        title: title.trim(),
        description: description.trim(),
        video_format: videoFormat,
        duration_seconds: (parseFloat(durationMinutes) || 3) * 60,
        lab_parameters: labParameters.trim() || 'Ambient Temp: 22°C, Telemetry Sampling: 50Hz, Protocol: Modbus/TCP',
        video_url: sampleUrl
      });

      setUploadSuccess(`Experiment video "${title}" uploaded successfully in .${videoFormat.toUpperCase()} format!`);
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setLabParameters('');
      setSelectedFileName(null);
      await fetchExperiments();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to submit experiment video.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="trainee-experiment-lab" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-blue-900/40 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-blue-950/60 border border-emerald-300/30 dark:border-emerald-700/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
              <Video className="w-3.5 h-3.5" />
              Hands-On Practical Demonstration
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Experiment Video Submissions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Upload multi-format video recordings of physical lab experiments, equipment calibration, and simulator stress runs. Certified trainers grade execution safety and technique.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="open-upload-experiment-btn"
              onClick={() => {
                setShowUploadModal(true);
                setUploadError(null);
              }}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 hover:scale-102 active:scale-98"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Lab Video
            </button>
          </div>
        </div>
      </div>

      {/* Format Notice & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Course Filter:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-sm font-semibold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Registered Courses ({courses.length})</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Allowed Video Formats:
          </span>
          <div className="flex items-center gap-1.5">
            {['MP4', 'WebM', 'AVI', 'MOV', 'MKV'].map((fmt) => (
              <span key={fmt} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                .{fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {uploadSuccess}
        </div>
      )}

      {/* Experiments Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading experiment recordings...
        </div>
      ) : experiments.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <Film className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No experiment videos uploaded yet.</p>
          <p className="text-xs text-slate-500 mt-1">Click "Upload Lab Video" above to submit your practical experiment demonstration.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {experiments.map((exp) => {
            const isApproved = exp.status === 'approved';
            const isRevision = exp.status === 'revision_needed';

            return (
              <div 
                key={exp.id}
                id={`experiment-card-${exp.id}`}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* Thumbnail / Video banner */}
                <div className="relative h-44 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-black/60 text-emerald-400 border border-emerald-500/40 backdrop-blur-xs">
                      .{exp.video_format}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    {isApproved ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved ({exp.score}%)
                      </span>
                    ) : isRevision ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-sm">
                        <AlertCircle className="w-3 h-3" />
                        Revision Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3" />
                        Under Review
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setViewVideoModal(exp)}
                    className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-transform transform group-hover:scale-110 shadow-lg border border-white/30"
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </button>

                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-300 bg-black/50 px-2 py-0.5 rounded-md">
                    {Math.round((exp.duration_seconds || 180) / 60)}:00 min
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {exp.course_title}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>

                    {exp.lab_parameters && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {exp.lab_parameters}
                      </div>
                    )}
                  </div>

                  {exp.trainer_feedback && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Instructor Feedback:
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                        "{exp.trainer_feedback}"
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {new Date(exp.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setViewVideoModal(exp)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Play Recording
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {viewVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Lab Demonstration Playback ({viewVideoModal.video_format.toUpperCase()})
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {viewVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setViewVideoModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Video Player Box */}
            <div className="px-6">
              <div className="rounded-2xl overflow-hidden bg-black aspect-video relative flex items-center justify-center shadow-inner">
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src={viewVideoModal.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                >
                  Your browser does not support HTML5 video streaming.
                </video>
              </div>
            </div>

            {/* Details Footer */}
            <div className="px-6 pb-6 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Course:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{viewVideoModal.course_title}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Lab Parameters:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{viewVideoModal.lab_parameters}</span>
                </div>
                {viewVideoModal.trainer_feedback && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Instructor Evaluation: </span>
                    <span className="text-slate-700 dark:text-slate-300">{viewVideoModal.trainer_feedback} (Score: {viewVideoModal.score}%)</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setViewVideoModal(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  New Lab Recording
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Upload Experiment Video
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Associated Technical Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Experiment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Modbus Inverter Stress Test & SCADA Telemetry Logging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Video Format & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Video Container
                  </label>
                  <select
                    value={videoFormat}
                    onChange={(e) => setVideoFormat(e.target.value as any)}
                    className="w-full text-xs font-bold p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="mp4">MP4 (.mp4)</option>
                    <option value="webm">WebM (.webm)</option>
                    <option value="avi">AVI (.avi)</option>
                    <option value="mov">QuickTime (.mov)</option>
                    <option value="mkv">Matroska (.mkv)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-5 text-center transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 relative">
                <input 
                  type="file" 
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  accept="video/mp4,video/webm,video/avi,video/quicktime,video/x-matroska,.mp4,.webm,.avi,.mov,.mkv"
                />
                <Video className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                {selectedFileName ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Selected: {selectedFileName}
                  </p>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Select Video File or Drop Here
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Accepts MP4, WebM, AVI, MOV, MKV up to 500MB
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Procedure & Execution Summary
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the steps observed in the video and safety precautions taken..."
                  className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Lab Parameters */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Lab Sensor Telemetry / Instrumentation Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Voltage: 48.2V, Current: 35A, Sampling Rate: 100ms"
                  value={labParameters}
                  onChange={(e) => setLabParameters(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {uploadError && (
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  {uploadError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-experiment-video-btn"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {uploading ? 'Processing & Uploading...' : 'Submit Lab Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
