/**
 * Capacity Connect - Core Data Types & Enums
 */

export type UserRole = 'trainee' | 'trainer' | 'admin';

export type AccountStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  organization: string;
  department: string;
  status: AccountStatus;
  avatar_url?: string;
  has_biometrics?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TraineeDetails {
  id?: string;
  user_id: string;
  skills_interests: string[];
  education_level: string;
  target_certifications: string[];
  enrolled_count: number;
  completed_count: number;
}

export interface TrainerDetails {
  id?: string;
  user_id: string;
  expertise_areas: string[];
  years_experience: number;
  bio: string;
  qualifications: string;
  active_batches: number;
}

export interface AdminApproval {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  justification: string;
  review_notes?: string;
  user_email: string;
  user_name: string;
  organization: string;
}

export interface CourseModule {
  id: string;
  title: string;
  duration_minutes: number;
  type: 'video' | 'reading' | 'practical' | 'assignment';
  content: string;
  completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  trainer_id: string;
  trainer_name?: string;
  duration_hours: number;
  modules: CourseModule[];
  capacity: number;
  enrolled_count: number;
  status: 'published' | 'draft' | 'archived';
  cover_image?: string;
  skills_acquired: string[];
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  course?: Course;
  enrolled_at: string;
  progress_percentage: number;
  status: 'in_progress' | 'completed' | 'dropped';
  completed_modules: string[];
  completion_date?: string;
  certificate_id?: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  course_title?: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  rubric?: { criteria: string; max_points: number; description?: string }[];
  attachment_url?: string;
  created_at: string;
}

export interface AiGraderReport {
  score_estimate: number;
  rubric_evaluations: {
    criteria: string;
    points: number;
    max_points: number;
    reasoning: string;
  }[];
  key_strengths: string[];
  areas_for_improvement: string[];
  summary: string;
  graded_at: string;
  model_used?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  course_id: string;
  course_title?: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  submitted_at: string;
  file_name: string;
  file_size: string;
  file_type: string;
  file_content?: string;
  notes: string;
  status: 'submitted' | 'grading' | 'graded' | 'resubmit_requested';
  score?: number;
  trainer_feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  ai_report?: AiGraderReport;
}

export interface ExperimentVideo {
  id: string;
  course_id: string;
  course_title?: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  title: string;
  description: string;
  video_url: string;
  video_format: 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv';
  duration_seconds: number;
  lab_parameters?: string;
  status: 'under_review' | 'approved' | 'revision_needed';
  score?: number;
  trainer_feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface TraineeProfileDetails extends UserProfile {
  name?: string;
  grade_level?: string;
  overall_gpa?: number;
  overall_progress_percentage?: number;
  attendance_percentage?: number;
  state?: string;
  specializations?: string[];
  enrolled_courses?: {
    course_id: string;
    course_title: string;
    attendance_count: number;
    status: string;
    progress: number;
  }[];
  skills_interests: string[];
  education_level: string;
  target_certifications: string[];
  enrolled_count: number;
  completed_count: number;
  average_grade: number;
  grade_letter: string;
  gpa: number;
  completed_quizzes_count: number;
  average_quiz_score: number;
  assignments_submitted_count: number;
  experiments_approved_count: number;
  skill_breakdown: { skill: string; proficiency: number }[];
  recent_activity: { action: string; timestamp: string; details?: string }[];
}

export interface TrainerProfileDetails extends UserProfile {
  name?: string;
  specializations?: string[];
  rating?: number;
  expertise_areas: string[];
  years_experience: number;
  bio: string;
  qualifications: string;
  active_batches: number;
  total_students_trained: number;
  average_satisfaction_rating: number;
  assignments_graded_count: number;
  experiments_reviewed_count: number;
  courses_taught: string[];
  specialization_badges: string[];
}

export interface SkillGapMetric {
  field: string;
  category: string;
  demand_index: number; // 0-100
  supply_index: number; // 0-100
  gap_percentage: number;
  priority_level: 'Critical' | 'High' | 'Moderate';
  annual_talent_deficit: number;
  growth_rate: number;
}

export interface RegionalSkillGap {
  region_id: string;
  region_name: string;
  states_covered: string[];
  primary_hubs: string[];
  overall_gap_index: number;
  total_talent_demand: number;
  current_certified_workforce: number;
  top_deficit_field: string;
  training_centers_count: number;
  field_breakdowns: { field: string; demand: number; supply: number; gap: number }[];
}

export interface SkillGapData {
  national_summary: {
    total_talent_demand: number;
    current_workforce: number;
    average_gap_percentage: number;
    highest_deficit_sector: string;
    fastest_growing_sector: string;
  };
  fields: SkillGapMetric[];
  regions: RegionalSkillGap[];
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Assessment {
  id: string;
  course_id: string;
  course_title?: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  questions: AssessmentQuestion[];
  created_at: string;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  course_id: string;
  course_title?: string;
  user_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  submitted_at: string;
  answers: Record<string, number>;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  user_name: string;
  course_id: string;
  course_title: string;
  issue_date: string;
  grade: string;
  verification_code: string;
  trainer_name: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expires_at?: number;
  message?: string;
  trainee_details?: TraineeDetails;
  trainer_details?: TrainerDetails;
}

export interface BiometricVerificationPayload {
  email?: string;
  vector: number[];
  liveness_score: number;
  frame_count: number;
}

export type IndiaSkillGapArea = RegionalSkillGap;
export type SkillGapField = SkillGapMetric;
export type TraineeProfileDossier = TraineeProfileDetails;
export type TrainerProfileDossier = TrainerProfileDetails;

