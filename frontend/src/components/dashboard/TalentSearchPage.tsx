"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Calendar, Mail, FileText, Star, Award, 
  SlidersHorizontal, Plus, X, ChevronRight, Sparkles, 
  Clock, MapPin, MessageSquare, BookOpen, Send, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAPI } from "@/lib/api";

const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// High-fidelity Mock Student Database
interface HackathonProject {
  name: string;
  projectName: string;
  rating: number;
  juryFeedback: string;
  status: "Winner" | "Runner Up" | "Participant" | "Finalist";
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  designation: string;
  primarySkills: string[];
  allSkills: string[];
  interests: string[];
  bio: string;
  github: {
    username: string;
    languages: { name: string; percentage: number; color: string }[];
    totalCommits: number;
    repos: number;
    contributions: number;
  };
  hackathons: HackathonProject[];
}

const MOCK_STUDENTS: Student[] = [
  {
    id: "stud_1",
    name: "Aarav Sharma",
    email: "aarav.sharma@studlyf.com",
    phone: "+91 9812345670",
    address: "Bengaluru, Karnataka, India",
    avatar: "AS",
    designation: "AIML & Python Intern",
    primarySkills: ["AIML", "Python", "TensorFlow", "NLP"],
    allSkills: ["AIML", "Python", "TensorFlow", "NLP", "PyTorch", "scikit-learn", "Flask", "SQL"],
    interests: ["Deep Learning", "Generative AI", "Data Analysis", "Robotics"],
    bio: "Passionate AIML developer specializing in building deep learning models, natural language processing pipelines, and integrating smart algorithms into web apps.",
    github: {
      username: "aarav-ai-dev",
      languages: [
        { name: "Python", percentage: 65, color: "#3572A5" },
        { name: "Jupyter Notebook", percentage: 20, color: "#DA5B0B" },
        { name: "TypeScript", percentage: 10, color: "#3178C6" },
        { name: "Others", percentage: 5, color: "#89e051" }
      ],
      totalCommits: 412,
      repos: 18,
      contributions: 54
    },
    hackathons: [
      {
        name: "StudLyf AI Hackathon 2026",
        projectName: "EduSynth - Personalized AI tutor",
        rating: 9.6,
        juryFeedback: "Exceptional system design and robust integration of custom LLM embeddings for dynamic course generation.",
        status: "Winner"
      },
      {
        name: "Smart India Hackathon",
        projectName: "KrishiAI - Smart crop yield predictive engine",
        rating: 8.8,
        juryFeedback: "High accuracy model; frontend UI was sleek, and data-gathering strategy was very impressive.",
        status: "Finalist"
      }
    ]
  },
  {
    id: "stud_2",
    name: "Neha Patel",
    email: "neha.patel@studlyf.com",
    phone: "+91 9934567891",
    address: "Mumbai, Maharashtra, India",
    avatar: "NP",
    designation: "Frontend Engineer Intern",
    primarySkills: ["Frontend", "React", "Next.js", "TailwindCSS"],
    allSkills: ["Frontend", "React", "Next.js", "TailwindCSS", "TypeScript", "Redux", "Framer Motion", "Vite"],
    interests: ["Interactive Web Design", "Design Systems", "Web Performance", "Creative Coding"],
    bio: "Creative frontend specialist focused on writing clean, performant React/Next.js systems with stunning UI transitions and modern responsive design.",
    github: {
      username: "neha-codes",
      languages: [
        { name: "TypeScript", percentage: 55, color: "#3178C6" },
        { name: "JavaScript", percentage: 30, color: "#f1e05a" },
        { name: "CSS", percentage: 12, color: "#563d7c" },
        { name: "HTML", percentage: 3, color: "#e34c26" }
      ],
      totalCommits: 620,
      repos: 24,
      contributions: 89
    },
    hackathons: [
      {
        name: "InnovateWeb 2025",
        projectName: "FluidDesign - Micro-animations Framework",
        rating: 9.4,
        juryFeedback: "Brilliant fluid UX design. Highly performant and responsive components with great aesthetic value.",
        status: "Winner"
      },
      {
        name: "StudLyf National Hackathon v2",
        projectName: "MedConnect - Quick Healthcare Finder",
        rating: 8.9,
        juryFeedback: "Excellent routing logic and very neat layout. The dashboard felt production-ready.",
        status: "Runner Up"
      }
    ]
  },
  {
    id: "stud_3",
    name: "Rohan Das",
    email: "rohan.das@studlyf.com",
    phone: "+91 8876543210",
    address: "Kolkata, West Bengal, India",
    avatar: "RD",
    designation: "Fullstack Developer Intern",
    primarySkills: ["Node.js", "Express", "MongoDB", "React"],
    allSkills: ["Node.js", "Express", "MongoDB", "React", "Next.js", "GraphQL", "Docker", "PostgreSQL"],
    interests: ["Backend Architecture", "API Design", "Distributed Systems", "Cloud Infrastructure"],
    bio: "Fullstack JavaScript developer specializing in scalable MERN applications, secure backend APIs, and database indexing strategies.",
    github: {
      username: "rohandas-dev",
      languages: [
        { name: "JavaScript", percentage: 48, color: "#f1e05a" },
        { name: "TypeScript", percentage: 32, color: "#3178C6" },
        { name: "HTML", percentage: 10, color: "#e34c26" },
        { name: "Python", percentage: 10, color: "#3572A5" }
      ],
      totalCommits: 389,
      repos: 15,
      contributions: 42
    },
    hackathons: [
      {
        name: "CodeFast 24-Hour Sprint",
        projectName: "SecureShare - End-to-end encrypted messaging",
        rating: 9.1,
        juryFeedback: "Secure implementation of websocket channels and excellent performance under load testing.",
        status: "Runner Up"
      }
    ]
  },
  {
    id: "stud_4",
    name: "Ananya Iyer",
    email: "ananya.iyer@studlyf.com",
    phone: "+91 9776655443",
    address: "Chennai, Tamil Nadu, India",
    avatar: "AI",
    designation: "AIML Researcher",
    primarySkills: ["AIML", "Python", "Computer Vision", "PyTorch"],
    allSkills: ["AIML", "Python", "Computer Vision", "PyTorch", "OpenCV", "FastAPI", "AWS", "Numpy"],
    interests: ["Computer Vision", "Medical Imaging", "Edge Computing", "Open Source Contribution"],
    bio: "AIML enthusiast focused on edge computing applications, visual object classification, and medical imaging diagnostics models.",
    github: {
      username: "ananya-iyer-ai",
      languages: [
        { name: "Python", percentage: 80, color: "#3572A5" },
        { name: "C++", percentage: 15, color: "#f34b7d" },
        { name: "CMake", percentage: 5, color: "#DA5B0B" }
      ],
      totalCommits: 520,
      repos: 19,
      contributions: 61
    },
    hackathons: [
      {
        name: "BioTech AI Summit 2025",
        projectName: "ScanCare - MRI anomaly detection system",
        rating: 9.7,
        juryFeedback: "Outstanding model design and training details. Real-world social impact is massive.",
        status: "Winner"
      }
    ]
  }
];

