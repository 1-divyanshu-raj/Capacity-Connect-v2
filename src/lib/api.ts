import { 
  AuthSession, 
  UserProfile, 
  Course, 
  Enrollment, 
  Assessment, 
  AssessmentResult, 
  Certificate, 
  NotificationItem, 
  AuditLog, 
  AdminApproval,
  Assignment,
  AssignmentSubmission,
  ExperimentVideo,
  TraineeProfileDetails,
  TrainerProfileDetails,
  SkillGapData
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cc_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(url: string, options: RequestInit = {}, retries = 1): Promise<Response> {
  try {
    const res = await window.fetch(url, options);
    // If the server or reverse proxy is momentarily reloading (502/503/504), retry once after a short delay
    if ((res.status === 502 || res.status === 503 || res.status === 504) && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return apiFetch(url, options, retries - 1);
    }
    return res;
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return apiFetch(url, options, retries - 1);
    }
    throw err;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  // Handle non-JSON or HTML responses (such as proxy error pages)
  if (data === null) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Server connection was interrupted. Please try again in a moment.');
    }
    if (res.status === 404) {
      throw new Error('API service endpoint not found.');
    }
    const rawText = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(rawText.slice(0, 120) || `Request failed with status ${res.status}`);
    }
    throw new Error('Server returned an unexpected non-JSON response.');
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

