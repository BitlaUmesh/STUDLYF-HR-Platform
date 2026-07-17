const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { getOrRefreshGitHubStats, syncGitHubStats } = require('../services/github');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Leaderboard Scoring Algorithm ───────────────────────────────────────────
function computeScore(student, githubStats, projects) {
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

// ── GET /api/students/search?q=AIML,Frontend ──────────────────────────────────
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const raw = req.query.q || '';
    const keywords = raw.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);

    if (!keywords.length) {
      return res.status(400).json({ error: 'Provide at least one keyword via ?q=' });
    }

    const students = await prisma.student.findMany({
      include: { githubStats: true, projects: true },
    });

    const results = students
      .map((student) => {
        const skillMatches = (student.skills || []).filter((s) =>
          keywords.includes(s.toLowerCase())
        ).length;

        const topLangs = Object.keys(student.githubStats?.topLanguages || {}).map((l) =>
          l.toLowerCase()
        );
        const langMatches = topLangs.filter((l) => keywords.includes(l)).length;

        const projectTagMatches = student.projects
          .flatMap((p) => p.tags || [])
          .filter((t) => keywords.includes(t.toLowerCase())).length;

        const matchScore = skillMatches * 3 + langMatches * 2 + projectTagMatches * 1;

        if (matchScore === 0) return null;

        const leaderboardScore = computeScore(student, student.githubStats, student.projects);

        return {
          id: student.id,
          name: student.name,
          email: student.email,
          bio: student.bio,
          skills: student.skills,
          avatarUrl: student.avatarUrl,
          githubUsername: student.githubUsername,
          topLanguages: student.githubStats?.topLanguages || {},
          projectCount: student.projects.length,
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
    const limit = parseInt(req.query.limit) || 50;

    const students = await prisma.student.findMany({
      include: { githubStats: true, projects: true },
      take: 200, // fetch wider pool, rank in memory
    });

    const ranked = students
      .map((s) => ({
        id: s.id,
        name: s.name,
        bio: s.bio,
        skills: s.skills,
        avatarUrl: s.avatarUrl,
        githubUsername: s.githubUsername,
        totalStars: s.githubStats?.totalStars || 0,
        totalRepos: s.githubStats?.totalRepos || 0,
        topLanguages: s.githubStats?.topLanguages || {},
        projectCount: s.projects.length,
        avgJuryRating: s.projects.length
          ? (s.projects.reduce((sum, p) => sum + (p.juryRating || 0), 0) / s.projects.length).toFixed(1)
          : null,
        score: computeScore(s, s.githubStats, s.projects),
      }))
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
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        githubStats: true,
        projects: { orderBy: { juryRating: 'desc' } },
      },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { githubAccessToken, ...safeStudent } = student;
    return res.json({
      ...safeStudent,
      score: computeScore(student, student.githubStats, student.projects),
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
