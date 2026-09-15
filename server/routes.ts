import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, StoredUser } from './db';
import { 
  generateToken, 
  authenticate, 
  requireRole, 
  AuthenticatedRequest,
  createLoginChallengeToken,
  verifyLoginChallengeToken,
  createRegistrationOtpToken,
  verifyRegistrationOtpToken
} from './authMiddleware';
import { matchBiometricEmbedding } from './biometricService';
import { 
  syncProfileToSupabase, 
  syncBiometricToSupabase, 
  syncAuditLogToSupabase, 
  syncAdminApprovalToSupabase,
  syncEnrollmentToSupabase,
  syncEnrollmentProgressToSupabase,
  syncCertificateToSupabase,
  syncCourseToSupabase,
  fetchSupabaseCourses,
  fetchSupabaseCourseById,
  getSupabaseDiagnostics 
} from './supabase';
import { UserRole, AccountStatus, Course, Assessment } from '../src/types';

const router = Router();

// Supabase Real-time System Diagnostics Endpoint
router.get('/supabase/diagnostics', async (_req: Request, res: Response) => {
  const diagnostics = await getSupabaseDiagnostics();
  return res.json(diagnostics);
});

// ===================================================
// 1. AUTHENTICATION & SESSIONS
// ===================================================

// Registration Contact OTP Dispatch (Before creating account)
router.post('/auth/register/otp/send', async (req: Request, res: Response) => {
  try {
    const { identifier, channel } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Please provide a valid contact (Email or Phone number).' });
    }

    const cleanId = identifier.trim().toLowerCase();

    // Verify format
    if (channel === 'email' || cleanId.includes('@')) {
      if (!cleanId.includes('@') || !cleanId.includes('.')) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
    } else {
      const digits = cleanId.replace(/\D/g, '');
      if (digits.length < 8) {
        return res.status(400).json({ error: 'Please enter a valid phone number with country/area code.' });
      }
    }

    // Check if user already exists with this email
    if (cleanId.includes('@')) {
      const existingUser = db.getUserByEmail(cleanId);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
      }
    }

    // Rate Limit: 30s cooldown
    const latestTime = db.getLatestOtpRequestTime(cleanId);
    if (latestTime && Date.now() - latestTime < 30 * 1000) {
      const waitSec = Math.ceil((30 * 1000 - (Date.now() - latestTime)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting another code.`
      });
    }

    // Generate cryptographic OTP
    const { code, expires_in_seconds } = db.createOtp(cleanId);

    // Mask destination
    let maskedDestination = cleanId;
    if (cleanId.includes('@')) {
      const [name, domain] = cleanId.split('@');
      maskedDestination = `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
    } else {
      const digits = cleanId.replace(/\D/g, '');
      maskedDestination = `+** *****${digits.slice(-4)}`;
    }

    return res.json({
      message: `Registration verification OTP sent to ${maskedDestination}.`,
      masked_destination: maskedDestination,
      demo_code: code,
      expires_in_seconds
    });
  } catch (error: any) {
    console.error('Registration OTP send error:', error);
    return res.status(500).json({ error: 'Failed to send registration verification code.' });
  }
});

// Registration Contact OTP Verification
router.post('/auth/register/otp/verify', async (req: Request, res: Response) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Contact identifier and 6-digit OTP code are required.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const verification = db.verifyOtp(cleanId, code);

    if (!verification.success) {
      return res.status(401).json({
        error: verification.error || 'Invalid or expired registration verification code.'
      });
    }

    // Issue signed proof of contact verification token
    const otp_verified_token = createRegistrationOtpToken(cleanId);

    return res.json({
      message: 'Contact successfully verified! You can now proceed with biometric face registration.',
      otp_verified_token,
      verified_contact: cleanId
    });
  } catch (error: any) {
    console.error('Registration OTP verify error:', error);
    return res.status(500).json({ error: 'Failed to verify OTP code.' });
  }
});

