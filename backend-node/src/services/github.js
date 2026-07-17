const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const GH_API = 'https://api.github.com';

/**
 * Syncs a student's GitHub stats into the GitHubStats table.
 * Called after OAuth callback and manually via API.
 * @param {string} studentId
 * @param {string} accessToken - GitHub OAuth access token
 */
async function syncGitHubStats(studentId, accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': 'StudLyf-HR',
    Accept: 'application/vnd.github.v3+json',
  };

  // ── Fetch all repos (paginated) ───────────────────────────────────────────
  let repos = [];
  let page = 1;
  while (true) {
    const { data } = await axios.get(`${GH_API}/user/repos`, {
      headers,
      params: { per_page: 100, page, type: 'owner' },
    });
    if (!data.length) break;
    repos = repos.concat(data);
    if (data.length < 100) break;
    page++;
  }

  // ── Aggregate language bytes per repo ────────────────────────────────────
  const languageBytes = {};
  let totalStars = 0;
  let totalForks = 0;
  let totalRepos = repos.length;

  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    if (!repo.language) continue;
    try {
      const { data: langs } = await axios.get(repo.languages_url, { headers });
      for (const [lang, bytes] of Object.entries(langs)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
    } catch {
      // skip repo if language fetch fails
    }
  }

  // Convert bytes to percentages
  const totalBytes = Object.values(languageBytes).reduce((a, b) => a + b, 0);
  const topLanguages = {};
  for (const [lang, bytes] of Object.entries(languageBytes)) {
    topLanguages[lang] = parseFloat(((bytes / totalBytes) * 100).toFixed(1));
  }

  // Sort by percentage, keep top 10
  const sortedLanguages = Object.fromEntries(
    Object.entries(topLanguages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  );

  // ── Approximate commit count from recent events ───────────────────────────
  let totalCommits = 0;
  try {
    const { data: events } = await axios.get(`${GH_API}/users/${studentId}/events`, {
      headers,
      params: { per_page: 100 },
    });
    totalCommits = events
      .filter((e) => e.type === 'PushEvent')
      .reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);
  } catch {
    // events endpoint can fail for some accounts
  }

  // ── Upsert into DB ────────────────────────────────────────────────────────
  await prisma.gitHubStats.upsert({
    where: { studentId },
    update: {
      topLanguages: sortedLanguages,
      totalRepos,
      totalStars,
      totalForks,
      totalCommits,
      lastSyncedAt: new Date(),
    },
    create: {
      studentId,
      topLanguages: sortedLanguages,
      totalRepos,
      totalStars,
      totalForks,
      totalCommits,
    },
  });

  console.log(`[GitHub] Synced stats for student ${studentId}`);
  return sortedLanguages;
}

/**
 * Returns cached GitHub stats. Triggers a refresh if data is stale (>24h).
 * @param {string} studentId
 */
async function getOrRefreshGitHubStats(studentId) {
  const stats = await prisma.gitHubStats.findUnique({ where: { studentId } });
  if (!stats) return null;

  const staleAfterMs = 24 * 60 * 60 * 1000;
  const isStale = Date.now() - stats.lastSyncedAt.getTime() > staleAfterMs;

  if (isStale) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { githubAccessToken: true },
    });
    if (student?.githubAccessToken) {
      syncGitHubStats(studentId, student.githubAccessToken).catch(console.error);
    }
  }

  return stats;
}

module.exports = { syncGitHubStats, getOrRefreshGitHubStats };
