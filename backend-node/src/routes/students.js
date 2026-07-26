const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { syncGitHubStats } = require('../services/github');

const router = express.Router();

// ─── Leaderboard Scoring Algorithm ───────────────────────────────────────────
function computeScore(student, ghStatsRaw, projsRaw) {
  const githubStats = ghStatsRaw || student.githubStats;
  const projects = projsRaw || student.projects || [];

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
  const githubStats = student.githubStats || null;
  const projects = student.projects || [];
  return { githubStats, projects };
}

async function fetchStudentsWithIncludes(where = {}, options = {}) {
  return await prisma.student.findMany({
    where,
    ...options,
    include: { githubStats: true, projects: true },
  });
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

// ── Leaderboard 2-Hour Automatic Refresh Cache & Scheduler ──────────────────────
const REFRESH_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 Hours

let leaderboardCache = {
  data: [],
  lastRefreshedAt: new Date().toISOString(),
  nextRefreshAt: new Date(Date.now() + REFRESH_INTERVAL_MS).toISOString(),
};

async function computeAndCacheLeaderboard() {
  try {
    const students = await fetchStudentsWithIncludes({}, { take: 50 });
    
    // Trigger background sync for connected GitHub accounts if any
    for (const s of students) {
      if (s.githubAccessToken) {
        syncGitHubStats(s.id, s.githubAccessToken).catch(() => {});
      }
    }

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
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const now = new Date();
    leaderboardCache = {
      data: ranked,
      lastRefreshedAt: now.toISOString(),
      nextRefreshAt: new Date(now.getTime() + REFRESH_INTERVAL_MS).toISOString(),
    };
    console.log(`[Leaderboard] Automated 2-hour refresh executed successfully at ${now.toISOString()}`);
  } catch (err) {
    console.error('[Leaderboard] Automated refresh error:', err);
  }
}

// Initial calculation and 2-hour recurring interval timer
computeAndCacheLeaderboard();
setInterval(computeAndCacheLeaderboard, REFRESH_INTERVAL_MS);

// ── GET /api/students/leaderboard ─────────────────────────────────────────────
router.get('/leaderboard', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const force = req.query.force === 'true';

    // If force refresh requested or cache empty
    if (!leaderboardCache.data || !leaderboardCache.data.length || force) {
      await computeAndCacheLeaderboard();
    }

    const sliced = (leaderboardCache.data || []).slice(0, limit);

    return res.json({
      leaderboard: sliced,
      total: sliced.length,
      lastRefreshedAt: leaderboardCache.lastRefreshedAt,
      nextRefreshAt: leaderboardCache.nextRefreshAt,
      refreshIntervalHours: 2,
    });
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
    } catch (primaryErr) {
      console.warn('[Students GET /:id] Query with relations failed, using fallback:', primaryErr.message);
      student = await prisma.student.findUnique({ where: { id: req.params.id } });
      if (student) {
        try { student.githubStats = await prisma.gitHubStats.findUnique({ where: { studentId: student.id } }); } catch {}
        try { student.projects = await prisma.hackathonProject.findMany({ where: { studentId: student.id } }); } catch { student.projects = []; }
      }
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