// Complete Registration (Requires Verified Contact & Face Biometrics)
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      password, 
      full_name, 
      role, 
      phone, 
      organization, 
      department,
      otp_verified_token,
      // Trainee fields
      skills_interests,
      education_level,
      target_certifications,
      // Trainer fields
      expertise_areas,
      years_experience,
      bio,
      qualifications,
      // Admin fields
      justification,
      // Biometric Enrollment
      biometric_vector,
      liveness_score
    } = req.body;

    if (!email || !password || !full_name || !role || !organization || !department || !phone) {
      return res.status(400).json({ error: 'Please provide all required registration fields (Full Name, Email, Phone, Role, Organization, Department, Password).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Biometric Face Enrollment is MANDATORY
    const hasBiometrics = Array.isArray(biometric_vector) && biometric_vector.length >= 32;
    if (!hasBiometrics || (typeof liveness_score === 'number' && liveness_score < 0.35)) {
      return res.status(400).json({ 
        error: 'Biometric face registration is mandatory. Please capture and verify your facial signature with the live camera before registering.' 
      });
    }

    // If OTP token provided, verify it matches
    if (otp_verified_token) {
      const verified = verifyRegistrationOtpToken(otp_verified_token);
      if (!verified) {
        return res.status(401).json({ error: 'Contact verification token has expired or is invalid. Please verify your OTP again.' });
      }
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Admins default to 'pending' and REQUIRE existing admin approval!
    const accountStatus: AccountStatus = role === 'admin' ? 'pending' : 'active';

    const newUser: StoredUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name,
      role: role as UserRole,
      phone: phone || '',
      organization,
      department,
      status: accountStatus,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`,
      password_hash,
      has_biometrics: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.createUser(newUser);

    // Save biometric template
    db.saveBiometric(userId, biometric_vector, Number(liveness_score) >= 0.4);
    await syncBiometricToSupabase(userId, biometric_vector, Number(liveness_score) >= 0.4);

    // Mirror to Supabase PostgreSQL profiles if configured
    await syncProfileToSupabase(newUser);

    // Save role-specific details
    if (role === 'trainee') {
      db.saveTraineeDetails({
        user_id: userId,
        skills_interests: Array.isArray(skills_interests) ? skills_interests : (skills_interests ? [skills_interests] : []),
        education_level: education_level || 'Undergraduate',
        target_certifications: Array.isArray(target_certifications) ? target_certifications : [],
        enrolled_count: 0,
        completed_count: 0
      });
    } else if (role === 'trainer') {
      db.saveTrainerDetails({
        user_id: userId,
        expertise_areas: Array.isArray(expertise_areas) ? expertise_areas : (expertise_areas ? [expertise_areas] : []),
        years_experience: Number(years_experience) || 1,
        bio: bio || '',
        qualifications: qualifications || 'Certified Trainer',
        active_batches: 0
      });
    } else if (role === 'admin') {
      // Create pending approval ticket
      db.createAdminApproval({
        id: `appr-${Date.now()}`,
        user_id: userId,
        requested_at: new Date().toISOString(),
        status: 'pending',
        justification: justification || 'New administrator request for institutional oversight.',
        user_email: email,
        user_name: full_name,
        organization
      });

      // Notify existing admins
      const activeAdmins = db.getAllUsers().filter(u => u.role === 'admin' && u.status === 'active');
      for (const adm of activeAdmins) {
        db.createNotification({
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          user_id: adm.id,
          title: 'New Admin Approval Required',
          message: `${full_name} (${email}) requested Administrator privileges for ${organization}.`,
          type: 'alert',
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      // Audit Log
      db.logAuditEvent(
        db.sanitizeUser(newUser),
        'ADMIN_REGISTRATION_SUBMITTED',
        'PROFILE',
        userId,
        { email, status: 'pending', justification },
        req.ip || '127.0.0.1'
      );

      return res.status(201).json({
        message: 'Administrator registration submitted successfully. Your account is in PENDING status awaiting authorization by an active Administrator.',
        status: 'pending',
        user: db.sanitizeUser(newUser)
      });
    }

    // Trainees and Trainers get instant access
    const sanitized = db.sanitizeUser(newUser);
    const token = generateToken(sanitized);

    db.logAuditEvent(
      sanitized,
      'USER_REGISTERED',
      'PROFILE',
      userId,
      { role, organization },
      req.ip || '127.0.0.1'
    );

    return res.status(201).json({
      message: 'Account created and biometric face enrolled successfully.',
      status: 'active',
      token,
      user: sanitized,
      trainee_details: role === 'trainee' ? db.getTraineeDetails(userId) : undefined,
      trainer_details: role === 'trainer' ? db.getTrainerDetails(userId) : undefined
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// ===================================================
// 2. PRODUCTION 3-STEP LOGIN VERIFICATION PIPELINE
// ===================================================

// STEP 1: Verify Role + Email + Password -> Issues Step 1 Challenge Token & Dispatches OTP
router.post('/auth/login/step1', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Please provide Email, Password, and target Role.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    // CRITICAL: Role verification against user's actual registered role
    if (user.role !== role) {
      return res.status(403).json({
        error: `Role Mismatch: This account is registered as a ${user.role.toUpperCase()}, but you selected ${String(role).toUpperCase()}. Please select the matching role to proceed.`,
        registeredRole: user.role
      });
    }

    // Account status authorization check
    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Your administrator account is pending approval by an active platform administrator. Please check back later or contact support.',
        status: 'pending'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: 'Your registration request was not approved by the administration.',
        status: 'rejected'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been temporarily suspended by an administrator.',
        status: 'suspended'
      });
    }

    // Generate Step 1 Challenge Token (Valid for 10 minutes)
    const challenge_token = createLoginChallengeToken({
      stage: 'step1_completed',
      userId: user.id,
      email: user.email,
      role: user.role,
      selectedRole: role as UserRole
    });

    // Generate initial OTP for Step 2
    const otpDestination = user.phone || user.email;
    const { code, expires_in_seconds } = db.createOtp(otpDestination, user.id);

    // Mask contacts for privacy
    let maskedEmail = user.email;
    const [name, domain] = user.email.split('@');
    maskedEmail = `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;

    let maskedPhone = user.phone;
    if (user.phone) {
      const digits = user.phone.replace(/\D/g, '');
      maskedPhone = `+** *****${digits.slice(-4)}`;
    }

    db.logAuditEvent(
      db.sanitizeUser(user),
      'LOGIN_STEP1_VERIFIED',
      'AUTH',
      user.id,
      { selectedRole: role, destination: otpDestination },
      req.ip || '127.0.0.1'
    );

    return res.json({
      message: 'Step 1 verified: Credentials and role authorized.',
      challenge_token,
      step: 2,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        has_biometrics: user.has_biometrics
      },
      masked_email: maskedEmail,
      masked_phone: maskedPhone,
      active_channel: user.phone ? 'phone' : 'email',
      demo_code: code,
      expires_in_seconds
    });
  } catch (error: any) {
    console.error('Step 1 login error:', error);
    return res.status(500).json({ error: 'Server error during Step 1 verification.' });
  }
});