function getFallbackDemoSession(role: 'trainee' | 'trainer' | 'admin'): AuthSession {
  if (role === 'trainee') {
    return {
      message: 'Logged in as Demo TRAINEE: Alex Rivera',
      token: 'demo-token-trainee-' + Date.now(),
      user: {
        id: 'usr-trainee-001',
        email: 'alex.trainee@capacityconnect.org',
        full_name: 'Alex Rivera',
        role: 'trainee',
        phone: '+91 99555 66778',
        organization: 'Indian National Centre for Ocean Information Services (INCOIS), MoES',
        department: 'Ocean Observation & Computational Modeling Wing',
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        has_biometrics: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      trainee_details: {
        id: 'trn-001',
        user_id: 'usr-trainee-001',
        skills_interests: ['Operational Oceanography', 'Argo Float Telemetry', 'Tsunami Warning Systems', 'Numerical Ocean Modeling', 'Python/GIS'],
        education_level: 'M.Sc. in Oceanography & Marine Geosciences',
        target_certifications: ['INCOIS Ocean State Forecaster', 'Deep Ocean Mission Submersible Systems Specialist'],
        enrolled_count: 2,
        completed_count: 1
      }
    };
  } else if (role === 'trainer') {
    return {
      message: 'Logged in as Demo TRAINER: Dr. Rajesh Sharma',
      token: 'demo-token-trainer-' + Date.now(),
      user: {
        id: 'usr-trainer-001',
        email: 'dr.sharma@capacityconnect.org',
        full_name: 'Dr. Rajesh Sharma',
        role: 'trainer',
        phone: '+91 98111 22334',
        organization: 'Centre for Development of Advanced Computing (C-DAC)',
        department: 'Cloud Systems & High Performance Computing',
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        has_biometrics: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      trainer_details: {
        id: 'trn-inst-001',
        user_id: 'usr-trainer-001',
        expertise_areas: ['Enterprise Cloud', 'Kubernetes Orchestration', 'Generative AI Systems', 'Zero-Trust Architecture'],
        years_experience: 16,
        bio: 'Distinguished scientist and enterprise systems architect leading state and central digital capability modernization frameworks.',
        qualifications: 'Ph.D. in Computer Science & Distributed Systems (IIT Bombay)',
        active_batches: 3
      }
    };
  } else {
    return {
      message: 'Logged in as Demo ADMIN: Sarah Chen',
      token: 'demo-token-admin-' + Date.now(),
      user: {
        id: 'usr-admin-001',
        email: 'sarah.admin@capacityconnect.org',
        full_name: 'Sarah Chen',
        role: 'admin',
        phone: '+91 98765 43210',
        organization: 'National Capacity Building & Skill Development Mission',
        department: 'Executive Governance & Certification Directorate',
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
        has_biometrics: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<AuthSession> {
    const res = await apiFetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse<AuthSession>(res);
  },

  // 3-Step Login Verification Pipeline
  async loginStep1(email: string, password: string, role: string): Promise<{
    message: string;
    challenge_token: string;
    step: number;
    user: { id: string; full_name: string; email: string; role: string; has_biometrics: boolean };
    masked_email: string;
    masked_phone: string;
    active_channel: 'email' | 'phone';
    demo_code?: string;
    expires_in_seconds: number;
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/login/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return handleResponse(res);
  },

  async resendLoginOtp(challenge_token: string, channel: 'email' | 'phone'): Promise<{
    message: string;
    masked_destination: string;
    demo_code?: string;
    expires_in_seconds: number;
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/login/otp/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_token, channel })
    });
    return handleResponse(res);
  },

  async loginStep2(challenge_token: string, code: string): Promise<{
    message: string;
    challenge_token: string;
    step: number;
    user: { id: string; full_name: string; email: string; role: string; has_biometrics: boolean };
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/login/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_token, code })
    });
    return handleResponse(res);
  },

  async loginStep3(challenge_token: string, vector: number[], livenessScore: number, frameCount?: number): Promise<AuthSession & { similarity: number; message?: string }> {
    const res = await apiFetch(`${BASE_URL}/auth/login/step3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        challenge_token, 
        vector, 
        liveness_score: livenessScore, 
        frame_count: frameCount 
      })
    });
    return handleResponse<AuthSession & { similarity: number; message?: string }>(res);
  },

  // Registration Contact OTP
  async sendRegisterOtp(identifier: string, channel: 'email' | 'phone'): Promise<{
    message: string;
    masked_destination: string;
    demo_code?: string;
    expires_in_seconds: number;
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/register/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, channel })
    });
    return handleResponse(res);
  },

  async verifyRegisterOtp(identifier: string, code: string): Promise<{
    message: string;
    otp_verified_token: string;
    verified_contact: string;
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/register/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code })
    });
    return handleResponse(res);
  },

  // OTP Verification
  async sendOtp(identifier: string): Promise<{
    message: string;
    masked_destination: string;
    demo_code?: string;
    expires_in_seconds: number;
    target_user_name?: string;
    role?: string;
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    return handleResponse(res);
  },

  async verifyOtp(identifier: string, code: string): Promise<AuthSession> {
    const res = await apiFetch(`${BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code })
    });
    return handleResponse<AuthSession>(res);
  },

  async register(formData: any): Promise<AuthSession & { pending?: boolean; message?: string }> {
    const res = await apiFetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return handleResponse<AuthSession & { pending?: boolean; message?: string }>(res);
  },

  async demoLogin(role: 'trainee' | 'trainer' | 'admin'): Promise<AuthSession> {
    try {
      const res = await apiFetch(`${BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      return await handleResponse<AuthSession>(res);
    } catch (err: any) {
      console.warn('[DemoLogin] Live server response encountered an issue, initializing offline demo session:', err);
      return getFallbackDemoSession(role);
    }
  },

  async faceLogin(vector: number[], livenessScore: number, email?: string): Promise<AuthSession & { similarity: number }> {
    const res = await apiFetch(`${BASE_URL}/auth/face-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector, liveness_score: livenessScore, email })
    });
    return handleResponse<AuthSession & { similarity: number }>(res);
  },

  async faceEnroll(vector: number[], livenessScore: number): Promise<{ message: string; user: UserProfile }> {
    const res = await apiFetch(`${BASE_URL}/auth/face-enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ vector, liveness_score: livenessScore })
    });
    return handleResponse<{ message: string; user: UserProfile }>(res);
  },

  async linkFace(email: string, vector: number[], livenessScore: number, password?: string): Promise<AuthSession & { similarity: number }> {
    const res = await apiFetch(`${BASE_URL}/auth/link-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, vector, liveness_score: livenessScore, password })
    });
    return handleResponse<AuthSession & { similarity: number }>(res);
  },

  async getMe(): Promise<{ user: UserProfile; trainee_details?: any; trainer_details?: any }> {
    const res = await apiFetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async verifyPassword(password: string): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`${BASE_URL}/auth/verify-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password })
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async updateProfile(profileData: Partial<UserProfile> & {
    education_level?: string;
    skills_interests?: string[];
    target_certifications?: string[];
    bio?: string;
    qualifications?: string;
    expertise_areas?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    user: UserProfile;
    trainee_details?: any;
    trainer_details?: any;
  }> {
    const res = await apiFetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async forgotPassword(email: string): Promise<{ message: string; verification_code?: string }> {
    const res = await apiFetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword(email: string, code: string, new_password: string): Promise<{ message: string }> {
    const res = await apiFetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password })
    });
    return handleResponse(res);
  },

  // Courses
  async getCourses(filters?: { category?: string; level?: string; search?: string }): Promise<{ courses: Course[] }> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.level) params.set('level', filters.level);
    if (filters?.search) params.set('search', filters.search);

    const res = await apiFetch(`${BASE_URL}/courses?${params.toString()}`);
    return handleResponse(res);
  },

  async getCourse(id: string): Promise<{ course: Course; assessment?: Assessment }> {
    const res = await apiFetch(`${BASE_URL}/courses/${id}`);
    return handleResponse(res);
  },

  async createCourse(courseData: Partial<Course>): Promise<{ course: Course }> {
    const res = await apiFetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  async updateCourse(id: string, courseData: Partial<Course>): Promise<{ course: Course }> {
    const res = await apiFetch(`${BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  async deleteCourse(id: string): Promise<{ message: string }> {
    const res = await apiFetch(`${BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Enrollments
  async getEnrollments(userId?: string): Promise<{ enrollments: Enrollment[] }> {
    const url = userId ? `${BASE_URL}/enrollments?userId=${userId}` : `${BASE_URL}/enrollments`;
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async enrollCourse(course_id: string): Promise<{ enrollment: Enrollment }> {
    const res = await apiFetch(`${BASE_URL}/enrollments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id })
    });
    return handleResponse(res);
  },

  async updateProgress(course_id: string, module_id: string): Promise<{ enrollment: Enrollment; certificate?: Certificate }> {
    const res = await apiFetch(`${BASE_URL}/enrollments/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id, module_id })
    });
    return handleResponse(res);
  },

  // Assessments
  async getAssessments(course_id?: string): Promise<{ assessments: Assessment[] }> {
    const url = course_id ? `${BASE_URL}/assessments?course_id=${course_id}` : `${BASE_URL}/assessments`;
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAssessment(id: string): Promise<{ assessment: Assessment }> {
    const res = await apiFetch(`${BASE_URL}/assessments/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createAssessment(data: Partial<Assessment>): Promise<{ assessment: Assessment }> {
    const res = await apiFetch(`${BASE_URL}/assessments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async submitAssessment(assessmentId: string, answers: Record<string, number>): Promise<{ result: AssessmentResult; assessment: Assessment }> {
    const res = await apiFetch(`${BASE_URL}/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers })
    });
    return handleResponse(res);
  },

  async getAssessmentResults(userId?: string): Promise<{ results: AssessmentResult[] }> {
    const url = userId ? `${BASE_URL}/assessment-results?userId=${userId}` : `${BASE_URL}/assessment-results`;
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Certificates
  async getCertificates(): Promise<{ certificates: Certificate[] }> {
    const res = await apiFetch(`${BASE_URL}/certificates`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async verifyCertificate(code: string): Promise<{ verified: boolean; certificate?: Certificate; message?: string }> {
    const res = await apiFetch(`${BASE_URL}/certificates/verify/${encodeURIComponent(code)}`);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    const res = await apiFetch(`${BASE_URL}/notifications`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await apiFetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin APIs
  async getAdminApprovals(): Promise<{ approvals: AdminApproval[] }> {
    const res = await apiFetch(`${BASE_URL}/admin/approvals`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getPendingApprovals(): Promise<{ pending_users: AdminApproval[] }> {
    const res = await apiFetch(`${BASE_URL}/admin/approvals`, { headers: getAuthHeaders() });
    const data: any = await handleResponse(res);
    const pending = (data.approvals || []).filter((a: AdminApproval) => a.status === 'pending');
    return { pending_users: pending };
  },

  async reviewAdminApproval(id: string, status: 'approved' | 'rejected', review_notes?: string): Promise<{ approval: AdminApproval }> {
    const res = await apiFetch(`${BASE_URL}/admin/approvals/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, review_notes })
    });
    return handleResponse(res);
  },

  async reviewPendingAdmin(id: string, status: 'approved' | 'rejected', review_notes?: string): Promise<{ approval: AdminApproval }> {
    return this.reviewAdminApproval(id, status, review_notes);
  },

  async getAllUsers(): Promise<{ users: UserProfile[] }> {
    const res = await apiFetch(`${BASE_URL}/admin/users`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminUsers(): Promise<{ users: UserProfile[] }> {
    return this.getAllUsers();
  },

  async updateUserStatus(id: string, status: string): Promise<{ user: UserProfile }> {
    const res = await apiFetch(`${BASE_URL}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async getAuditLogs(limit?: number): Promise<{ logs: AuditLog[] }> {
    const url = limit ? `${BASE_URL}/admin/audit-logs?limit=${limit}` : `${BASE_URL}/admin/audit-logs`;
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminStats(): Promise<{ stats: any }> {
    const res = await apiFetch(`${BASE_URL}/admin/stats`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Assignments & Submissions
  async getAssignments(courseId?: string): Promise<{ assignments: Assignment[] }> {
    const url = courseId ? `${BASE_URL}/assignments?course_id=${encodeURIComponent(courseId)}` : `${BASE_URL}/assignments`;
    const res = await apiFetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAssignment(id: string): Promise<{ assignment: Assignment }> {
    const res = await apiFetch(`${BASE_URL}/assignments/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createAssignment(data: Partial<Assignment>): Promise<{ assignment: Assignment }> {
    const res = await apiFetch(`${BASE_URL}/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getSubmissions(params?: { userId?: string; assignmentId?: string; courseId?: string }): Promise<{ submissions: AssignmentSubmission[] }> {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.assignmentId) query.append('assignmentId', params.assignmentId);
    if (params?.courseId) query.append('courseId', params.courseId);
    const qs = query.toString();
    const res = await apiFetch(`${BASE_URL}/submissions${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async submitAssignment(data: {
    assignment_id: string;
    file_name: string;
    file_size?: string;
    file_type?: string;
    file_content?: string;
    notes?: string;
  }): Promise<{ submission: AssignmentSubmission }> {
    const res = await apiFetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async gradeSubmission(id: string, data: { score: number; trainer_feedback?: string }): Promise<{ submission: AssignmentSubmission }> {
    const res = await apiFetch(`${BASE_URL}/submissions/${id}/grade`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async generateAiGraderReport(id: string): Promise<{ submission: AssignmentSubmission; ai_report: any }> {
    const res = await apiFetch(`${BASE_URL}/submissions/${id}/ai-grade`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Experiment Videos
  async getExperiments(params?: { userId?: string; courseId?: string; status?: string }): Promise<{ experiments: ExperimentVideo[] }> {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.courseId) query.append('courseId', params.courseId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    const res = await apiFetch(`${BASE_URL}/experiments${qs ? `?${qs}` : ''}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getExperiment(id: string): Promise<{ experiment: ExperimentVideo }> {
    const res = await apiFetch(`${BASE_URL}/experiments/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async uploadExperiment(data: {
    course_id: string;
    title: string;
    description: string;
    video_url?: string;
    video_format: string;
    duration_seconds?: number;
    lab_parameters?: string;
  }): Promise<{ experiment: ExperimentVideo }> {
    const res = await apiFetch(`${BASE_URL}/experiments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async gradeExperiment(id: string, data: {
    score?: number;
    status: 'approved' | 'revision_needed' | 'under_review';
    trainer_feedback?: string;
  }): Promise<{ experiment: ExperimentVideo }> {
    const res = await apiFetch(`${BASE_URL}/experiments/${id}/grade`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Admin Profiles & Skill Gap Analytics
  async getAdminTraineeProfiles(): Promise<{ trainees: TraineeProfileDetails[] }> {
    const res = await apiFetch(`${BASE_URL}/admin/trainee-profiles`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminTrainees(): Promise<{ trainees: TraineeProfileDetails[] }> {
    return this.getAdminTraineeProfiles();
  },

  async getAdminTrainerProfiles(): Promise<{ trainers: TrainerProfileDetails[] }> {
    const res = await apiFetch(`${BASE_URL}/admin/trainer-profiles`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminTrainers(): Promise<{ trainers: TrainerProfileDetails[] }> {
    return this.getAdminTrainerProfiles();
  },

  async getAdminSkillGaps(): Promise<SkillGapData> {
    const res = await apiFetch(`${BASE_URL}/admin/skill-gaps`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminAnalytics(): Promise<SkillGapData> {
    return this.getAdminSkillGaps();
  }
};
