import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, AuditLog, Course, Enrollment, Certificate } from '../src/types';

let serverSupabaseClient: SupabaseClient | null = null;

export interface SupabaseDiagnostics {
  status: 'GREEN' | 'YELLOW' | 'RED';
  configured: boolean;
  url: string | null;
  hasProjectRef: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  canConnect: boolean;
  tablesStatus: {
    profiles: boolean;
    trainee_profiles: boolean;
    trainer_profiles: boolean;
    admin_approvals: boolean;
    biometrics: boolean;
    courses: boolean;
    enrollments: boolean;
    assessments: boolean;
    certificates: boolean;
    audit_logs: boolean;
  };
  details: string;
  remediation?: string;
}

export const DEFAULT_PROJECT_URL = 'https://jxmgovsoerukppnaygjg.supabase.co';
export const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_0-Tkv3p2yXkfB9vY2l19Pw_GfpXWkql';

export function resolveProjectUrl(): string {
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return DEFAULT_PROJECT_URL;
  }
  const trimmed = rawUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (
    !trimmed ||
    trimmed === 'https://supabase.co' ||
    trimmed === 'http://supabase.co' ||
    trimmed === 'https://supabase.com' ||
    !trimmed.includes('.supabase.co')
  ) {
    return DEFAULT_PROJECT_URL;
  }
  return trimmed;
}

/**
 * Get initialized Supabase server client.
 */
export function getServerSupabase(): SupabaseClient | null {
  if (serverSupabaseClient) return serverSupabaseClient;

  const url = resolveProjectUrl();
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                 process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                 process.env.VITE_SUPABASE_ANON_KEY || 
                 process.env.SUPABASE_ANON_KEY;

  // Use valid publishable key as default
  const key = (envKey && !envKey.startsWith('sb_secret')) ? envKey : DEFAULT_PUBLISHABLE_KEY;

  if (url && key) {
    try {
      serverSupabaseClient = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      return serverSupabaseClient;
    } catch (err) {
      console.warn('[Supabase Server] Error initializing Supabase client:', err);
      return null;
    }
  }

  return null;
}