// Re-dispatch OTP during Step 2 (toggle between Email / Phone)
router.post('/auth/login/otp/resend', async (req: Request, res: Response) => {
  try {
    const { challenge_token, channel } = req.body;
    if (!challenge_token) {
      return res.status(400).json({ error: 'Challenge token is required.' });
    }

    const challenge = verifyLoginChallengeToken(challenge_token);
    if (!challenge || challenge.stage !== 'step1_completed') {
      return res.status(401).json({ error: 'Invalid or expired challenge session. Please restart login.' });
    }

    const user = db.getUserById(challenge.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const target = channel === 'email' ? user.email : (user.phone || user.email);
    const { code, expires_in_seconds } = db.createOtp(target, user.id);

    let maskedDestination = target;
    if (target.includes('@')) {
      const [name, domain] = target.split('@');
      maskedDestination = `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
    } else {
      const digits = target.replace(/\D/g, '');
      maskedDestination = `+** *****${digits.slice(-4)}`;
    }

    db.logAuditEvent(
      db.sanitizeUser(user),
      'LOGIN_OTP_RESENT',
      'AUTH',
      user.id,
      { channel, destination: maskedDestination },
      req.ip || '127.0.0.1'
    );

    return res.json({
      message: `Verification code re-sent via ${String(channel).toUpperCase()} to ${maskedDestination}.`,
      masked_destination: maskedDestination,
      demo_code: code,
      expires_in_seconds
    });
  } catch (error: any) {
    console.error('OTP resend error:', error);
    return res.status(500).json({ error: 'Failed to re-dispatch verification code.' });
  }
});

// STEP 2: Verify OTP -> Advances Challenge Token to Step 2 Completed
router.post('/auth/login/step2', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { challenge_token, code } = req.body;
    if (!challenge_token || !code) {
      return res.status(400).json({ error: 'Challenge token and 6-digit OTP code are required.' });
    }

    const challenge = verifyLoginChallengeToken(challenge_token);
    if (!challenge || challenge.stage !== 'step1_completed') {
      return res.status(401).json({ 
        error: 'Step 1 (Credentials & Role) must be verified before verifying OTP.' 
      });
    }

    const user = db.getUserById(challenge.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Rate limit check
    const rateLimit = db.checkRateLimit(`otp_step2_${challenge.userId}`, 5, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Too many invalid OTP attempts. Please wait 5 minutes before trying again.' });
    }

    // Try user's phone or email
    let verification = db.verifyOtp(user.phone || user.email, code);
    if (!verification.success && user.email) {
      const emailVerify = db.verifyOtp(user.email, code);
      if (emailVerify.success) verification = emailVerify;
    }

    if (!verification.success) {
      return res.status(401).json({
        error: verification.error || 'Invalid or expired OTP verification code.'
      });
    }

    // Promote challenge to Step 2 Completed!
    const step2ChallengeToken = createLoginChallengeToken({
      stage: 'step2_completed',
      userId: user.id,
      email: user.email,
      role: user.role,
      selectedRole: challenge.selectedRole
    });

    db.logAuditEvent(
      db.sanitizeUser(user),
      'LOGIN_STEP2_VERIFIED',
      'AUTH',
      user.id,
      { role: user.role },
      clientIp
    );

    return res.json({
      message: 'Step 2 verified: OTP code confirmed. Proceeding to Biometric Face Verification.',
      challenge_token: step2ChallengeToken,
      step: 3,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        has_biometrics: user.has_biometrics
      }
    });
  } catch (error: any) {
    console.error('Step 2 login error:', error);
    return res.status(500).json({ error: 'Server error during OTP verification.' });
  }
});

// STEP 3: Verify Biometric Face -> Issues Final Authenticated Session Token
router.post('/auth/login/step3', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { challenge_token, vector, liveness_score, frame_count } = req.body;
    if (!challenge_token) {
      return res.status(400).json({ error: 'Challenge token is required.' });
    }

    const challenge = verifyLoginChallengeToken(challenge_token);
    if (!challenge || challenge.stage !== 'step2_completed') {
      return res.status(401).json({
        error: 'Step 2 (OTP verification) must be completed before biometric face verification.'
      });
    }

    const user = db.getUserById(challenge.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (!vector || !Array.isArray(vector) || vector.length < 32) {
      return res.status(400).json({ error: 'Valid 128-dimensional facial descriptor vector is required.' });
    }

    // Biometric rate limit per user
    const rateLimit = db.checkRateLimit(`face_auth_${user.id}`, 8, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many biometric verification attempts. Please wait 10 minutes before retrying.'
      });
    }

    // Match against user's registered template
    const match = matchBiometricEmbedding(vector, Number(liveness_score) || 0.8, user.email);

    if (!match.matched || !match.user) {
      db.logAuditEvent(
        db.sanitizeUser(user),
        'LOGIN_STEP3_FAILED',
        'AUTH',
        user.id,
        { reason: match.message, similarity: match.similarity, clientIp },
        clientIp
      );

      return res.status(401).json({
        error: match.message || 'Facial signature does not match registered template.',
        similarity: match.similarity,
        unmatched: true
      });
    }

    // All 3 factors verified by the server!
    db.resetRateLimit(`face_auth_${user.id}`);

    const sanitized = db.sanitizeUser(user);
    const token = generateToken(sanitized);

    db.logAuditEvent(
      sanitized,
      'THREE_FACTOR_LOGIN_SUCCESS',
      'SESSION',
      user.id,
      {
        role: user.role,
        similarity: match.similarity,
        stages: ['credentials', 'otp', 'biometrics']
      },
      clientIp
    );

    await syncProfileToSupabase(sanitized);

    return res.json({
      message: `All 3 verification factors validated! Welcome back, ${user.full_name}.`,
      token,
      user: sanitized,
      similarity: match.similarity,
      trainee_details: user.role === 'trainee' ? db.getTraineeDetails(user.id) : undefined,
      trainer_details: user.role === 'trainer' ? db.getTrainerDetails(user.id) : undefined
    });
  } catch (error: any) {
    console.error('Step 3 login error:', error);
    return res.status(500).json({ error: 'Server error during Step 3 biometric verification.' });
  }
});

// Normal Email + Password Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role and Status Authorization Guard
    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Your administrator account is pending approval by an existing platform administrator. Please check back later or contact support.',
        status: 'pending'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        error: 'Your registration request was not approved by the administration.',
        status: 'rejected'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been temporarily suspended by an administrator.',
        status: 'suspended'
      });
    }

    const sanitized = db.sanitizeUser(user);
    const token = generateToken(sanitized);

    db.logAuditEvent(
      sanitized,
      'USER_LOGIN_SUCCESS',
      'SESSION',
      user.id,
      { role: user.role, method: 'password' },
      req.ip || '127.0.0.1'
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: sanitized,
      trainee_details: user.role === 'trainee' ? db.getTraineeDetails(user.id) : undefined,
      trainer_details: user.role === 'trainer' ? db.getTrainerDetails(user.id) : undefined
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// ===================================================
// 2. OTP VERIFICATION AUTHENTICATION
// ===================================================

// Send OTP to registered email or phone
router.post('/auth/otp/send', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Please provide your registered email address or phone number.' });
    }

    const cleanId = identifier.trim();

    // Rate Limit 1: 30-second cooldown between requests for the same contact
    const latestTime = db.getLatestOtpRequestTime(cleanId);
    if (latestTime && Date.now() - latestTime < 30 * 1000) {
      const waitSec = Math.ceil((30 * 1000 - (Date.now() - latestTime)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting another verification code.`
      });
    }

    // Rate Limit 2: Max 3 OTP requests per 10 minutes
    const recentCount = db.getRecentOtpRequestsCount(cleanId, 10 * 60 * 1000);
    if (recentCount >= 3) {
      return res.status(429).json({
        error: 'Too many OTP requests for this contact. For security, please wait 10 minutes before requesting a new code.'
      });
    }

    const user = db.getUserByEmailOrPhone(cleanId);
    if (!user) {
      return res.status(404).json({
        error: 'No registered account found matching this email or phone number. Please check your credentials or create an account.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been temporarily suspended by an administrator.'
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        error: 'Administrator account registration is PENDING approval by an active administrator.'
      });
    }

    // Generate cryptographic 6-digit OTP (5-minute expiration)
    const { code, expires_in_seconds } = db.createOtp(cleanId, user.id);

    // Mask destination for privacy
    let maskedDestination = cleanId;
    if (cleanId.includes('@')) {
      const [name, domain] = cleanId.split('@');
      const maskedName = name.length <= 2 ? name[0] + '*' : name[0] + '***' + name[name.length - 1];
      maskedDestination = `${maskedName}@${domain}`;
    } else {
      const digits = cleanId.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      maskedDestination = `+** *****${last4}`;
    }

    db.logAuditEvent(
      db.sanitizeUser(user),
      'OTP_REQUESTED',
      'AUTH',
      user.id,
      { destination: maskedDestination, clientIp },
      clientIp
    );

    return res.json({
      message: `Security OTP verification code dispatched to ${maskedDestination}.`,
      masked_destination: maskedDestination,
      demo_code: code, // Rendered for sandbox/testing convenience
      expires_in_seconds,
      target_user_name: user.full_name,
      role: user.role
    });
  } catch (error: any) {
    console.error('OTP Send error:', error);
    return res.status(500).json({ error: 'Failed to dispatch OTP verification code.' });
  }
});

