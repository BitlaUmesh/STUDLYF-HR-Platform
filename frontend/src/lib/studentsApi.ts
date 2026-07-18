// API client for the STUDLYF HR "students" backend (backend-node / Prisma).
// Includes high-fidelity offline mock data fallbacks for all endpoints:
// search, profile, pipeline applications, questions, meetings, and messages.

export const STUDENTS_API_URL =
  process.env.NEXT_PUBLIC_STUDENTS_API_URL || "http://localhost:3001";

export interface StudentSearchResult {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  avatarUrl: string | null;
  githubUsername: string | null;
  topLanguages: Record<string, number>;
  projectCount: number;
  matchScore: number;
  leaderboardScore: number;
}

export interface StudentSearchResponse {
  results: StudentSearchResult[];
  total: number;
  keywords: string[];
}

export interface HackathonProject {
  id: string;
  name: string;
  description: string | null;
  hackathonName: string | null;
  tags: string[];
  juryRating: number | null;
  repoUrl: string | null;
  demoUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  juryFeedback?: string;
}

export interface GitHubStats {
  topLanguages: Record<string, number>;
  totalRepos: number;
  totalStars: number;
  totalCommits: number;
  totalForks: number;
  lastSyncedAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  skills: string[];
  interests?: string[] | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  githubUsername: string | null;
  githubStats: GitHubStats | null;
  projects: HackathonProject[];
  score: number;
  phone?: string;
  address?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE & MOCK STORAGE (Simulates real database behaviour offline)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PROFILES: Record<string, StudentProfile> = {
  "stud_1": {
    id: "stud_1",
    name: "Aarav Sharma",
    email: "aarav.sharma@studlyf.com",
    phone: "+91 9812345670",
    address: "Bengaluru, Karnataka, India",
    bio: "Passionate AIML developer specializing in building deep learning models, natural language processing pipelines, and integrating smart algorithms into web apps.",
    skills: ["AIML", "Python", "TensorFlow", "NLP", "PyTorch", "scikit-learn"],
    avatarUrl: null,
    linkedinUrl: "https://linkedin.com/in/aarav-sharma",
    portfolioUrl: "https://aarav.ai",
    githubUsername: "aarav-ai-dev",
    score: 96,
    githubStats: {
      topLanguages: { "Python": 65, "TypeScript": 15, "Jupyter Notebook": 20 },
      totalRepos: 18,
      totalStars: 45,
      totalCommits: 412,
      totalForks: 12,
      lastSyncedAt: new Date().toISOString()
    },
    projects: [
      {
        id: "p_1",
        name: "EduSynth - Personalized AI tutor",
        description: "An automated educational tool utilizing large language models to construct personalized learning syllabi and materials for university students.",
        hackathonName: "StudLyf AI Hackathon 2026",
        tags: ["LLM", "Next.js", "Python", "VectorDB"],
        juryRating: 9.6,
        repoUrl: "https://github.com/aarav-ai-dev/edusynth",
        demoUrl: "https://edusynth.studlyf.com",
        imageUrl: null,
        createdAt: new Date().toISOString(),
        juryFeedback: "Exceptional system design and robust integration of custom LLM embeddings for dynamic course generation."
      }
    ]
  },
  "stud_2": {
    id: "stud_2",
    name: "Neha Patel",
    email: "neha.patel@studlyf.com",
    phone: "+91 9934567891",
    address: "Mumbai, Maharashtra, India",
    bio: "Creative frontend specialist focused on writing clean, performant React/Next.js systems with stunning UI transitions and modern responsive design.",
    skills: ["Frontend", "React", "Next.js", "TailwindCSS", "TypeScript", "Framer Motion"],
    avatarUrl: null,
    linkedinUrl: "https://linkedin.com/in/neha-codes",
    portfolioUrl: "https://neha.dev",
    githubUsername: "neha-codes",
    score: 94,
    githubStats: {
      topLanguages: { "TypeScript": 55, "JavaScript": 30, "CSS": 15 },
      totalRepos: 24,
      totalStars: 88,
      totalCommits: 620,
      totalForks: 32,
      lastSyncedAt: new Date().toISOString()
    },
    projects: [
      {
        id: "p_2",
        name: "FluidDesign - Micro-animations Framework",
        description: "A lightweight utility library enabling web developers to animate complex user actions using hardware-accelerated CSS primitives.",
        hackathonName: "InnovateWeb 2025",
        tags: ["React", "TypeScript", "Framer Motion"],
        juryRating: 9.4,
        repoUrl: "https://github.com/neha-codes/fluiddesign",
        demoUrl: "https://fluid.neha.dev",
        imageUrl: null,
        createdAt: new Date().toISOString(),
        juryFeedback: "Brilliant fluid UX design. Highly performant and responsive components with great aesthetic value."
      }
    ]
  }
};

// Initialize applications mock store
let MOCK_APPLICATIONS: any[] = [
  {
    id: "app_1",
    hrId: "hr_1",
    studentId: "stud_1",
    status: "invited",
    notes: "Top AI candidate from hackathon",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    student: {
      id: "stud_1",
      name: "Aarav Sharma",
      email: "aarav.sharma@studlyf.com",
      skills: ["AIML", "Python", "TensorFlow"],
      avatarUrl: null,
      githubUsername: "aarav-ai-dev"
    },
    meeting: null
  }
];

// Initialize questions mock store
let MOCK_QUESTIONS: any[] = [
  {
    id: "q_1",
    hrId: "hr_1",
    question: "How would you optimize render performance in Next.js?",
    isTemplate: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "q_2",
    hrId: "hr_1",
    question: "Design a scalable embedding storage strategy for RAG applications.",
    isTemplate: true,
    createdAt: new Date().toISOString()
  }
];

let MOCK_RESPONSES: any[] = [];
let MOCK_MEETINGS: any[] = [];
let MOCK_MESSAGES: any[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// CORE FETCH CLIENT WITH MOCK INTERCEPTORS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchStudentsAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${STUDENTS_API_URL.replace(/\/$/, "")}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.warn(`[STUDLYF-API] Offline. Using offline mock interceptors.`, error);
    
    // 1. Search Interceptor
    if (endpoint.startsWith("/api/students/search")) {
      const urlObj = new URL(url);
      const q = urlObj.searchParams.get("q") || "";
      const keywords = q.split(",").map(k => k.trim().toLowerCase());
      
      const filtered = Object.values(MOCK_PROFILES).filter(student => 
        keywords.length === 0 || keywords.some(kw => 
          student.name.toLowerCase().includes(kw) ||
          student.bio?.toLowerCase().includes(kw) ||
          student.skills.some(s => s.toLowerCase().includes(kw))
        )
      );

      return {
        results: filtered.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          bio: student.bio,
          skills: student.skills,
          avatarUrl: student.avatarUrl,
          githubUsername: student.githubUsername,
          topLanguages: student.githubStats?.topLanguages || {},
          projectCount: student.projects.length,
          matchScore: 95,
          leaderboardScore: student.score
        })),
        total: filtered.length,
        keywords: keywords
      };
    }

    // 2. Student Profile Interceptor
    const profileMatch = endpoint.match(/\/api\/students\/([^\/]+)/);
    if (profileMatch && !endpoint.includes("applications")) {
      const studentId = profileMatch[1];
      if (MOCK_PROFILES[studentId]) {
        return MOCK_PROFILES[studentId];
      }
      throw new Error("Student profile not found in mocks.");
    }

    // 3. Applications Invite Interceptor
    const inviteMatch = endpoint.match(/\/api\/applications\/invite\/([^\/]+)/);
    if (inviteMatch && options.method === "POST") {
      const studentId = inviteMatch[1];
      const studentProfile = MOCK_PROFILES[studentId];
      if (!studentProfile) throw new Error("Student not found.");
      
      const existing = MOCK_APPLICATIONS.find(a => a.studentId === studentId);
      if (existing) return existing;

      const newApp = {
        id: `app_${Math.random().toString(36).substr(2, 9)}`,
        hrId: "hr_1",
        studentId: studentId,
        status: "invited",
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        student: {
          id: studentProfile.id,
          name: studentProfile.name,
          email: studentProfile.email,
          skills: studentProfile.skills,
          avatarUrl: studentProfile.avatarUrl,
          githubUsername: studentProfile.githubUsername
        },
        meeting: null
      };
      MOCK_APPLICATIONS.push(newApp);
      return newApp;
    }

    // 4. Applications List Interceptor
    if (endpoint.startsWith("/api/applications") && !endpoint.includes("status")) {
      const urlObj = new URL(url);
      const status = urlObj.searchParams.get("status");
      
      // Match individual get application
      const appGetMatch = endpoint.match(/\/api\/applications\/([^\/]+)$/);
      if (appGetMatch) {
        const appId = appGetMatch[1];
        const found = MOCK_APPLICATIONS.find(a => a.id === appId);
        if (found) return found;
        throw new Error("Application not found.");
      }

      if (status) {
        return MOCK_APPLICATIONS.filter(a => a.status === status);
      }
      return MOCK_APPLICATIONS;
    }

    // 5. Update Application Status Interceptor
    const statusMatch = endpoint.match(/\/api\/applications\/([^\/]+)\/status$/);
    if (statusMatch && options.method === "PATCH") {
      const appId = statusMatch[1];
      const payload = JSON.parse(options.body as string);
      
      const idx = MOCK_APPLICATIONS.findIndex(a => a.id === appId);
      if (idx !== -1) {
        MOCK_APPLICATIONS[idx] = {
          ...MOCK_APPLICATIONS[idx],
          status: payload.status,
          notes: payload.notes || MOCK_APPLICATIONS[idx].notes,
          updatedAt: new Date().toISOString()
        };
        return MOCK_APPLICATIONS[idx];
      }
      throw new Error("Application not found.");
    }

    // 6. Screening Questions Interceptor
    if (endpoint.startsWith("/api/questions")) {
      if (options.method === "POST" && !endpoint.includes("assign")) {
        const payload = JSON.parse(options.body as string);
        const newQuestion = {
          id: `q_${Math.random().toString(36).substr(2, 9)}`,
          hrId: "hr_1",
          question: payload.question,
          isTemplate: payload.isTemplate,
          createdAt: new Date().toISOString()
        };
        MOCK_QUESTIONS.push(newQuestion);
        return newQuestion;
      }
      
      if (options.method === "DELETE") {
        const qIdMatch = endpoint.match(/\/api\/questions\/([^\/]+)$/);
        if (qIdMatch) {
          const qId = qIdMatch[1];
          MOCK_QUESTIONS = MOCK_QUESTIONS.filter(q => q.id !== qId);
          return { message: "Question deleted successfully." };
        }
      }

      if (options.method === "POST" && endpoint.includes("assign")) {
        const appIdMatch = endpoint.match(/\/api\/questions\/assign\/([^\/]+)$/);
        if (appIdMatch) {
          const appId = appIdMatch[1];
          const payload = JSON.parse(options.body as string);
          
          // Create blank screening responses
          payload.questionIds.forEach((qId: string) => {
            const questionObj = MOCK_QUESTIONS.find(q => q.id === qId);
            if (questionObj) {
              MOCK_RESPONSES.push({
                id: `resp_${Math.random().toString(36).substr(2, 9)}`,
                applicationId: appId,
                questionId: qId,
                answer: null,
                submittedAt: new Date().toISOString(),
                question: questionObj
              });
            }
          });

          // Move candidate status to questions_sent in simulation
          const appIdx = MOCK_APPLICATIONS.findIndex(a => a.id === appId);
          if (appIdx !== -1) {
            MOCK_APPLICATIONS[appIdx].status = "questions_sent";
          }
          return { message: "Questions assigned successfully." };
        }
      }

      if (endpoint.includes("responses")) {
        const appIdMatch = endpoint.match(/\/api\/questions\/responses\/([^\/]+)$/);
        if (appIdMatch) {
          const appId = appIdMatch[1];
          return MOCK_RESPONSES.filter(r => r.applicationId === appId);
        }
      }

      return MOCK_QUESTIONS;
    }

    // 7. Meetings Interceptor
    if (endpoint.startsWith("/api/meetings")) {
      if (options.method === "POST") {
        const payload = JSON.parse(options.body as string);
        const newMeeting = {
          id: `meet_${Math.random().toString(36).substr(2, 9)}`,
          hrId: "hr_1",
          applicationId: payload.applicationId,
          title: payload.title,
          description: payload.description || null,
          scheduledAt: payload.startTime || new Date().toISOString(),
          calendlyEventUrl: "https://calendly.com/mock-event",
          status: "scheduled",
          createdAt: new Date().toISOString()
        };
        MOCK_MEETINGS.push(newMeeting);
        
        // Update meeting state inside the application
        const appIdx = MOCK_APPLICATIONS.findIndex(a => a.id === payload.applicationId);
        if (appIdx !== -1) {
          MOCK_APPLICATIONS[appIdx].meeting = {
            id: newMeeting.id,
            status: newMeeting.status,
            scheduledAt: newMeeting.scheduledAt,
            calendlyEventUrl: newMeeting.calendlyEventUrl
          };
        }

        return newMeeting;
      }

      if (options.method === "DELETE") {
        const meetIdMatch = endpoint.match(/\/api\/meetings\/([^\/]+)$/);
        if (meetIdMatch) {
          const meetId = meetIdMatch[1];
          MOCK_MEETINGS = MOCK_MEETINGS.filter(m => m.id !== meetId);
          return { message: "Meeting cancelled successfully." };
        }
      }
    }

    // 8. Messages Interceptor
    if (endpoint.startsWith("/api/messages")) {
      if (options.method === "POST") {
        const payload = JSON.parse(options.body as string);
        const newMsg = {
          id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          hrId: "hr_1",
          studentId: payload.studentId,
          content: payload.content,
          isRead: false,
          sentAt: new Date().toISOString()
        };
        MOCK_MESSAGES.push(newMsg);
        return newMsg;
      }

      if (endpoint.includes("conversations")) {
        const conversations = Object.values(MOCK_PROFILES).map(student => {
          const studentMsgs = MOCK_MESSAGES.filter(m => m.studentId === student.id);
          if (studentMsgs.length === 0) return null;
          return {
            student: { id: student.id, name: student.name, avatarUrl: student.avatarUrl },
            lastMessage: studentMsgs[studentMsgs.length - 1],
            unreadCount: 0
          };
        }).filter(Boolean);
        return conversations;
      }

      const studIdMatch = endpoint.match(/\/api\/messages\/([^\/]+)$/);
      if (studIdMatch) {
        const studentId = studIdMatch[1];
        return MOCK_MESSAGES.filter(m => m.studentId === studentId);
      }
    }

    throw new Error(`API Endpoint ${endpoint} unreachable.`);
  }
}

export function searchStudents(keywords: string[]): Promise<StudentSearchResponse> {
  const q = encodeURIComponent(keywords.join(","));
  return fetchStudentsAPI(`/api/students/search?q=${q}`);
}

export function getStudentProfile(studentId: string): Promise<StudentProfile> {
  return fetchStudentsAPI(`/api/students/${studentId}`);
}
