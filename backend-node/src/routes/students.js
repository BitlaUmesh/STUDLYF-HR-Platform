const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { syncGitHubStats } = require('../services/github');

const router = express.Router();

// ─── Leaderboard Scoring Algorithm ───────────────────────────────────────────
function computeScore(student, ghStatsRaw, projsRaw) {
  const githubStats = ghStatsRaw || student.githubStats || student.gitHubStats;
  const projects = projsRaw || student.projects || student.hackathonProjects || [];

  // Average jury rating (0–10 scale) → 40%
  const avgRating = projects.length
    ? projects.reduce((sum, p) => sum + (p.juryRating || 0), 0) / projects.length
    : 0;
  const ratingScore = (avgRating / 10) * 40;

  // GitHub stars + commits (normalized to 0–30) → 30%
  const stars = githubStats?.totalStars || 0;
  const commits = githubStats?.totalCommits || 0;
  const ghRaw = Math.min((stars * 0.5 + commits * 0.1), 100);
  const ghScore = (ghRaw / 100) * 30;

  // Number of hackathon projects (capped at 5 for full score) → 20%
  const projectScore = (Math.min(projects.length, 5) / 5) * 20;

  // Profile completeness → 10%
  const fields = [student.bio, student.linkedinUrl, student.portfolioUrl, student.githubUsername, student.avatarUrl];
  const completeness = fields.filter(Boolean).length / fields.length;
  const profileScore = completeness * 10;

  return parseFloat((ratingScore + ghScore + projectScore + profileScore).toFixed(2));
}

function extractStudentData(student) {
  const githubStats = student.githubStats || student.gitHubStats || null;
  const projects = student.projects || student.hackathonProjects || [];
  return { githubStats, projects };
}

async function fetchStudentsWithIncludes(where = {}, options = {}) {
  try {
    return await prisma.student.findMany({
      where,
      ...options,
      include: { githubStats: true, projects: true },
    });
  } catch (err) {
    return await prisma.student.findMany({
      where,
      ...options,
      include: { gitHubStats: true, hackathonProjects: true },
    });
  }
}

// ── GET /api/students/search?q=AIML,Frontend ──────────────────────────────────
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const raw = req.query.q || '';
    const keywords = raw.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);

    const students = await fetchStudentsWithIncludes();

    if (!keywords.length) {
      const results = students
        .map((student) => {
          const { githubStats, projects } = extractStudentData(student);
          const leaderboardScore = computeScore(student, githubStats, projects);
          return {
            id: student.id,
            name: student.name,
            email: student.email,
            bio: student.bio,
            skills: student.skills,
            avatarUrl: student.avatarUrl,
            githubUsername: student.githubUsername,
            topLanguages: githubStats?.topLanguages || {},
            projectCount: projects.length,
            matchScore: 0,
            leaderboardScore,
          };
        })
        .sort((a, b) => b.leaderboardScore - a.leaderboardScore);

      return res.json({ results, total: results.length, keywords: [] });
    }

    const results = students
      .map((student) => {
        const { githubStats, projects } = extractStudentData(student);

        const skillMatches = (student.skills || []).filter((s) =>
          keywords.includes(s.toLowerCase())
        ).length;

        const topLangs = Object.keys(githubStats?.topLanguages || {}).map((l) =>
          l.toLowerCase()
        );
        const langMatches = topLangs.filter((l) => keywords.includes(l)).length;

        const projectTagMatches = projects
          .flatMap((p) => p.tags || [])
          .filter((t) => keywords.includes(t.toLowerCase())).length;

        const matchScore = skillMatches * 3 + langMatches * 2 + projectTagMatches * 1;

        if (matchScore === 0) return null;

        const leaderboardScore = computeScore(student, githubStats, projects);

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          bio: student.bio,
          skills: student.skills,
          avatarUrl: student.avatarUrl,
          githubUsername: student.githubUsername,
          topLanguages: githubStats?.topLanguages || {},
          projectCount: projects.length,
          matchScore,
          leaderboardScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchScore - a.matchScore || b.leaderboardScore - a.leaderboardScore);

    return res.json({ results, total: results.length, keywords });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/students/leaderboard ─────────────────────────────────────────────
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const students = await fetchStudentsWithIncludes({}, { take: 20 });

    const ranked = students
      .map((student) => {
        const { githubStats, projects } = extractStudentData(student);
        return {
          id: student.id,
          name: student.name,
          bio: student.bio,
          skills: student.skills,
          avatarUrl: student.avatarUrl,
          githubUsername: student.githubUsername,
          totalStars: githubStats?.totalStars || 0,
          totalRepos: githubStats?.totalRepos || 0,
          topLanguages: githubStats?.topLanguages || {},
          projectCount: projects.length,
          avgJuryRating: projects.length
            ? (projects.reduce((sum, p) => sum + (p.juryRating || 0), 0) / projects.length).toFixed(1)
            : null,
          score: computeScore(student, githubStats, projects),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    return res.json({ leaderboard: ranked, total: ranked.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/students/:id ─────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    let student;
    try {
      student = await prisma.student.findUnique({
        where: { id: req.params.id },
        include: { githubStats: true, projects: { orderBy: { juryRating: 'desc' } } },
      });
    } catch {
      student = await prisma.student.findUnique({
        where: { id: req.params.id },
        include: { gitHubStats: true, hackathonProjects: { orderBy: { juryRating: 'desc' } } },
      });
    }

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { githubStats, projects } = extractStudentData(student);

    const application = await prisma.application.findUnique({
      where: { hrId_studentId: { hrId: req.hrId, studentId: student.id } },
      select: { id: true, status: true },
    });

    const { githubAccessToken, ...safeStudent } = student;
    return res.json({
      ...safeStudent,
      githubStats,
      projects,
      isInvited: !!application,
      applicationStatus: application?.status || null,
      score: computeScore(student, githubStats, projects),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/students/sync-github/:studentId ─────────────────────────────────
router.post('/sync-github/:studentId', authenticate, async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      select: { githubAccessToken: true, id: true },
    });

    if (!student?.githubAccessToken) {
      return res.status(400).json({ error: 'Student has not connected GitHub' });
    }

    const languages = await syncGitHubStats(student.id, student.githubAccessToken);
    return res.json({ message: 'GitHub stats synced', topLanguages: languages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