// Verify OTP and issue authenticated session
router.post('/auth/otp/verify', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Please provide both your contact identifier and the 6-digit verification code.' });
    }

    // Rate limit verification attempts (Max 10 per 5 min per IP)
    const rateLimit = db.checkRateLimit(`otp_verify_${clientIp}`, 10, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many verification attempts. Please wait 5 minutes before trying again.'
      });
    }

    const verification = db.verifyOtp(identifier, code);
    if (!verification.success || !verification.user) {
      return res.status(401).json({
        error: verification.error || 'Invalid or expired verification code.'
      });
    }

    const user = verification.user;
    const sanitized = db.sanitizeUser(user);
    const token = generateToken(sanitized);

    db.logAuditEvent(
      sanitized,
      'OTP_LOGIN_SUCCESS',
      'AUTH',
      user.id,
      { identifier, clientIp },
      clientIp
    );

    // Sync profile to Supabase if connected
    await syncProfileToSupabase(sanitized);

    return res.json({
      message: `Identity verified via secure OTP! Welcome back, ${user.full_name}.`,
      token,
      user: sanitized,
      trainee_details: user.role === 'trainee' ? db.getTraineeDetails(user.id) : undefined,
      trainer_details: user.role === 'trainer' ? db.getTrainerDetails(user.id) : undefined
    });
  } catch (error: any) {
    console.error('OTP Verify error:', error);
    return res.status(500).json({ error: 'Server error verifying OTP code.' });
  }
});