export function isSupabaseBackendConfigured(): boolean {
  const url = resolveProjectUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
              process.env.VITE_SUPABASE_ANON_KEY || 
              process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/**
 * Real-time diagnostic check for Supabase connectivity and schema status
 */
export async function getSupabaseDiagnostics(): Promise<SupabaseDiagnostics> {
  const url = resolveProjectUrl();
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                  process.env.VITE_SUPABASE_ANON_KEY || 
                  process.env.SUPABASE_ANON_KEY || 
                  null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  const hasAnon = Boolean(anonKey);
  const hasService = Boolean(serviceKey);

  // Check if URL has a specific project ref (not just generic root domain)
  // Standard Supabase URL format: https://[project-ref].supabase.co
  const isGenericDomain = url === 'https://supabase.co' || url === 'http://supabase.co';
  const hasValidProjectRef = Boolean(url && url.includes('.supabase.co') && !isGenericDomain);

  const diag: SupabaseDiagnostics = {
    status: 'RED',
    configured: Boolean(url && (hasAnon || hasService)),
    url,
    hasProjectRef: hasValidProjectRef,
    hasAnonKey: hasAnon,
    hasServiceRoleKey: hasService,
    canConnect: false,
    tablesStatus: {
      profiles: false,
      trainee_profiles: false,
      trainer_profiles: false,
      admin_approvals: false,
      biometrics: false,
      courses: false,
      enrollments: false,
      assessments: false,
      certificates: false,
      audit_logs: false
    },
    details: 'Supabase configuration uninitialized.'
  };

  if (!url || (!hasAnon && !hasService)) {
    diag.status = 'RED';
    diag.details = 'Supabase environment variables missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    return diag;
  }

  if (isGenericDomain) {
    diag.status = 'YELLOW';
    diag.details = `VITE_SUPABASE_URL is currently set to '${url}'. A specific project reference is required (e.g. 'https://<your-project-ref>.supabase.co').`;
    diag.remediation = "In your Supabase Dashboard, go to Project Settings -> API. Copy the 'Project URL' (format: https://[ref].supabase.co) and update VITE_SUPABASE_URL in Settings -> Secrets.";
    return diag;
  }

  // Attempt real query to Supabase
  const sb = getServerSupabase();
  if (!sb) {
    diag.status = 'RED';
    diag.details = 'Failed to create Supabase client instance with provided URL and key.';
    return diag;
  }

  try {
    // Check courses table which exists in user's Supabase project
    const { data: coursesData, error: coursesError } = await sb.from('courses').select('id').limit(1);

    if (!coursesError) {
      diag.canConnect = true;
      diag.tablesStatus.courses = true;
      diag.status = 'GREEN';
      diag.details = `Successfully connected to Supabase database at ${url}. Verified 'courses' table access via RLS.`;

      // Check other tables
      const checkTable = async (name: string): Promise<boolean> => {
        try {
          const res = await sb.from(name).select('id').limit(1);
          return !res.error;
        } catch {
          return false;
        }
      };

      diag.tablesStatus.profiles = await checkTable('profiles');
      diag.tablesStatus.trainee_profiles = await checkTable('trainee_profiles');
      diag.tablesStatus.trainer_profiles = await checkTable('trainer_profiles');
      diag.tablesStatus.admin_approvals = await checkTable('admin_approvals');
      diag.tablesStatus.biometrics = await checkTable('biometrics');
      diag.tablesStatus.enrollments = await checkTable('enrollments');
      diag.tablesStatus.assessments = await checkTable('assessments');
      diag.tablesStatus.certificates = await checkTable('certificates');
      diag.tablesStatus.audit_logs = await checkTable('audit_logs');
    } else {
      diag.status = 'YELLOW';
      diag.details = `Connected to API gateway, but courses query failed: ${coursesError.message}.`;
    }
  } catch (err: any) {
    diag.status = 'YELLOW';
    diag.details = `Network or handshake error connecting to ${url}: ${err.message}`;
  }


  return diag;
}

/**
 * Sync user profile to Supabase 'profiles' table if Supabase is connected.
 */
export async function syncProfileToSupabase(user: UserProfile): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || null,
      organization: user.organization,
      department: user.department,
      status: user.status,
      has_biometrics: user.has_biometrics || false,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('[Supabase Server] Upsert profile warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncProfileToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Store user biometric template in private Supabase 'biometrics' table.
 */
export async function syncBiometricToSupabase(userId: string, vector: number[], livenessVerified: boolean): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('biometrics').upsert({
      user_id: userId,
      template_vector: vector,
      liveness_verified: livenessVerified,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('[Supabase Server] Store biometric warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncBiometricToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Sync audit log entry to Supabase 'audit_logs' table.
 */
export async function syncAuditLogToSupabase(log: AuditLog): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('audit_logs').insert({
      id: log.id,
      actor_id: log.actor_id === 'anonymous' ? null : log.actor_id,
      actor_name: log.actor_name,
      actor_role: log.actor_role,
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      details: log.details || {},
      ip_address: log.ip_address || null,
      created_at: log.created_at || new Date().toISOString()
    });

    if (error) {
      console.warn('[Supabase Server] Store audit log warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncAuditLogToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Sync admin approval update to Supabase 'admin_approvals' table.
 */
export async function syncAdminApprovalToSupabase(
  approvalId: string, 
  userId: string, 
  status: 'approved' | 'rejected', 
  reviewedBy: string, 
  notes?: string
): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('admin_approvals').update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || null
    }).eq('user_id', userId);

    if (error) {
      console.warn('[Supabase Server] Update approval warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncAdminApprovalToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Sync course enrollment to Supabase 'enrollments' table
 */
export async function syncEnrollmentToSupabase(enrollment: Enrollment): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('enrollments').upsert({
      id: enrollment.id,
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      enrolled_at: enrollment.enrolled_at,
      progress_percentage: enrollment.progress_percentage,
      status: enrollment.status,
      completed_modules: enrollment.completed_modules || [],
      completion_date: enrollment.completion_date || null,
      certificate_id: enrollment.certificate_id || null
    });

    if (error) {
      console.warn('[Supabase Server] syncEnrollmentToSupabase warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncEnrollmentToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Sync trainee curriculum progress to Supabase 'enrollments' table
 */
export async function syncEnrollmentProgressToSupabase(
  userId: string,
  courseId: string,
  progressPercentage: number,
  completedModules: string[],
  status: 'in_progress' | 'completed' | 'dropped',
  completionDate?: string,
  certificateId?: string
): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const updatePayload: any = {
      progress_percentage: progressPercentage,
      completed_modules: completedModules,
      status,
      completion_date: completionDate || null
    };
    if (certificateId) {
      updatePayload.certificate_id = certificateId;
    }

    const { error } = await sb
      .from('enrollments')
      .update(updatePayload)
      .match({ user_id: userId, course_id: courseId });

    if (error) {
      console.warn('[Supabase Server] syncEnrollmentProgressToSupabase warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncEnrollmentProgressToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Sync certificate to Supabase 'certificates' table
 */
export async function syncCertificateToSupabase(cert: Certificate): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('certificates').upsert({
      id: cert.id,
      certificate_number: cert.certificate_number,
      user_id: cert.user_id,
      course_id: cert.course_id,
      issue_date: cert.issue_date,
      grade: cert.grade,
      verification_code: cert.verification_code,
      trainer_name: cert.trainer_name
    });

    if (error) {
      console.warn('[Supabase Server] syncCertificateToSupabase warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncCertificateToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Sync course to Supabase 'courses' table
 */
export async function syncCourseToSupabase(course: Course): Promise<boolean> {
  const sb = getServerSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('courses').upsert({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      trainer_id: course.trainer_id,
      duration_hours: course.duration_hours,
      modules: course.modules,
      capacity: course.capacity,
      enrolled_count: course.enrolled_count,
      status: course.status,
      cover_image: course.cover_image || null,
      skills_acquired: course.skills_acquired || [],
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('[Supabase Server] syncCourseToSupabase warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Server] syncCourseToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * Safely fetches courses from the real Supabase 'courses' table.
 * Accurately aligns database columns with frontend Course type.
 * Returns null if Supabase is unconfigured or unreachable.
 */
export async function fetchSupabaseCourses(): Promise<Course[] | null> {
  const sb = getServerSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('courses')
      .select('*');

    if (error) {
      console.warn('[Supabase Server] fetchSupabaseCourses query warning:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((c: any) => ({
      id: String(c.id),
      title: c.title || 'Untitled Course',
      description: c.description || '',
      category: c.category || 'General',
      level: c.level || 'Beginner',
      trainer_id: String(c.trainer_id || ''),
      trainer_name: c.trainer_name || 'Assigned Faculty',
      duration_hours: Number(c.duration_hours) || 10,
      capacity: Number(c.capacity) || 50,
      enrolled_count: Number(c.enrolled_count) || 0,
      status: c.status || 'published',
      cover_image: c.cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
      skills_acquired: Array.isArray(c.skills_acquired) ? c.skills_acquired : [],
      modules: Array.isArray(c.modules) ? c.modules : [],
      created_at: c.created_at || new Date().toISOString()
    }));
  } catch (err: any) {
    console.warn('[Supabase Server] fetchSupabaseCourses exception:', err?.message);
    return null;
  }
}

/**
 * Safely fetches a single course from Supabase by ID.
 */
export async function fetchSupabaseCourseById(id: string): Promise<Course | null> {
  const sb = getServerSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: String(data.id),
      title: data.title || 'Untitled Course',
      description: data.description || '',
      category: data.category || 'General',
      level: data.level || 'Beginner',
      trainer_id: String(data.trainer_id || ''),
      trainer_name: data.trainer_name || 'Assigned Faculty',
      duration_hours: Number(data.duration_hours) || 10,
      capacity: Number(data.capacity) || 50,
      enrolled_count: Number(data.enrolled_count) || 0,
      status: data.status || 'published',
      cover_image: data.cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
      skills_acquired: Array.isArray(data.skills_acquired) ? data.skills_acquired : [],
      modules: Array.isArray(data.modules) ? data.modules : [],
      created_at: data.created_at || new Date().toISOString()
    };
  } catch (err: any) {
    console.warn('[Supabase Server] fetchSupabaseCourseById exception:', err?.message);
    return null;
  }
}
