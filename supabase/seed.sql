-- ====================================================================
-- Capacity Connect: Safe Production Seed Data
-- Initial curriculum, competency modules, assessments, and sample catalog
-- ====================================================================

-- 1. Initial Courses Catalog (Published)
INSERT INTO public.courses (
    id,
    title,
    description,
    category,
    level,
    trainer_id,
    duration_hours,
    capacity,
    enrolled_count,
    status,
    skills_acquired,
    modules
) VALUES 
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Advanced Cloud Infrastructure & Microservices Architecture',
    'Master container orchestration, serverless execution pipelines, multi-region scalability, and zero-trust perimeter network security for large-scale enterprise deployments.',
    'Cloud & DevOps',
    'Advanced',
    '00000000-0000-0000-0000-000000000002', -- Master Trainer ID
    40,
    60,
    18,
    'published',
    ARRAY['Docker', 'Kubernetes', 'Cloud Run', 'Microservices', 'Terraform', 'Observability'],
    '[
        {"id": "m1", "title": "1. Cloud Native Foundations & Containerization Standards", "duration": "8h", "completed": true},
        {"id": "m2", "title": "2. Production Kubernetes & Mesh Networking", "duration": "12h", "completed": false},
        {"id": "m3", "title": "3. Zero-Trust Cloud Security & Secret Management", "duration": "10h", "completed": false},
        {"id": "m4", "title": "4. Automated CI/CD Pipelines & Site Reliability Engineering", "duration": "10h", "completed": false}
    ]'::jsonb
),
(
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Generative AI Systems, Prompt Engineering & Agentic Workflows',
    'Design and deploy production AI agents, retrieval-augmented generation (RAG) knowledge retrieval pipelines, tool calling systems, and LLM governance frameworks.',
    'Artificial Intelligence',
    'Intermediate',
    '00000000-0000-0000-0000-000000000002',
    32,
    80,
    29,
    'published',
    ARRAY['Gemini API', 'Vector Databases', 'RAG', 'Agentic Patterns', 'Safety Guardrails'],
    '[
        {"id": "m1", "title": "1. LLM Core Architectures & Foundation Models", "duration": "6h", "completed": true},
        {"id": "m2", "title": "2. RAG Pipelines & Vector Embeddings", "duration": "10h", "completed": true},
        {"id": "m3", "title": "3. Multi-Turn AI Agents & Tool Execution", "duration": "10h", "completed": false},
        {"id": "m4", "title": "4. Enterprise Deployment & Evaluation Metrics", "duration": "6h", "completed": false}
    ]'::jsonb
),
(
    'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f',
    'Cybersecurity Defense, Threat Hunting & Incident Response',
    'Hands-on technical defense protocols, incident triage, biometric security enforcement, vulnerability mitigation, and automated threat defense systems.',
    'Cybersecurity',
    'Beginner',
    '00000000-0000-0000-0000-000000000002',
    24,
    50,
    14,
    'published',
    ARRAY['Network Defense', 'Incident Response', 'Biometric Auth', 'Vulnerability Assessment'],
    '[
        {"id": "m1", "title": "1. Threat Landscape & Attack Surfaces", "duration": "6h", "completed": false},
        {"id": "m2", "title": "2. Network Telemetry & Intrusion Detection", "duration": "8h", "completed": false},
        {"id": "m3", "title": "3. Incident Containment & Forensic Analysis", "duration": "10h", "completed": false}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2. Initial Assessment
INSERT INTO public.assessments (
    id,
    course_id,
    title,
    description,
    time_limit_minutes,
    passing_score,
    questions
) VALUES (
    'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Cloud Architecture & Microservices Certification Exam',
    'Demonstrate mastery of modern distributed systems, security policies, and zero-downtime rolling updates.',
    30,
    75,
    '[
        {
            "id": 1,
            "question": "Which HTTP status code is most appropriate when a required JWT token is malformed or invalid?",
            "options": ["400 Bad Request", "401 Unauthorized", "403 Forbidden", "500 Internal Server Error"],
            "correct_answer": 1,
            "explanation": "401 Unauthorized indicates the client must authenticate with valid credentials."
        },
        {
            "id": 2,
            "question": "In a zero-trust network model, which premise is foundational?",
            "options": [
                "Traffic within the internal network perimeter is trusted by default",
                "Every request must be authenticated, authorized, and continuously validated regardless of network location",
                "Firewall rules only apply at ingress ports",
                "Service-to-service communication does not require mTLS"
            ],
            "correct_answer": 1,
            "explanation": "Zero Trust assumes breach and verifies every transaction explicitly."
        },
        {
            "id": 3,
            "question": "Why are 128-dimensional facial biometric vectors compared using cosine similarity rather than raw Euclidean distance?",
            "options": [
                "Cosine similarity measures the orientation/angle of normalized embedding vectors, invariant to facial lighting scaling",
                "Euclidean distance cannot operate in more than 3 dimensions",
                "Cosine similarity requires less memory",
                "It eliminates the need for camera calibration"
            ],
            "correct_answer": 0,
            "explanation": "Cosine similarity measures angular alignment between normalized deep embeddings."
        }
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
