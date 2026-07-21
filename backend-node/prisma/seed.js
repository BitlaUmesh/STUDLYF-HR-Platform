const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up
  console.log('🧹 Cleaning database...');
  await prisma.message.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.screeningResponse.deleteMany();
  await prisma.screeningQuestion.deleteMany();
  await prisma.application.deleteMany();
  await prisma.recentEdit.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.template.deleteMany();
  await prisma.companyBranding.deleteMany();
  await prisma.gitHubStats.deleteMany();
  await prisma.hackathonProject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed 7 Users (HRs)
  console.log('👤 Seeding Users...');
  const users = [];
  const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Netflix', 'Microsoft', 'Tesla'];
  const designations = ['HR Manager', 'Talent Acquisition', 'Recruiting Lead', 'HR Director', 'Senior Recruiter', 'Head of People', 'Talent Scout'];
  for (let i = 1; i <= 7; i++) {
    const user = await prisma.user.create({
      data: {
        fullName: `HR Manager ${i}`,
        email: `hr${i}@${companies[i-1].toLowerCase()}.com`,
        hashedPassword: hashedPassword,
        companyName: companies[i-1],
        designation: designations[i-1],
        phone: `+1555010${i}`,
        address: `${100 * i} Tech Park Dr`,
        city: 'Silicon Valley',
        state: 'CA',
        country: 'USA',
        companyAddress: `${100 * i} Corporate Boulevard`,
        companyPhone: `+18005550${i}`,
        companyEmail: `info@${companies[i-1].toLowerCase()}.com`,
        companyWebsite: `https://www.${companies[i-1].toLowerCase()}.com`,
      }
    });
    users.push(user);
  }

  // 2. Seed 7 Company Brandings
  console.log('🎨 Seeding Company Brandings...');
  const brandings = [];
  const primaryColors = ['#4285F4', '#1877F2', '#FF9900', '#000000', '#E50914', '#00A4EF', '#CC0000'];
  const secondaryColors = ['#34A853', '#3B5998', '#146EB4', '#555555', '#B81D24', '#F25022', '#333333'];
  for (let i = 1; i <= 7; i++) {
    const branding = await prisma.companyBranding.create({
      data: {
        userId: users[i-1].id,
        primaryColor: primaryColors[i-1],
        secondaryColor: secondaryColors[i-1],
        logoUrl: `https://logo.clearbit.com/${companies[i-1].toLowerCase()}.com`,
      }
    });
    brandings.push(branding);
  }

  // 3. Seed 7 Templates
  console.log('📄 Seeding Templates...');
  const templates = [];
  const templateTypes = ['OFFER_LETTER', 'JOINING_LETTER', 'OFFER_LETTER', 'JOINING_LETTER', 'OFFER_LETTER', 'JOINING_LETTER', 'OFFER_LETTER'];
  for (let i = 1; i <= 7; i++) {
    const template = await prisma.template.create({
      data: {
        name: `${companies[i-1]} Standard ${templateTypes[i-1].replace('_', ' ')} Template`,
        type: templateTypes[i-1],
        baseJSON: {
          sections: [
            { id: 'header', content: `Welcome to ${companies[i-1]}!` },
            { id: 'body', content: 'We are pleased to offer you the position...' },
          ]
        },
        isReusable: true,
        isPremium: i % 2 === 0,
      }
    });
    templates.push(template);
  }

  // 4. Seed 7 Students
  console.log('🎓 Seeding Students...');
  const students = [];
  const studentNames = ['Alice Smith', 'Bob Jones', 'Charlie Brown', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Costanza'];
  const skillsList = [
    ['AIML', 'Python', 'PyTorch'],
    ['Frontend', 'React', 'TypeScript', 'CSS'],
    ['Backend', 'Node.js', 'PostgreSQL', 'Express'],
    ['Fullstack', 'React', 'Node.js', 'MongoDB'],
    ['AIML', 'TensorFlow', 'Python', 'Scikit-Learn'],
    ['Frontend', 'Vue.js', 'HTML5', 'Sass'],
    ['Backend', 'Go', 'Docker', 'Kubernetes']
  ];
  for (let i = 1; i <= 7; i++) {
    const student = await prisma.student.create({
      data: {
        name: studentNames[i-1],
        email: `student${i}@studlyf.edu`,
        bio: `Passionate developer interested in building scalable systems and working on cutting-edge tech. Student ${i}.`,
        skills: skillsList[i-1],
        linkedinUrl: `https://linkedin.com/in/student${i}`,
        portfolioUrl: `https://student${i}.dev`,
        githubUsername: `student-git-${i}`,
        githubId: `git-id-00${i}`,
      }
    });
    students.push(student);
  }

  // 5. Seed 7 GitHub Stats
  console.log('💻 Seeding GitHub Stats...');
  for (let i = 1; i <= 7; i++) {
    await prisma.gitHubStats.create({
      data: {
        studentId: students[i-1].id,
        topLanguages: i % 2 === 0 
          ? { Python: 60, TypeScript: 30, CSS: 10 }
          : { JavaScript: 50, Rust: 40, HTML: 10 },
        totalRepos: 10 * i,
        totalStars: 5 * i,
        totalCommits: 100 * i,
        totalForks: 2 * i,
      }
    });
  }

  // 6. Seed 7 Hackathon Projects
  console.log('🏆 Seeding Hackathon Projects...');
  for (let i = 1; i <= 7; i++) {
    await prisma.hackathonProject.create({
      data: {
        studentId: students[i-1].id,
        name: `Hackathon Project ${i}`,
        description: `An amazing innovative prototype built during the national level tech hackathon. Version ${i}.`,
        hackathonName: `Global Tech Hackathon 2026`,
        tags: students[i-1].skills,
        juryRating: parseFloat((8.0 + (i * 0.2)).toFixed(1)),
        repoUrl: `https://github.com/student-git-${i}/hackathon-proj`,
        demoUrl: `https://hackathon-proj-${i}.vercel.app`,
      }
    });
  }

  // 7. Seed 7 Applications
  console.log('📋 Seeding Applications...');
  const applications = [];
  const statuses = ['invited', 'reviewing', 'questions_sent', 'offered', 'rejected', 'invited', 'reviewing'];
  for (let i = 1; i <= 7; i++) {
    const app = await prisma.application.create({
      data: {
        hrId: users[i-1].id,
        studentId: students[i-1].id,
        status: statuses[i-1],
        notes: `Highly impressed by the GitHub stats and hackathon rating. Candidate ${i}.`,
      }
    });
    applications.push(app);
  }

  // 8. Seed 7 Screening Questions
  console.log('❓ Seeding Screening Questions...');
  const questions = [];
  const questionsList = [
    'How do you handle large datasets in Python?',
    'What is your experience with TailwindCSS?',
    'Explain the difference between SQL and NoSQL databases.',
    'Describe a challenging bug you resolved recently.',
    'How do you optimize deep learning model training times?',
    'How do you approach responsive web design?',
    'Explain your experience with microservices architecture.'
  ];
  for (let i = 1; i <= 7; i++) {
    const question = await prisma.screeningQuestion.create({
      data: {
        hrId: users[i-1].id,
        question: questionsList[i-1],
        isTemplate: true,
      }
    });
    questions.push(question);
  }

  // 9. Seed 7 Screening Responses
  console.log('📝 Seeding Screening Responses...');
  for (let i = 1; i <= 7; i++) {
    await prisma.screeningResponse.create({
      data: {
        applicationId: applications[i-1].id,
        questionId: questions[i-1].id,
        answer: `This is my response for screening question ${i}. I have extensive practical experience in this area.`,
      }
    });
  }

  // 10. Seed 7 Meetings (Calendly Integration)
  console.log('📅 Seeding Meetings...');
  const meetingStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'scheduled', 'confirmed', 'completed'];
  for (let i = 1; i <= 7; i++) {
    await prisma.meeting.create({
      data: {
        hrId: users[i-1].id,
        applicationId: applications[i-1].id,
        title: `Technical Interview - ${companies[i-1]}`,
        description: `Discussion regarding the candidate's hackathon project and coding skills.`,
        scheduledAt: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        calendlyEventUrl: `https://calendly.com/event-${i}`,
        calendlyEventId: `evt-00${i}`,
        calendlyInviteeUri: `https://api.calendly.com/invitees/invitee-00${i}`,
        status: meetingStatuses[i-1],
      }
    });
  }

  // 11. Seed 7 Documents
  console.log('🗂️ Seeding Documents...');
  const documentStatuses = ['draft', 'completed', 'exported', 'archived', 'draft', 'completed', 'exported'];
  for (let i = 1; i <= 7; i++) {
    await prisma.document.create({
      data: {
        userId: users[i-1].id,
        templateId: templates[i-1].id,
        type: templates[i-1].type,
        title: `${companies[i-1]} - Candidate ${i} Job Offer`,
        status: documentStatuses[i-1],
        candidateDetails: {
          name: students[i-1].name,
          email: students[i-1].email,
          salary: `$${100000 + i * 5000}/year`,
          role: designations[i-1].replace('HR ', '').replace('Talent ', '').replace('Recruiting ', '') || 'Software Engineer',
        },
        contentJSON: {
          sections: [
            { id: 'header', content: `Official letter from ${companies[i-1]}` },
            { id: 'salary', content: `Your base compensation is $${100000 + i * 5000} USD.` }
          ]
        },
        brandingId: brandings[i-1].id,
        exportUrl: `https://s3.amazonaws.com/studlyf-hr-docs/offer-${i}.pdf`,
      }
    });
  }

  // 12. Seed 7 Messages
  console.log('💬 Seeding Messages...');
  for (let i = 1; i <= 7; i++) {
    await prisma.message.create({
      data: {
        hrId: users[i-1].id,
        studentId: students[i-1].id,
        content: `Hello ${studentNames[i-1]}, thank you for applying to ${companies[i-1]}. We would love to discuss next steps.`,
        isRead: i % 2 === 0,
      }
    });
  }

  console.log('✅ Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
