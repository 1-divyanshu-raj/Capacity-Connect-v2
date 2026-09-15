import { AuthSession, UserProfile, Course, Enrollment, Assessment, AssessmentResult, Certificate, NotificationItem, AuditLog, AdminApproval } from '../types';

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

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
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
    const res = await fetch(`${BASE_URL}/auth/login/step1`, {
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
    const res = await fetch(`${BASE_URL}/auth/login/otp/resend`, {
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
    const res = await fetch(`${BASE_URL}/auth/login/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_token, code })
    });
    return handleResponse(res);
  },

  async loginStep3(challenge_token: string, vector: number[], livenessScore: number, frameCount?: number): Promise<AuthSession & { similarity: number; message?: string }> {
    const res = await fetch(`${BASE_URL}/auth/login/step3`, {
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
    const res = await fetch(`${BASE_URL}/auth/register/otp/send`, {
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
    const res = await fetch(`${BASE_URL}/auth/register/otp/verify`, {
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
    const res = await fetch(`${BASE_URL}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    return handleResponse(res);
  },

  async verifyOtp(identifier: string, code: string): Promise<AuthSession> {
    const res = await fetch(`${BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code })
    });
    return handleResponse<AuthSession>(res);
  },

  async register(formData: any): Promise<AuthSession & { pending?: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return handleResponse<AuthSession & { pending?: boolean; message?: string }>(res);
  },

  async demoLogin(role: 'trainee' | 'trainer' | 'admin'): Promise<AuthSession> {
    const res = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return handleResponse<AuthSession>(res);
  },

  async faceLogin(vector: number[], livenessScore: number, email?: string): Promise<AuthSession & { similarity: number }> {
    const res = await fetch(`${BASE_URL}/auth/face-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector, liveness_score: livenessScore, email })
    });
    return handleResponse<AuthSession & { similarity: number }>(res);
  },

  async faceEnroll(vector: number[], livenessScore: number): Promise<{ message: string; user: UserProfile }> {
    const res = await fetch(`${BASE_URL}/auth/face-enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ vector, liveness_score: livenessScore })
    });
    return handleResponse<{ message: string; user: UserProfile }>(res);
  },

  async linkFace(email: string, vector: number[], livenessScore: number, password?: string): Promise<AuthSession & { similarity: number }> {
    const res = await fetch(`${BASE_URL}/auth/link-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, vector, liveness_score: livenessScore, password })
    });
    return handleResponse<AuthSession & { similarity: number }>(res);
  },

  async getMe(): Promise<{ user: UserProfile; trainee_details?: any; trainer_details?: any }> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async forgotPassword(email: string): Promise<{ message: string; verification_code?: string }> {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword(email: string, code: string, new_password: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
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

    const res = await fetch(`${BASE_URL}/courses?${params.toString()}`);
    return handleResponse(res);
  },

  async getCourse(id: string): Promise<{ course: Course; assessment?: Assessment }> {
    const res = await fetch(`${BASE_URL}/courses/${id}`);
    return handleResponse(res);
  },

  async createCourse(courseData: Partial<Course>): Promise<{ course: Course }> {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  async updateCourse(id: string, courseData: Partial<Course>): Promise<{ course: Course }> {
    const res = await fetch(`${BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  async deleteCourse(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Enrollments
  async getEnrollments(userId?: string): Promise<{ enrollments: Enrollment[] }> {
    const url = userId ? `${BASE_URL}/enrollments?userId=${userId}` : `${BASE_URL}/enrollments`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async enrollCourse(course_id: string): Promise<{ enrollment: Enrollment }> {
    const res = await fetch(`${BASE_URL}/enrollments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id })
    });
    return handleResponse(res);
  },

  async updateProgress(course_id: string, module_id: string): Promise<{ enrollment: Enrollment; certificate?: Certificate }> {
    const res = await fetch(`${BASE_URL}/enrollments/progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ course_id, module_id })
    });
    return handleResponse(res);
  },

  // Assessments
  async getAssessments(course_id?: string): Promise<{ assessments: Assessment[] }> {
    const url = course_id ? `${BASE_URL}/assessments?course_id=${course_id}` : `${BASE_URL}/assessments`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAssessment(id: string): Promise<{ assessment: Assessment }> {
    const res = await fetch(`${BASE_URL}/assessments/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createAssessment(data: Partial<Assessment>): Promise<{ assessment: Assessment }> {
    const res = await fetch(`${BASE_URL}/assessments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async submitAssessment(assessmentId: string, answers: Record<string, number>): Promise<{ result: AssessmentResult; assessment: Assessment }> {
    const res = await fetch(`${BASE_URL}/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers })
    });
    return handleResponse(res);
  },

  async getAssessmentResults(userId?: string): Promise<{ results: AssessmentResult[] }> {
    const url = userId ? `${BASE_URL}/assessment-results?userId=${userId}` : `${BASE_URL}/assessment-results`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Certificates
  async getCertificates(): Promise<{ certificates: Certificate[] }> {
    const res = await fetch(`${BASE_URL}/certificates`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async verifyCertificate(code: string): Promise<{ verified: boolean; certificate?: Certificate; message?: string }> {
    const res = await fetch(`${BASE_URL}/certificates/verify/${encodeURIComponent(code)}`);
    return handleResponse(res);
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    const res = await fetch(`${BASE_URL}/notifications`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin APIs
  async getAdminApprovals(): Promise<{ approvals: AdminApproval[] }> {
    const res = await fetch(`${BASE_URL}/admin/approvals`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getPendingApprovals(): Promise<{ pending_users: AdminApproval[] }> {
    const res = await fetch(`${BASE_URL}/admin/approvals`, { headers: getAuthHeaders() });
    const data: any = await handleResponse(res);
    const pending = (data.approvals || []).filter((a: AdminApproval) => a.status === 'pending');
    return { pending_users: pending };
  },

  async reviewAdminApproval(id: string, status: 'approved' | 'rejected', review_notes?: string): Promise<{ approval: AdminApproval }> {
    const res = await fetch(`${BASE_URL}/admin/approvals/${id}/review`, {
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
    const res = await fetch(`${BASE_URL}/admin/users`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminUsers(): Promise<{ users: UserProfile[] }> {
    return this.getAllUsers();
  },

  async updateUserStatus(id: string, status: string): Promise<{ user: UserProfile }> {
    const res = await fetch(`${BASE_URL}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async getAuditLogs(limit?: number): Promise<{ logs: AuditLog[] }> {
    const url = limit ? `${BASE_URL}/admin/audit-logs?limit=${limit}` : `${BASE_URL}/admin/audit-logs`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAdminStats(): Promise<{ stats: any }> {
    const res = await fetch(`${BASE_URL}/admin/stats`, { headers: getAuthHeaders() });
    return handleResponse(res);
  }
};
