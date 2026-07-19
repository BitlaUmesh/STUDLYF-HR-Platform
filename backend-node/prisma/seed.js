const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear any existing data first to avoid duplicates
  await prisma.hackathonProject.deleteMany();
  await prisma.gitHubStats.deleteMany();
  await prisma.screeningResponse.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.message.deleteMany();
  await prisma.application.deleteMany();
  await prisma.student.deleteMany();

  const students = [
    {
      name: "Aarav Sharma",
      email: "aarav.sharma@studlyf.com",
      bio: "Passionate AIML developer specializing in deep learning and NLP.",
      skills: ["AIML", "Python", "TensorFlow", "NLP", "PyTorch"],
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
      linkedinUrl: "https://linkedin.com/in/aarav-sharma",
      portfolioUrl: "https://aarav.ai",
      githubUsername: "aarav-ai-dev",
      githubStats: {
        create: {
          topLanguages: { "Python": 65, "Jupyter Notebook": 20, "TypeScript": 15 },
          totalRepos: 18,
          totalStars: 45,
          totalCommits: 412,
          totalForks: 12
        }
      },
      projects: {
        create: [
          {
            name: "EduSynth - Personalized AI tutor",
            description: "An automated educational tool utilizing large language models to construct personalized learning syllabi.",
            hackathonName: "StudLyf AI Hackathon 2026",
            tags: ["LLM", "Next.js", "Python", "VectorDB"],
            juryRating: 9.6,
            repoUrl: "https://github.com/aarav-ai-dev/edusynth",
            demoUrl: "https://edusynth.studlyf.com"
          }
        ]
      }
    },
    {
      name: "Neha Patel",
      email: "neha.patel@studlyf.com",
      bio: "Creative frontend specialist focused on React/Next.js and Framer Motion.",
      skills: ["Frontend", "React", "Next.js", "TailwindCSS", "TypeScript"],
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
      linkedinUrl: "https://linkedin.com/in/neha-codes",
      portfolioUrl: "https://neha.dev",
      githubUsername: "neha-codes",
      githubStats: {
        create: {
          topLanguages: { "TypeScript": 55, "JavaScript": 30, "CSS": 15 },
          totalRepos: 24,
          totalStars: 88,
          totalCommits: 620,
          totalForks: 32
        }
      },
      projects: {
        create: [
          {
            name: "FluidDesign - Micro-animations",
            description: "A lightweight utility library enabling web developers to animate complex user actions.",
            hackathonName: "InnovateWeb 2025",
            tags: ["React", "TypeScript", "Framer Motion"],
            juryRating: 9.4,
            repoUrl: "https://github.com/neha-codes/fluiddesign",
            demoUrl: "https://fluid.neha.dev"
          }
        ]
      }
    },
    {
      name: "Vikram Malhotra",
      email: "vikram.malhotra@studlyf.com",
      bio: "Backend developer specializing in Distributed Systems, Go, and PostgreSQL.",
      skills: ["Backend", "Go", "Docker", "Kubernetes", "PostgreSQL"],
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      linkedinUrl: "https://linkedin.com/in/vikram-malhotra",
      portfolioUrl: "https://vikram.codes",
      githubUsername: "vikram-backend",
      githubStats: {
        create: {
          topLanguages: { "Go": 70, "Python": 20, "Shell": 10 },
          totalRepos: 32,
          totalStars: 120,
          totalCommits: 890,
          totalForks: 45
        }
      },
      projects: {
        create: [
          {
            name: "DistrLog - Distributed Log Pipeline",
            description: "A high-performance log forwarding system built in Go.",
            hackathonName: "DevOps & Cloud Con 2025",
            tags: ["Go", "gRPC", "Docker", "Logs"],
            juryRating: 9.1,
            repoUrl: "https://github.com/vikram-backend/distrlog"
          }
        ]
      }
    },
    {
      name: "Rohan Das",
      email: "rohan.das@studlyf.com",
      bio: "Fullstack developer with a passion for web apps, Tailwind CSS, and Node.js.",
      skills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
      githubUsername: "rohan-das-codes",
      githubStats: {
        create: {
          topLanguages: { "JavaScript": 60, "HTML": 25, "CSS": 15 },
          totalRepos: 15,
          totalStars: 12,
          totalCommits: 140,
          totalForks: 3
        }
      },
      projects: {
        create: [
          {
            name: "TaskFlow - Work Coordination App",
            description: "A collaborative Kanban-based project manager built with MERN stack.",
            hackathonName: "HackIIT 2026",
            tags: ["MERN", "Zustand", "TailwindCSS"],
            juryRating: 8.8,
            repoUrl: "https://github.com/rohan-das-codes/taskflow"
          }
        ]
      }
    },
    {
      name: "Ananya Sen",
      email: "ananya.sen@studlyf.com",
      bio: "Cybersecurity student interested in smart contracts, Solidity, and secure APIs.",
      skills: ["Solidity", "Rust", "Web3", "Blockchain", "TypeScript"],
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      githubUsername: "ananya-web3",
      githubStats: {
        create: {
          topLanguages: { "Solidity": 50, "Rust": 30, "TypeScript": 20 },
          totalRepos: 12,
          totalStars: 30,
          totalCommits: 220,
          totalForks: 8
        }
      },
      projects: {
        create: [
          {
            name: "TrustEscrow - Decentralized Escrow Protocol",
            description: "A secure escrow protocol executing smart contract-based payments.",
            hackathonName: "Web3Global Hackathon 2026",
            tags: ["Solidity", "Hardhat", "Ethereum"],
            juryRating: 9.3,
            repoUrl: "https://github.com/ananya-web3/trustescrow"
          }
        ]
      }
    }
  ];

  for (const student of students) {
    await prisma.student.create({ data: student });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