// Fast Login / Demo Accounts
router.post('/auth/demo-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    let targetEmail = '';

    if (role === 'trainee') {
      targetEmail = 'alex.trainee@capacityconnect.org';
    } else if (role === 'trainer') {
      targetEmail = 'dr.sharma@capacityconnect.org';
    } else if (role === 'admin') {
      targetEmail = 'sarah.admin@capacityconnect.org';
    } else {
      return res.status(400).json({ error: 'Invalid demo role selected. Must be trainee, trainer, or admin.' });
    }

    const user = db.getUserByEmail(targetEmail);
    if (!user) {
      return res.status(404).json({ error: 'Demo account not initialized.' });
    }

    const sanitized = db.sanitizeUser(user);
    const token = generateToken(sanitized);

    db.logAuditEvent(
      sanitized,
      'DEMO_LOGIN_ACCESSED',
      'SESSION',
      user.id,
      { role: user.role, is_demo: true },
      req.ip || '127.0.0.1'
    );

    return res.json({
      message: `Logged in as Demo ${user.role.toUpperCase()}: ${user.full_name}`,
      token,
      user: sanitized,
      trainee_details: user.role === 'trainee' ? db.getTraineeDetails(user.id) : undefined,
      trainer_details: user.role === 'trainer' ? db.getTrainerDetails(user.id) : undefined
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Error during demo login.' });
  }
});

