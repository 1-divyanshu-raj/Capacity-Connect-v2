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
  expires_at: number;
  trainee_details?: TraineeDetails;
  trainer_details?: TrainerDetails;
}

export interface BiometricVerificationPayload {
  email?: string;
  vector: number[];
  liveness_score: number;
  frame_count: number;
}
