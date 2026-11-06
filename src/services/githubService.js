/**
 * GitHub Service for fetching public profile, events, and contribution calendar
 */

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_GITHUB_USERNAME = 'mohrezkhorasani';

export function getCachedGitHubData(username = DEFAULT_GITHUB_USERNAME) {
  try {
    const raw = localStorage.getItem(`github_cache_${username}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch {}
  return null;
}

export function saveCachedGitHubData(username, data) {
  try {
    localStorage.setItem(
      `github_cache_${username}`,
      JSON.stringify({
        ...data,
        cachedAt: Date.now()
      })
    );
  } catch {}
}

export async function fetchGitHubProfile(username = DEFAULT_GITHUB_USERNAME) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch github profile:', err);
  }
  return null;
}

export async function fetchGitHubEvents(username = DEFAULT_GITHUB_USERNAME) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=15`, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    if (res.ok) {
      const events = await res.json();
      return Array.isArray(events) ? events : [];
    }
  } catch (err) {
    console.warn('Failed to fetch github events:', err);
  }
  return [];
}

export async function fetchGitHubContributions(username = DEFAULT_GITHUB_USERNAME) {
  try {
    // Primary API: Jogrubers community endpoint (free, no token)
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
    if (res.ok) {
      const data = await res.json();
      const lastYearTotal = data.total?.lastYear ?? data.total?.[new Date().getFullYear()] ?? 0;
      return {
        total: lastYearTotal,
        totalsByYear: data.total || {},
        contributions: data.contributions || []
      };
    }
  } catch (err) {
    console.warn('Primary contributions API failed, trying fallback:', err);
  }

  return {
    total: 0,
    totalsByYear: {},
    contributions: []
  };
}

export async function fetchAllGitHubData(username = DEFAULT_GITHUB_USERNAME, force = false) {
  const cached = getCachedGitHubData(username);
  if (!force && cached && Date.now() - (cached.cachedAt || 0) < CACHE_TTL_MS) {
    return cached;
  }

  // Fetch in parallel
  const [profile, events, contributions] = await Promise.all([
    fetchGitHubProfile(username),
    fetchGitHubEvents(username),
    fetchGitHubContributions(username)
  ]);

  const freshData = {
    username,
    profile: profile || cached?.profile || null,
    events: events.length > 0 ? events : cached?.events || [],
    contributions: contributions.contributions.length > 0 ? contributions : cached?.contributions || { total: 0, contributions: [] },
    cachedAt: Date.now()
  };

  saveCachedGitHubData(username, freshData);
  return freshData;
}

/**
 * Format relative time in Persian
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return 'همین الان';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'دیروز';
  if (diffDays < 30) return `${diffDays} روز پیش`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ماه پیش`;
  return `${Math.floor(diffDays / 365)} سال پیش`;
}

/**
 * Format date string YYYY-MM-DD into Persian month and day
 */
export function formatPersianDateString(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format GitHub event action into readable Persian text
 */
export function formatEventAction(event) {
  if (!event) return { title: 'فعالیت نامشخص', subtitle: '' };

  const repoName = event.repo?.name ? event.repo.name.replace(/^[^/]+\//, '') : '';
  const payload = event.payload || {};

  switch (event.type) {
    case 'PushEvent': {
      const commitCount = payload.size || payload.commits?.length || 1;
      const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';
      return {
        action: 'Push',
        title: `کامیت در ${repoName}`,
        badge: `${commitCount} commit`,
        detail: branch,
        color: 'text-emerald-400'
      };
    }
    case 'CreateEvent': {
      const what = payload.ref_type === 'branch' ? 'شاخه جدید' : payload.ref_type === 'tag' ? 'تگ' : 'مخزن';
      return {
        action: 'Create',
        title: `ایجاد ${what} در ${repoName}`,
        badge: payload.ref || 'new',
        detail: payload.ref || '',
        color: 'text-cyan-400'
      };
    }
    case 'WatchEvent':
      return {
        action: 'Star',
        title: `ستاره به ${repoName}`,
        badge: 'Star',
        detail: '',
        color: 'text-amber-400'
      };
    case 'ForkEvent':
      return {
        action: 'Fork',
        title: `انشعاب از ${repoName}`,
        badge: 'Fork',
        detail: '',
        color: 'text-purple-400'
      };
    case 'PullRequestEvent':
      return {
        action: 'PR',
        title: `${payload.action === 'opened' ? 'درخواست ادغام' : 'ادغام PR'} در ${repoName}`,
        badge: `#${payload.number || ''}`,
        detail: payload.pull_request?.title || '',
        color: 'text-blue-400'
      };
    case 'IssuesEvent':
      return {
        action: 'Issue',
        title: `ایشو در ${repoName}`,
        badge: `#${payload.issue?.number || ''}`,
        detail: payload.issue?.title || '',
        color: 'text-rose-400'
      };
    default:
      return {
        action: event.type.replace('Event', ''),
        title: `فعالیت در ${repoName || event.repo?.name || 'گیت‌هاب'}`,
        badge: event.type.replace('Event', ''),
        detail: '',
        color: 'text-gray-300'
      };
  }
}