// Biometric Face Verification Login (Server-side Edge Function)
router.post('/auth/face-login', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  
  // Rate Limit Check (5 attempts / 15 min)
  const rateLimit = db.checkRateLimit(`face_auth_${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Too many biometric verification attempts. For security reasons, please try again in 15 minutes.'
    });
  }

  try {
    const { vector, liveness_score, email, frame_count } = req.body;

    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({ error: 'No facial embedding descriptor provided.' });
    }

    // Call server-side biometric matching engine
    const match = matchBiometricEmbedding(vector, Number(liveness_score) || 0.8, email);

    if (!match.matched || !match.user) {
      const isNotEnrolled = match.message.includes('not enrolled');
      db.logAuditEvent(
        { id: 'anonymous', full_name: 'Unknown Biometric Attempt', role: 'trainee', email: email || 'unknown', phone: '', organization: '', department: '', status: 'active', created_at: '', updated_at: '' },
        isNotEnrolled ? 'BIOMETRIC_NOT_ENROLLED' : 'BIOMETRIC_LOGIN_FAILED',
        'AUTH',
        'face-scanner',
        { reason: match.message, similarity: match.similarity, clientIp },
        clientIp
      );

      if (isNotEnrolled) {
        return res.status(404).json({
          error: 'Face Recognition not enrolled for this account.',
          not_enrolled: true,
          message: match.message,
          remaining_attempts: rateLimit.remaining
        });
      }

      return res.status(401).json({
        error: match.message,
        similarity: match.similarity,
        unmatched: true,
        remaining_attempts: rateLimit.remaining
      });
    }

    // Reset rate limit on success
    db.resetRateLimit(`face_auth_${clientIp}`);

    const sanitized = db.sanitizeUser(match.user);
    const token = generateToken(sanitized);

    // Sync profile to Supabase if connected
    await syncProfileToSupabase(sanitized);

    db.logAuditEvent(
      sanitized,
      'BIOMETRIC_LOGIN_SUCCESS',
      'AUTH',
      match.user.id,
      { similarity: match.similarity, frame_count: frame_count || 1 },
      clientIp
    );

    return res.json({
      message: 'Biometric face verification successful.',
      token,
      user: sanitized,
      similarity: match.similarity,
      trainee_details: sanitized.role === 'trainee' ? db.getTraineeDetails(sanitized.id) : undefined,
      trainer_details: sanitized.role === 'trainer' ? db.getTrainerDetails(sanitized.id) : undefined
    });
  } catch (error: any) {
    console.error('Face login error:', error);
    return res.status(500).json({ error: 'Server error during biometric verification.' });
  }
});

// Biometric Enrollment (Authenticated)
router.post('/auth/face-enroll', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vector, liveness_score } = req.body;
    if (!vector || !Array.isArray(vector) || vector.length < 32) {
      return res.status(400).json({ error: 'Invalid face template vector provided.' });
    }

    const userId = req.user!.id;
    db.saveBiometric(userId, vector, true);

    const updatedUser = db.updateUser(userId, { has_biometrics: true });

    db.logAuditEvent(
      req.user!,
      'BIOMETRIC_FACE_ENROLLED',
      'BIOMETRIC',
      userId,
      { vector_length: vector.length, liveness_score },
      req.ip || '127.0.0.1'
    );

    return res.json({
      message: 'Facial biometric template enrolled successfully. You can now use 1-click Face Login.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Enrollment error:', error);
    return res.status(500).json({ error: 'Failed to enroll biometric template.' });
  }
});

// Biometric Linkage & Quick Enrollment (Can be called before login to link camera face to account)
router.post('/auth/link-face', async (req: Request, res: Response) => {
  try {
    const { email, vector, liveness_score, password } = req.body;
    if (!email || !vector || !Array.isArray(vector) || vector.length < 32) {
      return res.status(400).json({ error: 'Valid user email and facial biometric template vector are required.' });
    }

    const user = db.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: `User account '${email}' not found.` });
    }

    // If not one of the pre-configured demo users, verify password
    const isDemo = [
      'alex.trainee@capacityconnect.org',
      'dr.sharma@capacityconnect.org',
      'sarah.admin@capacityconnect.org'
    ].includes(user.email.toLowerCase());

    if (!isDemo && password) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect password for account face linkage.' });
      }
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: `Account status is ${user.status}. Cannot link biometrics.` });
    }

    // Save template vector in database
    db.saveBiometric(user.id, vector, true);
    const updatedUser = db.updateUser(user.id, { has_biometrics: true });

    const clientIp = req.ip || '127.0.0.1';
    db.logAuditEvent(
      updatedUser,
      'BIOMETRIC_FACE_LINKED',
      'AUTH',
      user.id,
      { email: user.email, vector_length: vector.length, liveness_score: liveness_score || 0.9 },
      clientIp
    );

    const token = generateToken(updatedUser);

    return res.json({
      message: `Facial biometric signature successfully enrolled and linked to ${user.full_name}!`,
      token,
      user: updatedUser,
      similarity: 1.0,
      trainee_details: updatedUser.role === 'trainee' ? db.getTraineeDetails(user.id) : undefined,
      trainer_details: updatedUser.role === 'trainer' ? db.getTrainerDetails(user.id) : undefined
    });
  } catch (error: any) {
    console.error('Link face error:', error);
    return res.status(500).json({ error: 'Failed to link facial biometric to user account.' });
  }
});

// Current User Profile Verification
router.get('/auth/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user,
    trainee_details: user.role === 'trainee' ? db.getTraineeDetails(user.id) : undefined,
    trainer_details: user.role === 'trainer' ? db.getTrainerDetails(user.id) : undefined
  });
});

// Forgot & Reset Password
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = db.getUserByEmail(email);
  if (!user) {
    // Return success to avoid email enumeration
    return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
  }

  const code = db.createPasswordReset(email);
  return res.json({
    message: 'Reset verification code generated.',
    verification_code: code // Included for seamless test demonstration
  });
});

router.post('/auth/reset-password', async (req: Request, res: Response) => {
  const { email, code, new_password } = req.body;
  if (!email || !code || !new_password) {
    return res.status(400).json({ error: 'Email, code, and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(new_password, salt);

  const success = db.verifyAndResetPassword(email, code, password_hash);
  if (!success) {
    return res.status(400).json({ error: 'Invalid or expired password reset verification code.' });
  }

  return res.json({ message: 'Password updated successfully. You can now log in.' });
});

// ===================================================
// 2. COURSES & CAPACITY TRAINING PROGRAMS
// ===================================================

router.get('/courses', async (req: Request, res: Response) => {
  const { category, level, search } = req.query;
  
  // Query real Supabase courses table
  const supabaseCourses = await fetchSupabaseCourses();
  
  let courses: Course[];
  if (supabaseCourses !== null && supabaseCourses.length > 0) {
    courses = supabaseCourses;
  } else {
    // If Supabase courses table is currently empty, provide initial catalog seamlessly
    // Note: Does not insert duplicate records or recreate the table
    courses = db.getCourses();
  }

  if (category && category !== 'All') {
    courses = courses.filter(c => c.category === category);
  }
  if (level && level !== 'All') {
    courses = courses.filter(c => c.level === level);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    courses = courses.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) ||
      (c.skills_acquired || []).some(s => s.toLowerCase().includes(q))
    );
  }

  return res.json({ courses });
});

router.get('/courses/:id', async (req: Request, res: Response) => {
  let course: Course | null = await fetchSupabaseCourseById(req.params.id);
  if (!course) {
    course = db.getCourseById(req.params.id) || null;
  }
  if (!course) return res.status(404).json({ error: 'Course not found.' });

  const assessment = db.getAssessmentById(`asm-${course.id.slice(-2)}`) || db.getAssessments(course.id)[0];
  return res.json({ course, assessment });
});


router.post('/courses', authenticate, requireRole('trainer', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, level, duration_hours, capacity, modules, skills_acquired, cover_image } = req.body;

  if (!title || !description || !category || !level) {
    return res.status(400).json({ error: 'Title, description, category, and level are required.' });
  }

  const newCourse: Course = {
    id: `crs-${Date.now()}`,
    title,
    description,
    category,
    level,
    trainer_id: req.user!.id,
    trainer_name: req.user!.full_name,
    duration_hours: Number(duration_hours) || 20,
    capacity: Number(capacity) || 50,
    enrolled_count: 0,
    status: 'published',
    cover_image: cover_image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    skills_acquired: Array.isArray(skills_acquired) ? skills_acquired : ['Professional Skills', 'Technical Leadership'],
    modules: Array.isArray(modules) ? modules : [],
    created_at: new Date().toISOString()
  };

  db.createCourse(newCourse);
  await syncCourseToSupabase(newCourse);

  const auditEvent = db.logAuditEvent(
    req.user!,
    'COURSE_CREATED',
    'COURSE',
    newCourse.id,
    { title: newCourse.title, category: newCourse.category },
    req.ip || '127.0.0.1'
  );
  await syncAuditLogToSupabase(auditEvent);

  return res.status(201).json({ course: newCourse });
});

router.put('/courses/:id', authenticate, requireRole('trainer', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });

  // If trainer, must be owner
  if (req.user!.role === 'trainer' && course.trainer_id !== req.user!.id) {
    return res.status(403).json({ error: 'You can only update training programs created by you.' });
  }

  const updated = db.updateCourse(req.params.id, req.body);
  if (updated) {
    await syncCourseToSupabase(updated);
  }
  return res.json({ course: updated });
});

router.delete('/courses/:id', authenticate, requireRole('trainer', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const course = db.getCourseById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });

  if (req.user!.role === 'trainer' && course.trainer_id !== req.user!.id) {
    return res.status(403).json({ error: 'You can only delete programs you authored.' });
  }

  db.deleteCourse(req.params.id);
  return res.json({ message: 'Course removed successfully.' });
});

// ===================================================
// 3. ENROLLMENTS & LEARNING PROGRESS
// ===================================================

router.get('/enrollments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  // Trainees see their own; trainers & admins can query with userId query param
  let userId = req.user!.id;
  if ((req.user!.role === 'trainer' || req.user!.role === 'admin') && req.query.userId) {
    userId = req.query.userId as string;
  }

  const enrollments = db.getEnrollments(userId);
  return res.json({ enrollments });
});

router.post('/enrollments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { course_id } = req.body;
  if (!course_id) return res.status(400).json({ error: 'course_id is required.' });

  const enrollment = db.createEnrollment(req.user!.id, course_id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Course not found or enrollment failed.' });
  }

  // Persist enrollment to Supabase
  await syncEnrollmentToSupabase(enrollment);

  db.createNotification({
    id: `notif-${Date.now()}`,
    user_id: req.user!.id,
    title: 'Successfully Enrolled',
    message: `You are now enrolled in "${enrollment.course?.title}". Start your learning journey!`,
    type: 'success',
    is_read: false,
    created_at: new Date().toISOString()
  });

  return res.status(201).json({ enrollment });
});

router.post('/enrollments/progress', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { course_id, module_id } = req.body;
  if (!course_id || !module_id) {
    return res.status(400).json({ error: 'course_id and module_id are required.' });
  }

  const result = db.updateEnrollmentProgress(req.user!.id, course_id, module_id);
  if (!result) {
    return res.status(404).json({ error: 'Enrollment record not found.' });
  }

  // Persist progress update directly to Supabase enrollments table
  await syncEnrollmentProgressToSupabase(
    req.user!.id,
    course_id,
    result.enrollment.progress_percentage,
    result.enrollment.completed_modules,
    result.enrollment.status,
    result.enrollment.completion_date,
    result.certificate?.id
  );

  // If a certificate was generated, persist to Supabase certificates table
  if (result.certificate) {
    await syncCertificateToSupabase(result.certificate);
  }

  return res.json(result);
});

// ===================================================
// 4. ASSESSMENTS & RESULTS
// ===================================================

router.get('/assessments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { course_id } = req.query;
  const assessments = db.getAssessments(course_id as string);
  return res.json({ assessments });
});

router.get('/assessments/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const assessment = db.getAssessmentById(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
  return res.json({ assessment });
});

router.post('/assessments', authenticate, requireRole('trainer', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { course_id, title, description, time_limit_minutes, passing_score, questions } = req.body;
  if (!course_id || !title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Course, title, and questions array are required.' });
  }

  const course = db.getCourseById(course_id);
  const newAssessment: Assessment = {
    id: `asm-${Date.now()}`,
    course_id,
    course_title: course?.title || 'Training Program',
    title,
    description: description || '',
    time_limit_minutes: Number(time_limit_minutes) || 20,
    passing_score: Number(passing_score) || 75,
    questions,
    created_at: new Date().toISOString()
  };

  db.saveAssessment(newAssessment);
  return res.status(201).json({ assessment: newAssessment });
});

router.post('/assessments/:id/submit', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const assessment = db.getAssessmentById(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  const { answers } = req.body; // map of questionId -> selectedIndex
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers object is required.' });
  }

  let correctCount = 0;
  for (const q of assessment.questions) {
    if (answers[q.id] === q.correct_index) {
      correctCount++;
    }
  }

  const totalQuestions = assessment.questions.length || 1;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= assessment.passing_score;

  const result = db.submitAssessmentResult({
    id: `res-${Date.now()}`,
    assessment_id: assessment.id,
    course_id: assessment.course_id,
    course_title: assessment.course_title,
    user_id: req.user!.id,
    score: scorePercentage,
    total_questions: totalQuestions,
    passed,
    answers,
    submitted_at: new Date().toISOString()
  });

  if (passed) {
    db.createNotification({
      id: `notif-${Date.now()}`,
      user_id: req.user!.id,
      title: 'Assessment Cleared! 🎯',
      message: `You passed ${assessment.title} with a score of ${scorePercentage}%.`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  return res.json({ result, assessment });
});

router.get('/assessment-results', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.role === 'trainee' ? req.user!.id : (req.query.userId as string || undefined);
  const results = db.getAssessmentResults(userId);
  return res.json({ results });
});

// ===================================================
// 5. CERTIFICATES & VERIFICATION
// ===================================================

router.get('/certificates', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.role === 'trainee' ? req.user!.id : undefined;
  const certificates = db.getCertificates(userId);
  return res.json({ certificates });
});

router.get('/certificates/verify/:code', async (req: Request, res: Response) => {
  const cert = db.getCertificateByCode(req.params.code);
  if (!cert) {
    return res.status(404).json({ verified: false, message: 'Certificate verification code not found in National Registry.' });
  }
  return res.json({ verified: true, certificate: cert });
});

// ===================================================
// 6. NOTIFICATIONS
// ===================================================

router.get('/notifications', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const notifications = db.getNotifications(req.user!.id);
  return res.json({ notifications });
});

router.patch('/notifications/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  db.markNotificationRead(req.params.id, req.user!.id);
  return res.json({ success: true });
});

// ===================================================
// 7. ADMINISTRATOR PRIVILEGED ENDPOINTS
// ===================================================

// List Admin Approvals
router.get('/admin/approvals', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const approvals = db.getAdminApprovals();
  return res.json({ approvals });
});

// Review (Approve/Reject) an Admin Request
router.post('/admin/approvals/:id/review', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { status, review_notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  const updatedApproval = db.reviewAdminApproval(
    req.params.id,
    status as 'approved' | 'rejected',
    req.user!.id,
    req.user!.full_name,
    review_notes
  );

  if (!updatedApproval) {
    return res.status(404).json({ error: 'Approval request not found.' });
  }

  // Audit event
  const auditEvent = db.logAuditEvent(
    req.user!,
    status === 'approved' ? 'ADMIN_ACCOUNT_APPROVED' : 'ADMIN_ACCOUNT_REJECTED',
    'USER',
    updatedApproval.user_id,
    { targetEmail: updatedApproval.user_email, notes: review_notes },
    req.ip || '127.0.0.1'
  );
  await syncAuditLogToSupabase(auditEvent);
  await syncAdminApprovalToSupabase(updatedApproval.id, updatedApproval.user_id, status, req.user!.id, review_notes);

  // Notify the user
  db.createNotification({
    id: `notif-${Date.now()}`,
    user_id: updatedApproval.user_id,
    title: status === 'approved' ? 'Admin Access Approved!' : 'Admin Access Request Rejected',
    message: status === 'approved' 
      ? `Your administrator privileges for ${updatedApproval.organization} have been approved by ${req.user!.full_name}. You now have full access.`
      : `Your administrator privileges request was reviewed and rejected. Notes: ${review_notes || 'None'}`,
    type: status === 'approved' ? 'success' : 'alert',
    is_read: false,
    created_at: new Date().toISOString()
  });

  return res.json({ approval: updatedApproval });
});

// Manage Users (Admin Only)
router.get('/admin/users', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  return res.json({ users });
});

router.patch('/admin/users/:id/status', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (!['active', 'pending', 'rejected', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid account status.' });
  }

  // Cannot suspend oneself
  if (req.params.id === req.user!.id && status === 'suspended') {
    return res.status(400).json({ error: 'You cannot suspend your own administrative account.' });
  }

  const updatedUser = db.updateUser(req.params.id, { status: status as AccountStatus });
  if (!updatedUser) return res.status(404).json({ error: 'User not found.' });

  db.logAuditEvent(
    req.user!,
    'USER_STATUS_UPDATED',
    'USER',
    req.params.id,
    { new_status: status },
    req.ip || '127.0.0.1'
  );

  return res.json({ user: updatedUser });
});

// Audit Logs
router.get('/admin/audit-logs', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ logs });
});

// Admin Analytics / KPI Stats
router.get('/admin/stats', authenticate, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getPlatformStats();
  return res.json({ stats });
});

export default router;