export default function TalentSearchPage() {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);

  // Selected Student for Drawer
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Tab State in Student Detail
  const [activeDetailTab, setActiveDetailTab] = useState<"github" | "hackathons" | "hiring">("github");

  // Questionnaire State
  const [customQuestionInput, setCustomQuestionInput] = useState("");
  const [customQuestions, setCustomQuestions] = useState<{ [studentId: string]: string[] }>({
    stud_1: ["Write a script to clean user input strings and convert dates to ISO.", "Explain how you would handle imbalanced classes in classifier training."],
    stud_2: ["How do you optimize render performance in Next.js?", "Implement a custom hook to detect window breakpoints."]
  });

  // Schedule Meeting State
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("Technical Assessment Discussion");
  const [meetingType, setMeetingType] = useState("Google Meet");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  // Pre-filled Document Generation State
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<string | null>(null);

  // Filter skills list
  const uniqueSkills = Array.from(
    new Set(MOCK_STUDENTS.flatMap((s) => s.primarySkills))
  );

  // Filtered Students list
  const filteredStudents = MOCK_STUDENTS.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.allSkills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
      student.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkill = selectedSkillFilter ? student.primarySkills.includes(selectedSkillFilter) : true;

    return matchesSearch && matchesSkill;
  });

  // Add Custom Question
  const handleAddQuestion = () => {
    if (!selectedStudent || !customQuestionInput.trim()) return;
    const studentId = selectedStudent.id;
    const currentQuestions = customQuestions[studentId] || [];
    setCustomQuestions({
      ...customQuestions,
      [studentId]: [...currentQuestions, customQuestionInput.trim()]
    });
    setCustomQuestionInput("");
  };

  // Delete Custom Question
  const handleDeleteQuestion = (idxToDelete: number) => {
    if (!selectedStudent) return;
    const studentId = selectedStudent.id;
    const currentQuestions = customQuestions[studentId] || [];
    setCustomQuestions({
      ...customQuestions,
      [studentId]: currentQuestions.filter((_, idx) => idx !== idxToDelete)
    });
  };

  // Handle Schedule Submit
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime) return;
    
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setScheduledSuccess(true);
      setTimeout(() => {
        setScheduledSuccess(false);
        setMeetingDate("");
        setMeetingTime("");
      }, 3500);
    }, 1500);
  };

  // Create Document with Pre-filled Student Details
  const handleGenerateDocument = async (student: Student, type: 'offer' | 'joining') => {
    try {
      setIsGeneratingDoc(type);
      
      const doc = await fetchAPI('/api/documents/create', {
        method: 'POST',
        body: JSON.stringify({
          title: `Prefilled ${type === 'offer' ? 'Offer' : 'Joining'} Letter - ${student.name}`,
          type: type,
          status: 'draft',
          candidateDetails: {
            candidateName: student.name,
            candidateEmail: student.email,
            candidatePhone: student.phone,
            candidateAddress: student.address,
            jobTitle: student.designation,
            companyName: "Studlyf Inc.",
            salary: type === 'offer' ? "₹8,00,000 Per Annum" : "",
            joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
            customNotes: `Pre-hiring screening custom questions passed: \n${(customQuestions[student.id] || []).map((q, i) => `${i+1}. ${q}`).join('\n')}`
          },
          contentJSON: { html: '' }
        })
      });

      router.push(`/dashboard/builder/${doc.id}`);
    } catch (err) {
      console.error("Failed to prefill document", err);
    } finally {
      setIsGeneratingDoc(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 relative">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Talent Discovery <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
          </h1>
          <p className="text-slate-500 mt-1">Discover, evaluate, and hire matching StudLyf students for your firm.</p>
        </div>
      </div>

      {/* Search and Tag Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by keywords (e.g. AIML, Frontend, React, bio, name...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 transition-all font-medium"
            />
          </div>
          
          <div className="flex gap-2 shrink-0 self-stretch sm:self-center justify-end">
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedSkillFilter(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Skill Filters */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center mr-2">Quick Filters:</span>
          <button
            onClick={() => setSelectedSkillFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSkillFilter === null 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Talent
          </button>
          {uniqueSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => setSelectedSkillFilter(skill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedSkillFilter === skill 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Main Student Cards Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div 
              key={student.id}
              onClick={() => {
                setSelectedStudent(student);
                setActiveDetailTab("github");
              }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col cursor-pointer group hover:border-indigo-300"
            >
              {/* Profile Card Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold rounded-xl flex items-center justify-center text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {student.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base tracking-tight">{student.name}</h3>
                    <p className="text-xs font-semibold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded border border-indigo-100/50 inline-block mt-0.5">{student.designation}</p>
                  </div>
                </div>
                
                {/* Top Hackathon Rating */}
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{student.hackathons[0]?.rating || "N/A"}</span>
                </div>
              </div>

              {/* Bio snippet */}
              <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
                {student.bio}
              </p>

              {/* Primary skills */}
              <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                {student.primarySkills.map((skill) => (
                  <span key={skill} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>

              {/* GitHub Mini Progress bar */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold mb-1.5">
                  <span className="flex items-center gap-1"><GithubIcon className="w-3.5 h-3.5" /> Language Focus</span>
                  <span className="text-slate-600">{student.github.languages[0]?.name}: {student.github.languages[0]?.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  {student.github.languages.map((lang, idx) => (
                    <div 
                      key={idx}
                      style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                      className="h-full"
                      title={`${lang.name}: ${lang.percentage}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 flex items-center justify-end text-xs font-bold text-indigo-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Inspect Profile <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm">
          <SlidersHorizontal className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-slate-800 mb-2">No Students Found</h3>
          <p className="text-slate-500 text-sm">We couldn't find any students matching your criteria. Try adjusting your search query or reset the filters.</p>
        </div>
      )}

      {/* Interactive Detail Drawer Backdrop */}
      <AnimatePresence>
        {selectedStudent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-slate-900 z-50 pointer-events-auto"
            />
            
            {/* Slide-out Drawer (650px wide) */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col pointer-events-auto border-l border-slate-200"
            >
              
              {/* Drawer Header */}
              <div className="p-6 bg-slate-900 text-white flex items-start justify-between relative shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-white text-2xl border border-white/20">
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{selectedStudent.name}</h2>
                    <p className="text-indigo-300 font-semibold text-sm mt-0.5">{selectedStudent.designation}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedStudent.address.split(",")[0]}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedStudent.email}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 px-6 shrink-0 bg-slate-50">
                <button 
                  onClick={() => setActiveDetailTab("github")}
                  className={`py-4 px-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-colors flex items-center gap-2 ${
                    activeDetailTab === "github" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <GithubIcon className="w-4 h-4" /> GitHub Analysis
                </button>
                <button 
                  onClick={() => setActiveDetailTab("hackathons")}
                  className={`py-4 px-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-colors flex items-center gap-2 ${
                    activeDetailTab === "hackathons" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Award className="w-4 h-4" /> Hackathons & Ratings
                </button>
                <button 
                  onClick={() => setActiveDetailTab("hiring")}
                  className={`py-4 px-4 border-b-2 text-xs font-extrabold tracking-wider uppercase transition-colors flex items-center gap-2 ${
                    activeDetailTab === "hiring" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> Interview & Hire
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 p-6 overflow-y-auto">
                
                {/* 1. GITHUB ANALYTICS */}
                {activeDetailTab === "github" && (
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student About</h4>
                      <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedStudent.bio}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Repositories</span>
                        <div className="text-2xl font-black text-slate-800 mt-1">{selectedStudent.github.repos}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Commits This Year</span>
                        <div className="text-2xl font-black text-slate-800 mt-1">{selectedStudent.github.totalCommits}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Contributions</span>
                        <div className="text-2xl font-black text-slate-800 mt-1">{selectedStudent.github.contributions}</div>
                      </div>
                    </div>

                    {/* Detailed Language Bar */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Language Focus Share</h4>
                      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4">
                        {selectedStudent.github.languages.map((lang, idx) => (
                          <div 
                            key={idx}
                            style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                            className="h-full"
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {selectedStudent.github.languages.map((lang, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span style={{ backgroundColor: lang.color }} className="w-3.5 h-3.5 rounded-full" />
                              <span className="text-slate-700 text-sm font-semibold">{lang.name}</span>
                            </div>
                            <span className="text-slate-500 font-bold text-sm">{lang.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Student Interests Tag Cloud */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Academic & Career Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.interests.map((interest) => (
                          <span key={interest} className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. HACKATHONS */}
                {activeDetailTab === "hackathons" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Hackathon Projects & Prototypes</h4>
                      
                      <div className="space-y-4">
                        {selectedStudent.hackathons.map((h, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            {/* Hackathon title header */}
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event</span>
                                <h5 className="font-bold text-slate-900 text-sm mt-0.5">{h.name}</h5>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                h.status === "Winner" 
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : h.status === "Runner Up"
                                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                              }`}>
                                {h.status}
                              </span>
                            </div>

                            {/* Project details */}
                            <div className="p-4 space-y-4">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project / Prototype</span>
                                <h6 className="font-bold text-indigo-600 text-sm mt-0.5">{h.projectName}</h6>
                              </div>

                              {/* Rating details */}
                              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150">
                                <div className="flex items-center gap-1 text-amber-700 font-extrabold text-lg">
                                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                                  <span>{h.rating}</span>
                                  <span className="text-slate-400 text-xs font-semibold">/10</span>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jury Classification</span>
                                  <p className="text-slate-700 font-bold text-xs mt-0.5">High Potential Candidate</p>
                                </div>
                              </div>

                              {/* Feedback comments */}
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jury Evaluation Remarks</span>
                                <p className="text-slate-600 text-xs leading-relaxed mt-1 italic">
                                  "{h.juryFeedback}"
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. INTERVIEW & HIRE */}
                {activeDetailTab === "hiring" && (
                  <div className="space-y-6">
                    {/* Custom Screening Questions */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                        Pre-hiring Screening Questions <MessageSquare className="w-4 h-4 text-slate-600" />
                      </h4>
                      <p className="text-slate-500 text-xs mb-4">Add customized screening questions that will be embedded into the candidate's documentation.</p>

                      <div className="space-y-2 mb-4">
                        {(customQuestions[selectedStudent.id] || []).map((q, idx) => (
                          <div key={idx} className="flex items-start justify-between bg-white p-3 rounded-xl border border-slate-200 gap-3">
                            <span className="text-slate-800 text-xs font-semibold leading-relaxed">
                              {idx + 1}. {q}
                            </span>
                            <button 
                              onClick={() => handleDeleteQuestion(idx)}
                              className="text-slate-400 hover:text-red-500 p-0.5 shrink-0 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Implement a basic function to debouncing user search keypress events" 
                          value={customQuestionInput}
                          onChange={(e) => setCustomQuestionInput(e.target.value)}
                          className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 bg-white"
                        />
                        <button 
                          onClick={handleAddQuestion}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>

                    {/* Schedule Meeting & Contact */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                        Schedule Technical Interview <Calendar className="w-4 h-4 text-slate-600" />
                      </h4>
                      <p className="text-slate-500 text-xs mb-4">Send direct invitations and schedule mock/real meetings dynamically.</p>

                      {scheduledSuccess ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center gap-3 text-xs font-semibold mb-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Meeting Scheduled! Invitation email sent to {selectedStudent.email} with link!</span>
                        </div>
                      ) : (
                        <form onSubmit={handleScheduleSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Date</label>
                              <input 
                                type="date" 
                                required
                                value={meetingDate}
                                onChange={(e) => setMeetingDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 bg-slate-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Time</label>
                              <input 
                                type="time" 
                                required
                                value={meetingTime}
                                onChange={(e) => setMeetingTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 bg-slate-50"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meeting Mode</label>
                              <select 
                                value={meetingType}
                                onChange={(e) => setMeetingType(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 bg-slate-50"
                              >
                                <option>Google Meet</option>
                                <option>Zoom Call</option>
                                <option>On-site Interview</option>
                                <option>Direct Telephonic</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                              <input 
                                type="text"
                                required
                                value={meetingTitle}
                                onChange={(e) => setMeetingTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 bg-slate-50"
                              />
                            </div>
                          </div>

                          <button 
                            type="submit" 
                            disabled={isScheduling}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            {isScheduling ? "Scheduling..." : "Schedule Meeting & Invite"} <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Pre-fill Document Integrator */}
                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-left">
                        <h4 className="font-bold text-slate-900 text-sm mb-0.5 flex items-center gap-1.5">
                          Direct Hiring Integration <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                        </h4>
                        <p className="text-slate-500 text-xs max-w-sm">Automatically generate pre-filled Offer or Joining letters including custom interview questions.</p>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                        <button 
                          onClick={() => handleGenerateDocument(selectedStudent, 'offer')}
                          disabled={isGeneratingDoc !== null}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-4 h-4" /> 
                          {isGeneratingDoc === 'offer' ? "Generating..." : "Offer Letter"}
                        </button>
                        <button 
                          onClick={() => handleGenerateDocument(selectedStudent, 'joining')}
                          disabled={isGeneratingDoc !== null}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Award className="w-4 h-4" /> 
                          {isGeneratingDoc === 'joining' ? "Generating..." : "Joining Letter"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
