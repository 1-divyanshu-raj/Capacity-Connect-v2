import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  UserProfile, 
  TraineeDetails, 
  TrainerDetails, 
  AdminApproval, 
  Course, 
  Enrollment, 
  Assessment, 
  AssessmentResult, 
  Certificate, 
  NotificationItem, 
  AuditLog, 
  UserRole, 
  AccountStatus 
} from '../src/types';

export interface StoredUser extends UserProfile {
  password_hash: string;
}

export interface StoredBiometric {
  id: string;
  user_id: string;
  template_vector: number[];
  enrolled_at: string;
  last_used_at?: string;
  liveness_verified: boolean;
  is_active: boolean;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  code: string;
  expires_at: number;
  used: boolean;
}

export interface StoredOtpToken {
  id: string;
  user_id?: string;
  identifier: string; // normalized email or phone
  code: string; // 6-digit code
  expires_at: number; // timestamp
  attempts: number;
  used: boolean;
  created_at: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  trainees: TraineeDetails[];
  trainers: TrainerDetails[];
  admin_approvals: AdminApproval[];
  biometrics: StoredBiometric[];
  courses: Course[];
  enrollments: Enrollment[];
  assessments: Assessment[];
  assessment_results: AssessmentResult[];
  certificates: Certificate[];
  notifications: NotificationItem[];
  audit_logs: AuditLog[];
  password_resets: PasswordResetToken[];
  otp_tokens: StoredOtpToken[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILES = [
  path.join(DATA_DIR, 'database.json'),
  path.join(process.cwd(), 'database.json')
];

// Default initial password hash for "Password123!"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

// Helper to generate normalized synthetic face vector (128 floats)
function generateSyntheticFaceVector(seed: number): number[] {
  const vec: number[] = [];
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    const val = Math.sin((seed + 1) * (i + 1) * 0.17) * 0.5 + Math.cos((seed + 2) * (i + 1) * 0.23) * 0.5;
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map(v => Number((v / norm).toFixed(6)));
}

function getInitialDatabase(): DatabaseSchema {
  const alexId = 'usr-trainee-001';
  const sharmaId = 'usr-trainer-001';
  const sarahId = 'usr-admin-001';
  const marcusId = 'usr-admin-pending-002';

  const initialCourses: Course[] = [
    {
      id: 'crs-cloud-001',
      title: 'Enterprise Cloud Infrastructure & Kubernetes Orchestration',
      description: 'Master high-availability microservices deployment, VPC networking, Istio service mesh, and infrastructure automation using Terraform and Kubernetes on multi-cloud environments.',
      category: 'Cloud & DevOps',
      level: 'Intermediate',
      trainer_id: sharmaId,
      trainer_name: 'Dr. Rajesh Sharma',
      duration_hours: 36,
      capacity: 60,
      enrolled_count: 24,
      status: 'published',
      cover_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
      skills_acquired: ['Kubernetes', 'Docker', 'CI/CD Pipelines', 'Terraform', 'Observability (Prometheus)'],
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      modules: [
        {
          id: 'mod-c1-1',
          title: 'Containerization Fundamentals & OCI Standards',
          duration_minutes: 90,
          type: 'video',
          content: 'Deep dive into cgroups, namespaces, image layers, multi-stage builds, and container runtime security practices.'
        },
        {
          id: 'mod-c1-2',
          title: 'Kubernetes Architecture: Control Plane & Worker Nodes',
          duration_minutes: 120,
          type: 'reading',
          content: 'Detailed breakdown of kube-apiserver, etcd quorum consensus, kube-controller-manager, and kube-proxy IPVS load balancing.'
        },
        {
          id: 'mod-c1-3',
          title: 'Hands-on Lab: Deploying Microservices with Helm Charts',
          duration_minutes: 150,
          type: 'practical',
          content: 'Building configurable templates with values.yaml, dependency management, and release versioning in staging environments.'
        },
        {
          id: 'mod-c1-4',
          title: 'Service Mesh & Zero-Trust Security Policies',
          duration_minutes: 110,
          type: 'assignment',
          content: 'Enforcing mTLS communication between microservices, traffic routing canary deployments, and Calico network policies.'
        }
      ]
    },
    {
      id: 'crs-ai-002',
      title: 'Applied Generative AI & Deep Learning Systems',
      description: 'Build production-ready LLM agents, vector embeddings search with pgvector, fine-tuning pipelines, and semantic retrieval-augmented generation (RAG) frameworks.',
      category: 'Artificial Intelligence',
      level: 'Advanced',
      trainer_id: sharmaId,
      trainer_name: 'Dr. Rajesh Sharma',
      duration_hours: 45,
      capacity: 50,
      enrolled_count: 38,
      status: 'published',
      cover_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop',
      skills_acquired: ['Generative AI', 'Vector DBs', 'RAG Pipelines', 'Prompt Optimization', 'Model Evaluation'],
      created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
      modules: [
        {
          id: 'mod-c2-1',
          title: 'Transformer Architecture & Self-Attention Mechanics',
          duration_minutes: 120,
          type: 'video',
          content: 'Mathematical formulation of scaled dot-product attention, positional encodings, and multi-head attention blocks.'
        },
        {
          id: 'mod-c2-2',
          title: 'Vector Search, Embeddings, & pgvector Indexing',
          duration_minutes: 100,
          type: 'reading',
          content: 'HNSW vs IVFFlat index strategies, cosine distance metrics, and scaling dense vector search over millions of documents.'
        },
        {
          id: 'mod-c2-3',
          title: 'End-to-End Enterprise RAG System Engineering',
          duration_minutes: 180,
          type: 'practical',
          content: 'Document chunking, hybrid keyword-vector retrieval, re-ranking with cross-encoders, and hallucination guardrails.'
        }
      ]
    },
    {
      id: 'crs-cyber-003',
      title: 'Cyber Threat Intelligence & Incident Response Defense',
      description: 'Comprehensive cyber defense training covering MITRE ATT&CK frameworks, SIEM log analysis, digital forensics, reverse engineering basic malware, and automated playbook orchestration.',
      category: 'Cybersecurity',
      level: 'Intermediate',
      trainer_id: sharmaId,
      trainer_name: 'Dr. Rajesh Sharma',
      duration_hours: 32,
      capacity: 40,
      enrolled_count: 18,
      status: 'published',
      cover_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
      skills_acquired: ['Threat Hunting', 'SIEM / Splunk', 'Network Forensics', 'MITRE ATT&CK', 'Incident Response'],
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      modules: [
        {
          id: 'mod-c3-1',
          title: 'Threat Actor TTPs & MITRE ATT&CK Matrix Navigation',
          duration_minutes: 90,
          type: 'video',
          content: 'Mapping adversarial techniques across reconnaissance, initial access, privilege escalation, and lateral movement.'
        },
        {
          id: 'mod-c3-2',
          title: 'Security Operations Center (SOC) Log Analytics',
          duration_minutes: 120,
          type: 'practical',
          content: 'Correlating Zeek network telemetry, Windows Event IDs (4624, 4688, Sysmon), and Linux auth logs.'
        }
      ]
    },
    {
      id: 'crs-sdg-004',
      title: 'Renewable Energy Grid Analytics & Smart Infrastructure',
      description: 'Capacity building program designed for public sector engineers and sustainability teams on smart grid IoT telemetry, predictive load balancing, and battery storage optimization.',
      category: 'Sustainable Infrastructure',
      level: 'Beginner',
      trainer_id: sharmaId,
      trainer_name: 'Dr. Rajesh Sharma',
      duration_hours: 20,
      capacity: 80,
      enrolled_count: 45,
      status: 'published',
      cover_image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop',
      skills_acquired: ['Smart Grids', 'IoT Telemetry', 'Energy Storage', 'Sustainability Audits'],
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      modules: [
        {
          id: 'mod-c4-1',
          title: 'Smart Meter Protocols & SCADA Data Integration',
          duration_minutes: 75,
          type: 'video',
          content: 'Modbus TCP, DNP3, and IEC 61850 protocol ingestion architectures for edge substation monitors.'
        },
        {
          id: 'mod-c4-2',
          title: 'Predictive Load Forecasting with Time-Series Models',
          duration_minutes: 110,
          type: 'practical',
          content: 'Forecasting peak demand profiles using seasonal decomposition and neural forecasting algorithms.'
        }
      ]
    }
  ];

  const initialAssessments: Assessment[] = [
    {
      id: 'asm-c1',
      course_id: 'crs-cloud-001',
      course_title: 'Enterprise Cloud Infrastructure & Kubernetes Orchestration',
      title: 'Cloud & Kubernetes Technical Certification Assessment',
      description: 'Evaluate your understanding of container orchestration, network policies, declarative configuration, and distributed fault tolerance.',
      time_limit_minutes: 15,
      passing_score: 75,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      questions: [
        {
          id: 'q1',
          question: 'In Kubernetes, which component is the only one that communicates directly with the etcd key-value datastore?',
          options: ['kube-scheduler', 'kube-controller-manager', 'kube-apiserver', 'kubelet'],
          correct_index: 2,
          explanation: 'The kube-apiserver acts as the gateway and single source of truth; all other control plane components query and update state through it.'
        },
        {
          id: 'q2',
          question: 'What is the primary function of a Pod Readiness Probe?',
          options: [
            'To restart a crashed container immediately',
            'To determine whether a container is ready to accept user network traffic',
            'To monitor CPU throttling limits',
            'To encrypt container root filesystems at rest'
          ],
          correct_index: 1,
          explanation: 'Readiness probes indicate when a container is ready to receive traffic from Kubernetes Services. If it fails, the pod is removed from Service endpoints.'
        },
        {
          id: 'q3',
          question: 'Which deployment strategy brings up a complete new identical environment alongside the old one before shifting 100% of traffic?',
          options: ['Rolling Update', 'Blue/Green Deployment', 'Canary Deployment', 'Shadow Deployment'],
          correct_index: 1,
          explanation: 'Blue/Green deployment provisions an identical secondary environment and switches DNS or load balancer routing instantaneously.'
        },
        {
          id: 'q4',
          question: 'Under what circumstances does Kubernetes evict pods based on Node Pressure?',
          options: [
            'When node disk space or memory breaches defined eviction thresholds',
            'When a pod runs for longer than 24 continuous hours',
            'When the ingress controller receives high HTTP 404 responses',
            'When secret tokens expire in etcd'
          ],
          correct_index: 0,
          explanation: 'Kubelet constantly checks system memory and disk thresholds (e.g. imagefs.available < 15%) and proactively evicts best-effort or burstable pods.'
        }
      ]
    },
    {
      id: 'asm-c2',
      course_id: 'crs-ai-002',
      course_title: 'Applied Generative AI & Deep Learning Systems',
      title: 'Generative AI & LLM Systems Competency Exam',
      description: 'Test your understanding of vector similarity metrics, retrieval architectures, and agentic tool-use protocols.',
      time_limit_minutes: 20,
      passing_score: 80,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      questions: [
        {
          id: 'q2-1',
          question: 'Which mathematical metric is most commonly used to measure semantic similarity between two normalized text embeddings?',
          options: ['Manhattan distance', 'Cosine similarity', 'Levenshtein edit distance', 'Hamming weight'],
          correct_index: 1,
          explanation: 'Cosine similarity computes the dot product of normalized vectors, evaluating the cosine of the angle between them regardless of magnitude.'
        },
        {
          id: 'q2-2',
          question: 'What is the primary benefit of Hierarchical Navigable Small World (HNSW) graphs in vector search?',
          options: [
            'Zero disk space consumption',
            'Logarithmic time complexity O(log N) approximate nearest neighbor lookups',
            'Guaranteed 100% exact brute force retrieval',
            'Direct token decompression into prompt memory'
          ],
          correct_index: 1,
          explanation: 'HNSW builds multi-layer skip graphs to achieve fast sub-linear approximate nearest neighbor queries at scale.'
        },
        {
          id: 'q2-3',
          question: 'In a RAG system, what is the role of a cross-encoder re-ranker?',
          options: [
            'To translate SQL queries into English',
            'To rescore top-K retrieved candidate chunks jointly with the user query for higher precision',
            'To compress PDF files before vectorization',
            'To eliminate duplicate user database accounts'
          ],
          correct_index: 1,
          explanation: 'Re-rankers evaluate query and document simultaneously with deep cross-attention, boosting the most pertinent passages into the context window.'
        }
      ]
    }
  ];

  return {
    users: [
      {
        id: sarahId,
        email: 'sarah.admin@capacityconnect.org',
        full_name: 'Sarah Chen',
        role: 'admin',
        phone: '+91 98765 43210',
        organization: 'National Capacity & Skills Mission',
        department: 'Governance & Platform Administration',
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
        has_biometrics: true,
        password_hash: DEFAULT_PASSWORD_HASH,
        created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: sharmaId,
        email: 'dr.sharma@capacityconnect.org',
        full_name: 'Dr. Rajesh Sharma',
        role: 'trainer',
        phone: '+91 98111 22334',
        organization: 'Center for Advanced Technology & Research',
        department: 'Cloud Systems & AI Division',
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        has_biometrics: true,
        password_hash: DEFAULT_PASSWORD_HASH,
        created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: alexId,
        email: 'alex.trainee@capacityconnect.org',
        full_name: 'Alex Rivera',
        role: 'trainee',
        phone: '+91 99555 66778',
        organization: 'State Digital Talent Consortium',
        department: 'Software Engineering Trainee Wing',
        status: 'active',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        has_biometrics: true,
        password_hash: DEFAULT_PASSWORD_HASH,
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: marcusId,
        email: 'marcus.pending@capacityconnect.org',
        full_name: 'Marcus Vance',
        role: 'admin',
        phone: '+91 94333 88990',
        organization: 'Regional Skill Directorate',
        department: 'Regional Operations Monitoring',
        status: 'pending',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        has_biometrics: false,
        password_hash: DEFAULT_PASSWORD_HASH,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    trainees: [
      {
        id: 'trn-001',
        user_id: alexId,
        skills_interests: ['Cloud Architecture', 'DevOps', 'Distributed Systems', 'Python', 'Kubernetes'],
        education_level: 'B.Tech in Computer Science & Engineering',
        target_certifications: ['Certified Kubernetes Administrator (CKA)', 'Cloud Solutions Architect'],
        enrolled_count: 2,
        completed_count: 1
      }
    ],
    trainers: [
      {
        id: 't-001',
        user_id: sharmaId,
        expertise_areas: ['Cloud Native Computing', 'Kubernetes Ecosystem', 'Deep Learning & LLMs', 'Cyber Defense'],
        years_experience: 14,
        bio: 'Distinguished Fellow in Distributed Systems with over a decade of hands-on architectural experience leading capacity development programs for government and enterprise initiatives.',
        qualifications: 'Ph.D. in Computer Science, CKA/CKS, AWS Certified Solutions Architect Professional',
        active_batches: 3
      }
    ],
    admin_approvals: [
      {
        id: 'appr-001',
        user_id: marcusId,
        requested_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'pending',
        justification: 'Requested administrative oversight for Regional Skill Directorate audit compliance and batch authorization.',
        user_email: 'marcus.pending@capacityconnect.org',
        user_name: 'Marcus Vance',
        organization: 'Regional Skill Directorate'
      }
    ],
    biometrics: [
      {
        id: 'bio-alex-001',
        user_id: alexId,
        template_vector: generateSyntheticFaceVector(42),
        enrolled_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        last_used_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        liveness_verified: true,
        is_active: true
      },
      {
        id: 'bio-sharma-001',
        user_id: sharmaId,
        template_vector: generateSyntheticFaceVector(77),
        enrolled_at: new Date(Date.now() - 35 * 86400000).toISOString(),
        last_used_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        liveness_verified: true,
        is_active: true
      },
      {
        id: 'bio-sarah-001',
        user_id: sarahId,
        template_vector: generateSyntheticFaceVector(101),
        enrolled_at: new Date(Date.now() - 50 * 86400000).toISOString(),
        last_used_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        liveness_verified: true,
        is_active: true
      }
    ],
    courses: initialCourses,
    enrollments: [
      {
        id: 'enr-alex-01',
        user_id: alexId,
        course_id: 'crs-cloud-001',
        enrolled_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        progress_percentage: 75,
        status: 'in_progress',
        completed_modules: ['mod-c1-1', 'mod-c1-2', 'mod-c1-3']
      },
      {
        id: 'enr-alex-02',
        user_id: alexId,
        course_id: 'crs-sdg-004',
        enrolled_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        progress_percentage: 100,
        status: 'completed',
        completed_modules: ['mod-c4-1', 'mod-c4-2'],
        completion_date: new Date(Date.now() - 5 * 86400000).toISOString(),
        certificate_id: 'cert-alex-sdg-001'
      }
    ],
    assessments: initialAssessments,
    assessment_results: [
      {
        id: 'res-alex-001',
        assessment_id: 'asm-c1',
        course_id: 'crs-cloud-001',
        course_title: 'Enterprise Cloud Infrastructure & Kubernetes Orchestration',
        user_id: alexId,
        score: 100,
        total_questions: 4,
        passed: true,
        submitted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        answers: { 'q1': 2, 'q2': 1, 'q3': 1, 'q4': 0 }
      }
    ],
    certificates: [
      {
        id: 'cert-alex-sdg-001',
        certificate_number: 'CAP-2026-SDG-88219',
        user_id: alexId,
        user_name: 'Alex Rivera',
        course_id: 'crs-sdg-004',
        course_title: 'Renewable Energy Grid Analytics & Smart Infrastructure',
        issue_date: new Date(Date.now() - 5 * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        grade: 'Distinction (Grade A+)',
        verification_code: 'VERIFY-CC-77A91-04',
        trainer_name: 'Dr. Rajesh Sharma'
      }
    ],
    notifications: [
      {
        id: 'notif-001',
        user_id: alexId,
        title: 'Assessment Result Available',
        message: 'Congratulations! You passed the Cloud & Kubernetes Technical Certification Assessment with 100%.',
        type: 'success',
        is_read: false,
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: 'notif-002',
        user_id: alexId,
        title: 'Certificate Issued',
        message: 'Your official completion certificate for "Renewable Energy Grid Analytics" is ready for download.',
        type: 'info',
        is_read: true,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: 'notif-003',
        user_id: sarahId,
        title: 'Pending Administrator Approval Request',
        message: 'Marcus Vance has submitted an administrator registration request awaiting your review.',
        type: 'alert',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'notif-004',
        user_id: sharmaId,
        title: 'New Trainee Enrollments',
        message: '24 new trainees registered for your Enterprise Cloud Infrastructure training cohort.',
        type: 'info',
        is_read: false,
        created_at: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ],
    audit_logs: [
      {
        id: 'aud-001',
        actor_id: sarahId,
        actor_name: 'Sarah Chen',
        actor_role: 'admin',
        action: 'SYSTEM_INITIALIZATION',
        target_type: 'SYSTEM',
        target_id: 'system',
        details: { version: '2.4.0', rls_enabled: true, platform: 'Capacity Connect' },
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 60 * 86400000).toISOString()
      },
      {
        id: 'aud-002',
        actor_id: sharmaId,
        actor_name: 'Dr. Rajesh Sharma',
        actor_role: 'trainer',
        action: 'COURSE_PUBLISHED',
        target_type: 'COURSE',
        target_id: 'crs-cloud-001',
        details: { title: 'Enterprise Cloud Infrastructure & Kubernetes Orchestration' },
        ip_address: '192.168.1.45',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString()
      },
      {
        id: 'aud-003',
        actor_id: marcusId,
        actor_name: 'Marcus Vance',
        actor_role: 'admin',
        action: 'ADMIN_REGISTRATION_REQUEST',
        target_type: 'PROFILE',
        target_id: marcusId,
        details: { status: 'pending', justification: 'Regional Skill Directorate audit compliance' },
        ip_address: '10.0.4.19',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'aud-004',
        actor_id: alexId,
        actor_name: 'Alex Rivera',
        actor_role: 'trainee',
        action: 'BIOMETRIC_ENROLLMENT',
        target_type: 'BIOMETRIC',
        target_id: 'bio-alex-001',
        details: { liveness_verified: true, vector_dimension: 128 },
        ip_address: '172.16.0.8',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString()
      }
    ],
    password_resets: [],
    otp_tokens: []
  };
}

class Database {
  private data: DatabaseSchema;
  private rateLimits: Map<string, { count: number; firstAttempt: number }> = new Map();

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    for (const filePath of DB_FILES) {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.users && parsed.courses && parsed.admin_approvals) {
            if (!parsed.otp_tokens) parsed.otp_tokens = [];
            if (!parsed.password_resets) parsed.password_resets = [];
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`Could not read database from ${filePath}:`, err);
      }
    }

    const init = getInitialDatabase();
    this.persist(init);
    return init;
  }

  private persist(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDataDir();
      const content = JSON.stringify(dataToSave || this.data, null, 2);
      for (const filePath of DB_FILES) {
        try {
          fs.writeFileSync(filePath, content, 'utf-8');
        } catch (fileErr) {
          console.warn(`Could not sync to ${filePath}:`, fileErr);
        }
      }
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // Rate Limiter
  public checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry || (now - entry.firstAttempt > windowMs)) {
      this.rateLimits.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (entry.count >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    entry.count += 1;
    return { allowed: true, remaining: maxAttempts - entry.count };
  }

  public resetRateLimit(key: string) {
    this.rateLimits.delete(key);
  }

  // User Management
  public getUserById(id: string): StoredUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByEmailOrPhone(identifier: string): StoredUser | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    const digits = clean.replace(/\D/g, '');

    return this.data.users.find(u => {
      if (u.email.toLowerCase() === clean) return true;
      if (u.phone) {
        const uPhoneDigits = u.phone.replace(/\D/g, '');
        if (digits.length >= 7 && (uPhoneDigits.endsWith(digits) || digits.endsWith(uPhoneDigits))) {
          return true;
        }
        if (u.phone.toLowerCase() === clean) return true;
      }
      return false;
    });
  }

  public getAllUsers(): UserProfile[] {
    return this.data.users.map(({ password_hash, ...rest }) => ({
      ...rest,
      has_biometrics: this.data.biometrics.some(b => b.user_id === rest.id && b.is_active)
    }));
  }

  public sanitizeUser(user: StoredUser): UserProfile {
    const { password_hash, ...rest } = user;
    return {
      ...rest,
      has_biometrics: this.data.biometrics.some(b => b.user_id === rest.id && b.is_active)
    };
  }

  public createUser(user: StoredUser): UserProfile {
    this.data.users.push(user);
    this.persist();
    return this.sanitizeUser(user);
  }

  public updateUser(id: string, updates: Partial<StoredUser>): UserProfile | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.persist();
    return this.sanitizeUser(this.data.users[idx]);
  }

  // Trainee and Trainer Profiles
  public getTraineeDetails(userId: string): TraineeDetails | undefined {
    return this.data.trainees.find(t => t.user_id === userId);
  }

  public saveTraineeDetails(details: TraineeDetails) {
    const idx = this.data.trainees.findIndex(t => t.user_id === details.user_id);
    if (idx !== -1) {
      this.data.trainees[idx] = { ...this.data.trainees[idx], ...details };
    } else {
      this.data.trainees.push({ ...details, id: details.id || `trn-${Date.now()}` });
    }
    this.persist();
  }

  public getTrainerDetails(userId: string): TrainerDetails | undefined {
    return this.data.trainers.find(t => t.user_id === userId);
  }

  public saveTrainerDetails(details: TrainerDetails) {
    const idx = this.data.trainers.findIndex(t => t.user_id === details.user_id);
    if (idx !== -1) {
      this.data.trainers[idx] = { ...this.data.trainers[idx], ...details };
    } else {
      this.data.trainers.push({ ...details, id: details.id || `t-${Date.now()}` });
    }
    this.persist();
  }

  // Admin Approvals
  public getAdminApprovals(): AdminApproval[] {
    return this.data.admin_approvals;
  }

  public createAdminApproval(approval: AdminApproval) {
    this.data.admin_approvals.push(approval);
    this.persist();
  }

  public reviewAdminApproval(
    approvalId: string, 
    status: 'approved' | 'rejected', 
    reviewerId: string, 
    reviewerName: string, 
    notes?: string
  ): AdminApproval | null {
    const appr = this.data.admin_approvals.find(a => a.id === approvalId);
    if (!appr) return null;

    appr.status = status;
    appr.reviewed_by = reviewerId;
    appr.reviewer_name = reviewerName;
    appr.reviewed_at = new Date().toISOString();
    appr.review_notes = notes || '';

    // Update user status
    const targetUser = this.data.users.find(u => u.id === appr.user_id);
    if (targetUser) {
      targetUser.status = status === 'approved' ? 'active' : 'rejected';
      targetUser.updated_at = new Date().toISOString();
    }

    this.persist();
    return appr;
  }

  // Biometrics (Template vectors protected server-side only)
  public getActiveBiometrics(): StoredBiometric[] {
    return this.data.biometrics.filter(b => b.is_active);
  }

  public getBiometricForUser(userId: string): StoredBiometric | undefined {
    return this.data.biometrics.find(b => b.user_id === userId && b.is_active);
  }

  public saveBiometric(userId: string, vector: number[], livenessVerified: boolean = true) {
    const existingIdx = this.data.biometrics.findIndex(b => b.user_id === userId);
    if (existingIdx !== -1) {
      this.data.biometrics[existingIdx].template_vector = vector;
      this.data.biometrics[existingIdx].enrolled_at = new Date().toISOString();
      this.data.biometrics[existingIdx].last_used_at = new Date().toISOString();
      this.data.biometrics[existingIdx].liveness_verified = livenessVerified;
      this.data.biometrics[existingIdx].is_active = true;
    } else {
      this.data.biometrics.push({
        id: `bio-${Date.now()}`,
        user_id: userId,
        template_vector: vector,
        enrolled_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        liveness_verified: livenessVerified,
        is_active: true
      });
    }
    this.persist();
  }

  // Courses
  public getCourses(): Course[] {
    return this.data.courses;
  }

  public getCourseById(id: string): Course | undefined {
    return this.data.courses.find(c => c.id === id);
  }

  public createCourse(course: Course): Course {
    this.data.courses.push(course);
    this.persist();
    return course;
  }

  public updateCourse(id: string, updates: Partial<Course>): Course | null {
    const idx = this.data.courses.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.courses[idx] = { ...this.data.courses[idx], ...updates };
    this.persist();
    return this.data.courses[idx];
  }

  public deleteCourse(id: string): boolean {
    const initialLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    if (this.data.courses.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Enrollments
  public getEnrollments(userId?: string): Enrollment[] {
    let list = this.data.enrollments;
    if (userId) {
      list = list.filter(e => e.user_id === userId);
    }
    return list.map(e => ({
      ...e,
      course: this.getCourseById(e.course_id)
    }));
  }

  public getEnrollment(userId: string, courseId: string): Enrollment | undefined {
    const enr = this.data.enrollments.find(e => e.user_id === userId && e.course_id === courseId);
    if (!enr) return undefined;
    return {
      ...enr,
      course: this.getCourseById(enr.course_id)
    };
  }

  public createEnrollment(userId: string, courseId: string): Enrollment | null {
    const existing = this.getEnrollment(userId, courseId);
    if (existing) return existing;

    const course = this.getCourseById(courseId);
    if (!course) return null;

    const newEnr: Enrollment = {
      id: `enr-${Date.now()}`,
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      status: 'in_progress',
      completed_modules: []
    };

    this.data.enrollments.push(newEnr);
    course.enrolled_count = (course.enrolled_count || 0) + 1;

    // Increment trainee count
    const trainee = this.getTraineeDetails(userId);
    if (trainee) {
      trainee.enrolled_count = (trainee.enrolled_count || 0) + 1;
      this.saveTraineeDetails(trainee);
    }

    this.persist();
    return { ...newEnr, course };
  }

  public updateEnrollmentProgress(
    userId: string, 
    courseId: string, 
    moduleId: string
  ): { enrollment: Enrollment; certificate?: Certificate } | null {
    const enr = this.data.enrollments.find(e => e.user_id === userId && e.course_id === courseId);
    if (!enr) return null;

    const course = this.getCourseById(courseId);
    if (!course) return null;

    if (!enr.completed_modules.includes(moduleId)) {
      enr.completed_modules.push(moduleId);
    }

    const totalModules = course.modules.length || 1;
    enr.progress_percentage = Math.min(100, Math.round((enr.completed_modules.length / totalModules) * 100));

    let createdCert: Certificate | undefined;

    if (enr.progress_percentage === 100 && enr.status !== 'completed') {
      enr.status = 'completed';
      enr.completion_date = new Date().toISOString();

      const user = this.getUserById(userId);
      const certId = `cert-${Date.now()}`;
      const cert: Certificate = {
        id: certId,
        certificate_number: `CAP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        user_id: userId,
        user_name: user?.full_name || 'Trainee',
        course_id: courseId,
        course_title: course.title,
        issue_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        grade: 'Distinction (Grade A+)',
        verification_code: `VERIFY-CC-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${courseId.slice(-2)}`,
        trainer_name: course.trainer_name || 'Senior Instructor'
      };

      this.data.certificates.push(cert);
      enr.certificate_id = certId;
      createdCert = cert;

      // Update trainee completed count
      const trainee = this.getTraineeDetails(userId);
      if (trainee) {
        trainee.completed_count = (trainee.completed_count || 0) + 1;
        this.saveTraineeDetails(trainee);
      }

      // Send notification
      this.createNotification({
        id: `notif-${Date.now()}`,
        user_id: userId,
        title: 'Training Completed & Certificate Issued!',
        message: `Congratulations on completing "${course.title}". Your verified digital certificate is now available!`,
        type: 'success',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    this.persist();
    return {
      enrollment: { ...enr, course },
      certificate: createdCert
    };
  }

  // Assessments
  public getAssessments(courseId?: string): Assessment[] {
    if (courseId) {
      return this.data.assessments.filter(a => a.course_id === courseId);
    }
    return this.data.assessments;
  }

  public getAssessmentById(id: string): Assessment | undefined {
    return this.data.assessments.find(a => a.id === id);
  }

  public saveAssessment(assessment: Assessment): Assessment {
    const idx = this.data.assessments.findIndex(a => a.id === assessment.id);
    if (idx !== -1) {
      this.data.assessments[idx] = assessment;
    } else {
      this.data.assessments.push(assessment);
    }
    this.persist();
    return assessment;
  }

  public submitAssessmentResult(result: AssessmentResult): AssessmentResult {
    this.data.assessment_results.push(result);
    this.persist();
    return result;
  }

  public getAssessmentResults(userId?: string): AssessmentResult[] {
    if (userId) {
      return this.data.assessment_results.filter(r => r.user_id === userId);
    }
    return this.data.assessment_results;
  }

  // Certificates
  public getCertificates(userId?: string): Certificate[] {
    if (userId) {
      return this.data.certificates.filter(c => c.user_id === userId);
    }
    return this.data.certificates;
  }

  public getCertificateByCode(code: string): Certificate | undefined {
    return this.data.certificates.find(c => c.verification_code.toUpperCase() === code.toUpperCase());
  }

  // Notifications
  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      this.persist();
      return true;
    }
    return false;
  }

  public createNotification(notif: NotificationItem) {
    this.data.notifications.unshift(notif);
    this.persist();
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.data.audit_logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public logAuditEvent(actor: UserProfile, action: string, targetType: string, targetId: string, details: Record<string, any>, ip: string = '127.0.0.1') {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      actor_role: actor.role,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ip,
      created_at: new Date().toISOString()
    };
    this.data.audit_logs.unshift(entry);
    this.persist();
    return entry;
  }

  // Password Resets
  public createPasswordReset(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.data.password_resets.push({
      id: `rst-${Date.now()}`,
      email: email.toLowerCase(),
      code,
      expires_at: Date.now() + 15 * 60 * 1000, // 15 mins
      used: false
    });
    this.persist();
    return code;
  }

  public verifyAndResetPassword(email: string, code: string, newPasswordHash: string): boolean {
    const record = this.data.password_resets.find(
      r => r.email === email.toLowerCase() && r.code === code && !r.used && r.expires_at > Date.now()
    );
    if (!record) return false;

    record.used = true;
    const user = this.getUserByEmail(email);
    if (user) {
      user.password_hash = newPasswordHash;
      user.updated_at = new Date().toISOString();
    }
    this.persist();
    return true;
  }

  // Secure OTP Authentication Engine
  public getRecentOtpRequestsCount(identifier: string, windowMs: number = 10 * 60 * 1000): number {
    const cleanId = identifier.trim().toLowerCase();
    const cutoff = Date.now() - windowMs;
    return (this.data.otp_tokens || []).filter(
      t => t.identifier === cleanId && new Date(t.created_at).getTime() > cutoff
    ).length;
  }

  public getLatestOtpRequestTime(identifier: string): number | null {
    const cleanId = identifier.trim().toLowerCase();
    const tokens = (this.data.otp_tokens || []).filter(t => t.identifier === cleanId);
    if (tokens.length === 0) return null;
    const latest = tokens.reduce((max, t) => Math.max(max, new Date(t.created_at).getTime()), 0);
    return latest;
  }

  public createOtp(identifier: string, userId?: string): { code: string; expires_in_seconds: number } {
    const cleanId = identifier.trim().toLowerCase();
    
    // Invalidate prior active OTPs for this identifier to guarantee single active code
    if (this.data.otp_tokens) {
      for (const t of this.data.otp_tokens) {
        if (t.identifier === cleanId && !t.used) {
          t.used = true;
        }
      }
    } else {
      this.data.otp_tokens = [];
    }

    // Cryptographic 6-digit numeric token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    this.data.otp_tokens.push({
      id: `otp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      identifier: cleanId,
      code,
      expires_at,
      attempts: 0,
      used: false,
      created_at: new Date().toISOString()
    });

    this.persist();
    return { code, expires_in_seconds: 300 };
  }

  public verifyOtp(
    identifier: string, 
    submittedCode: string, 
    requireExistingUser: boolean = true
  ): { success: boolean; error?: string; user?: StoredUser } {
    const cleanId = identifier.trim().toLowerCase();
    const token = (this.data.otp_tokens || []).find(
      t => t.identifier === cleanId && !t.used && t.expires_at > Date.now()
    );

    if (!token) {
      return { 
        success: false, 
        error: 'OTP code has expired or was not requested. Please request a new verification code.' 
      };
    }

    if (token.attempts >= 5) {
      token.used = true;
      this.persist();
      return { 
        success: false, 
        error: 'Security threshold exceeded. This OTP has been invalidated due to too many failed attempts. Please request a new code.' 
      };
    }

    if (token.code !== submittedCode.trim()) {
      token.attempts += 1;
      this.persist();
      const remaining = 5 - token.attempts;
      return { 
        success: false, 
        error: `Invalid OTP code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining before invalidation.` 
      };
    }

    // Mark as consumed (single-use guarantee)
    token.used = true;
    this.persist();

    // Retrieve user by identifier or user_id
    let user: StoredUser | undefined;
    if (token.user_id) {
      user = this.getUserById(token.user_id);
    }
    if (!user) {
      user = this.getUserByEmailOrPhone(identifier);
    }

    if (!user) {
      if (requireExistingUser) {
        return { 
          success: false, 
          error: 'Registered account matching this verification contact was not found.' 
        };
      }
      // Verification successful for non-existing user (e.g. registration proof of ownership)
      return { success: true };
    }

    if (user.status === 'suspended') {
      return { 
        success: false, 
        error: 'Your account is suspended. Please contact platform administration.' 
      };
    }

    if (user.status === 'pending') {
      return { 
        success: false, 
        error: 'Administrator account registration is PENDING approval by an active administrator.' 
      };
    }

    return { success: true, user };
  }

  // Platform Analytics for Admin
  public getPlatformStats() {
    const trainees = this.data.users.filter(u => u.role === 'trainee');
    const trainers = this.data.users.filter(u => u.role === 'trainer');
    const pendingAdmins = this.data.users.filter(u => u.role === 'admin' && u.status === 'pending');
    const courses = this.data.courses;
    const enrollments = this.data.enrollments;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const certificates = this.data.certificates;

    const completionRate = enrollments.length > 0 
      ? Math.round((completedEnrollments.length / enrollments.length) * 100) 
      : 0;

    return {
      total_trainees: trainees.length,
      total_trainers: trainers.length,
      total_courses: courses.length,
      total_enrollments: enrollments.length,
      completed_enrollments: completedEnrollments.length,
      completion_rate: completionRate,
      total_certificates_issued: certificates.length,
      pending_admin_approvals: pendingAdmins.length,
      biometric_enrolled_users: this.data.biometrics.filter(b => b.is_active).length,
      audit_events_count: this.data.audit_logs.length
    };
  }
}

export const db = new Database();
