type KpiValue = number | null;

const CLERK_ESM_URL = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5.127.0/+esm';

interface ClerkSession {
  getToken(opts: { template: string }): Promise<string | null>;
}

interface ClerkInstance {
  user: unknown;
  session: ClerkSession | null;
  load(): Promise<void>;
  openSignIn(): void;
  signOut(): Promise<void>;
}

interface ClerkModule {
  Clerk: new (publishableKey: string) => ClerkInstance;
}

interface AdminAnalyticsOverview {
  generatedAt: string;
  env: string;
  range: { start: string; end: string };
  kpis: {
    websiteVisitors: KpiValue;
    websitePageviews: KpiValue;
    iosDownloads: KpiValue;
    androidInstalls: KpiValue;
    newUsers: KpiValue;
    dau: KpiValue;
    scans: number;
    proEvents: KpiValue;
    ocrCostUsd: number;
    savedTickets: number;
  };
  trend: Array<{
    date: string;
    websiteVisitors: KpiValue;
    downloads: KpiValue;
    users: KpiValue;
    scans: number;
    proEvents: KpiValue;
    ocrCostUsd: number;
  }>;
  tickets: {
    total: number;
    byGame: Array<{ gameId: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  sourceHealth: Array<{
    source: string;
    status: 'ok' | 'stale' | 'unconfigured' | 'error';
    updatedAt: string | null;
    detail: string;
  }>;
  topPages: Array<{ path: string; views: number }>;
  scanErrors: Array<{ code: string; count: number }>;
}

const shell = document.querySelector<HTMLElement>('.admin-shell');
const statusEl = byId('status');
const signInButton = byId<HTMLButtonElement>('sign-in');
const refreshButton = byId<HTMLButtonElement>('refresh');
const apiBase = shell?.dataset.apiBase ?? '';
const clerkKey = shell?.dataset.clerkKey ?? '';

let clerk: ClerkInstance | null = null;

void boot();

async function boot(): Promise<void> {
  if (!shell || !statusEl || !signInButton || !refreshButton) return;
  if (!clerkKey) {
    setStatus('Missing PUBLIC_CLERK_PUBLISHABLE_KEY for admin dashboard.', 'error');
    return;
  }
  if (!apiBase) {
    setStatus('Missing PUBLIC_CHANCEY_API_BASE_URL for admin dashboard.', 'error');
    return;
  }

  clerk = await createClerk(clerkKey);
  await clerk.load();
  signInButton.addEventListener('click', () => {
    if (!clerk) return;
    if (clerk.user) {
      void clerk.signOut().then(() => window.location.reload());
    } else {
      clerk.openSignIn();
    }
  });
  refreshButton.addEventListener('click', () => void loadOverview(true));

  if (!clerk.user) {
    signInButton.textContent = 'Sign in';
    setStatus('Sign in with an admin account to view analytics.', 'idle');
    return;
  }

  signInButton.textContent = 'Sign out';
  refreshButton.disabled = false;
  await loadOverview(false);
}

async function createClerk(publishableKey: string): Promise<ClerkInstance> {
  const mod = (await import(/* @vite-ignore */ CLERK_ESM_URL)) as ClerkModule;
  return new mod.Clerk(publishableKey);
}

async function loadOverview(force: boolean): Promise<void> {
  if (!clerk?.session) return;
  refreshButton.disabled = true;
  setStatus('Loading analytics…', 'idle');
  try {
    const token = await clerk.session.getToken({ template: 'chancey-api' });
    if (!token) throw new Error('Clerk did not return a Chancey API token.');
    const url = new URL('/v1/admin/analytics/overview', apiBase);
    url.searchParams.set('days', '30');
    if (force) url.searchParams.set('force', '1');
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await safeJson(res);
      const message = body?.error?.message || body?.error?.code || `HTTP ${res.status}`;
      throw new Error(message);
    }
    const overview = (await res.json()) as AdminAnalyticsOverview;
    renderOverview(overview);
    setStatus(`Loaded ${overview.env} analytics. Generated ${time(overview.generatedAt)}.`, 'ok');
  } catch (err) {
    setStatus(err instanceof Error ? err.message : 'Failed to load analytics.', 'error');
  } finally {
    refreshButton.disabled = false;
  }
}

function renderOverview(data: AdminAnalyticsOverview): void {
  const kpis = data.kpis;
  setKpi('websiteVisitors', whole(kpis.websiteVisitors));
  setKpi('iosDownloads', whole(kpis.iosDownloads));
  setKpi('androidInstalls', whole(kpis.androidInstalls));
  setKpi('newUsers', whole(kpis.newUsers));
  setKpi('dau', whole(kpis.dau));
  setKpi('scans', whole(kpis.scans));
  setKpi('proEvents', whole(kpis.proEvents));
  setKpi('ocrCostUsd', money(kpis.ocrCostUsd));

  const range = byId('range');
  if (range) range.textContent = `${data.range.start} to ${data.range.end}`;

  renderTrend(data);
  renderRows(
    'sources',
    data.sourceHealth.map((source) => ({
      left: label(source.source),
      right: `<span class="pill ${source.status}">${source.status}</span>`,
      sub: source.updatedAt ? `${source.detail} ${time(source.updatedAt)}` : source.detail,
    }))
  );
  renderRows('tickets', [
    { left: 'Saved tickets', right: whole(data.tickets.total) },
    ...data.tickets.byGame.map((row) => ({
      left: label(row.gameId),
      right: whole(row.count),
    })),
    ...data.tickets.byStatus.map((row) => ({
      left: label(row.status),
      right: whole(row.count),
    })),
  ]);
  renderRows(
    'top-pages',
    data.topPages.map((row) => ({ left: row.path, right: whole(row.views) })),
    'No imported page data yet.'
  );
  renderRows(
    'scan-errors',
    data.scanErrors.map((row) => ({ left: row.code, right: whole(row.count) })),
    'No scan errors recorded.'
  );
}

function renderTrend(data: AdminAnalyticsOverview): void {
  const el = byId('trend');
  if (!el) return;
  const values = data.trend.map((row) => row.websiteVisitors ?? row.downloads ?? row.users ?? row.scans);
  const max = Math.max(1, ...values);
  el.innerHTML = data.trend
    .map((row, index) => {
      const value = values[index] ?? 0;
      const height = Math.max(2, Math.round((value / max) * 160));
      const title = `${row.date}: ${whole(value)} signal, ${whole(row.scans)} scans`;
      return `<div class="bar" style="height:${height}px" title="${escapeHtml(title)}"></div>`;
    })
    .join('');
}

function renderRows(
  id: string,
  rows: Array<{ left: string; right: string; sub?: string }>,
  empty = 'No data yet.'
): void {
  const el = byId(id);
  if (!el) return;
  if (rows.length === 0) {
    el.innerHTML = `<div class="row"><span>${escapeHtml(empty)}</span><strong>—</strong></div>`;
    return;
  }
  el.innerHTML = rows
    .map(
      (row) =>
        `<div class="row"><span>${escapeHtml(row.left)}${row.sub ? `<br /><small>${escapeHtml(row.sub)}</small>` : ''}</span><strong>${row.right}</strong></div>`
    )
    .join('');
}

function setKpi(name: keyof AdminAnalyticsOverview['kpis'], value: string): void {
  const el = document.querySelector(`[data-kpi="${name}"]`);
  if (el) el.textContent = value;
}

function setStatus(message: string, tone: 'idle' | 'ok' | 'error'): void {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status ${tone === 'idle' ? '' : tone}`;
}

async function safeJson(res: Response): Promise<{ error?: { code?: string; message?: string } } | null> {
  try {
    return (await res.json()) as { error?: { code?: string; message?: string } };
  } catch {
    return null;
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function whole(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return Math.round(value).toLocaleString();
}

function money(value: number): string {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function time(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function label(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#39;';
  });
}
