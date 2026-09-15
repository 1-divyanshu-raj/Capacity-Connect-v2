-- ====================================================================
-- Capacity Connect: Production Supabase Relational Schema
-- PostgreSQL DDL + RLS Policies + Triggers + Indexes + Constraints
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('trainee', 'trainer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('active', 'pending', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'trainee',
    phone TEXT,
    organization TEXT NOT NULL,
    department TEXT NOT NULL,
    status account_status NOT NULL DEFAULT 'active',
    has_biometrics BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRAINEE SPECIFIC DATA
CREATE TABLE IF NOT EXISTS public.trainee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skills_interests TEXT[] DEFAULT '{}',
    education_level TEXT DEFAULT 'Undergraduate Degree',
    target_certifications TEXT[] DEFAULT '{}',
    enrolled_count INT NOT NULL DEFAULT 0,
    completed_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRAINER SPECIFIC DATA
CREATE TABLE IF NOT EXISTS public.trainer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expertise_areas TEXT[] DEFAULT '{}',
    years_experience INT NOT NULL DEFAULT 0,
    bio TEXT,
    qualifications TEXT,
    active_batches INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ADMIN APPROVALS TABLE
CREATE TABLE IF NOT EXISTS public.admin_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    justification TEXT NOT NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SECURE BIOMETRICS ENROLLMENT TABLE (Restricted: service-role/Edge Function access only)
CREATE TABLE IF NOT EXISTS public.biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_vector FLOAT8[] NOT NULL, -- 128-d normalized biometric embedding vector
    liveness_verified BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- 8. COURSES (TRAINING PROGRAMS)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    duration_hours INT NOT NULL DEFAULT 10,
    modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    capacity INT NOT NULL DEFAULT 50,
    enrolled_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    cover_image TEXT,
    skills_acquired TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ENROLLMENTS & PROGRESS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'dropped')),
    completed_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    completion_date TIMESTAMPTZ,
    certificate_id UUID,
    UNIQUE(user_id, course_id)
);

-- 10. ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INT NOT NULL DEFAULT 20,
    passing_score INT NOT NULL DEFAULT 70,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ASSESSMENT RESULTS
CREATE TABLE IF NOT EXISTS public.assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT false,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    grade TEXT NOT NULL DEFAULT 'Distinction',
    verification_code TEXT UNIQUE NOT NULL,
    trainer_name TEXT NOT NULL
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. AUDIT LOGS (Immutable security ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    actor_role user_role,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_trainer_id ON public.courses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_user ON public.admin_approvals(user_id, status);

-- ====================================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_courses_updated ON public.courses;
CREATE TRIGGER on_courses_updated
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_trainee_profiles_updated ON public.trainee_profiles;
CREATE TRIGGER on_trainee_profiles_updated
    BEFORE UPDATE ON public.trainee_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_trainer_profiles_updated ON public.trainer_profiles;
CREATE TRIGGER on_trainer_profiles_updated
    BEFORE UPDATE ON public.trainer_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security helper: Fetch role of executing caller
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile or admin views all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin views all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.get_current_role() = 'admin');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Biometrics Policies: Strictly restricted to service role / Edge Functions (NEVER readable directly by user tokens)
DROP POLICY IF EXISTS "Biometrics isolated to service role only" ON public.biometrics;
CREATE POLICY "Biometrics isolated to service role only"
    ON public.biometrics FOR ALL
    USING (false);

-- Courses Policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses"
    ON public.courses FOR SELECT
    USING (status = 'published' OR trainer_id = auth.uid() OR public.get_current_role() = 'admin');

DROP POLICY IF EXISTS "Trainers manage own courses" ON public.courses;
CREATE POLICY "Trainers manage own courses"
    ON public.courses FOR ALL
    USING (trainer_id = auth.uid() OR public.get_current_role() = 'admin');

-- Enrollments Policies
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
CREATE POLICY "Users view own enrollments"
    ON public.enrollments FOR SELECT
    USING (user_id = auth.uid() OR public.get_current_role() IN ('trainer', 'admin'));

DROP POLICY IF EXISTS "Trainees can enroll themselves" ON public.enrollments;
CREATE POLICY "Trainees can enroll themselves"
    ON public.enrollments FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own enrollment progress" ON public.enrollments;
CREATE POLICY "Users update own enrollment progress"
    ON public.enrollments FOR UPDATE
    USING (user_id = auth.uid() OR public.get_current_role() IN ('trainer', 'admin'));

-- Admin Approvals Policies
DROP POLICY IF EXISTS "Admins view all approvals" ON public.admin_approvals;
CREATE POLICY "Admins view all approvals"
    ON public.admin_approvals FOR SELECT
    USING (public.get_current_role() = 'admin' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins update approvals" ON public.admin_approvals;
CREATE POLICY "Admins update approvals"
    ON public.admin_approvals FOR UPDATE
    USING (public.get_current_role() = 'admin');

-- Notifications Policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid());

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.get_current_role() = 'admin');

-- ====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS SIGNUP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val public.user_role;
    account_status_val public.account_status;
BEGIN
    user_role_val := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'trainee'::public.user_role);
    
    IF user_role_val = 'admin'::public.user_role THEN
        account_status_val := 'pending'::public.account_status;
    ELSE
        account_status_val := 'active'::public.account_status;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        phone,
        organization,
        department,
        status,
        has_biometrics,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        user_role_val,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'organization', 'National Capacity Building Network'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Skills Development'),
        account_status_val,
        COALESCE((NEW.raw_user_meta_data->>'has_biometrics')::boolean, false),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();

    -- Create corresponding role profile
    IF user_role_val = 'trainee'::public.user_role THEN
        INSERT INTO public.trainee_profiles (user_id, education_level)
        VALUES (NEW.id, 'Undergraduate Degree')
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF user_role_val = 'trainer'::public.user_role THEN
        INSERT INTO public.trainer_profiles (user_id, years_experience)
        VALUES (NEW.id, 5)
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF user_role_val = 'admin'::public.user_role THEN
        INSERT INTO public.admin_approvals (user_id, status, justification)
        VALUES (NEW.id, 'pending', COALESCE(NEW.raw_user_meta_data->>'justification', 'New admin registration request'))
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();
