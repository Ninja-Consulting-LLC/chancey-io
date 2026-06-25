type KpiValue = number | null;

const CLERK_ESM_URL = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5.127.0/+esm';

interface ClerkSession {
  getToken(opts?: { template?: string }): Promise<string | null>;
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
  windowDays: number;
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
const rangeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-range-days]'));
const apiBase = shell?.dataset.apiBase ?? '';
const clerkKey = shell?.dataset.clerkKey ?? '';

let clerk: ClerkInstance | null = null;
let selectedDays = '30';

const SOURCE_LABELS: Record<string, string> = {
  app_store_connect: 'App Store Connect',
  cloudflare: 'Cloudflare',
  clerk: 'Clerk',
  google_play: 'Google Play',
  mega_millions: 'Mega Millions',
  powerball: 'Powerball',
  revenuecat: 'RevenueCat',
};

const TREND_SERIES: Array<{
  key: 'websiteVisitors' | 'downloads' | 'users' | 'scans';
  label: string;
  value(row: AdminAnalyticsOverview['trend'][number]): number | null | undefined;
}> = [
  { key: 'websiteVisitors', label: 'Visitors', value: (row) => row.websiteVisitors },
  { key: 'downloads', label: 'Downloads', value: (row) => row.downloads },
  { key: 'users', label: 'Users', value: (row) => row.users },
  { key: 'scans', label: 'Scans', value: (row) => row.scans },
];

void boot();

async function boot(): Promise<void> {
  if (!shell || !statusEl || !signInButton || !refreshButton) return;
  setActiveRangeButton();
  if (!clerkKey) {
    setStatus('Missing PUBLIC_CHANCEY_ADMIN_CLERK_PUBLISHABLE_KEY for admin dashboard.', 'error');
    return;
  }
  if (!apiBase) {
    setStatus('Missing prod API base for admin dashboard.', 'error');
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
  for (const button of rangeButtons) {
    button.addEventListener('click', () => {
      selectedDays = button.dataset.rangeDays ?? '30';
      setActiveRangeButton();
      void loadOverview(false);
    });
  }

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
  setStatus(force ? 'Refreshing source imports…' : 'Loading analytics…', 'idle');
  let requestUrl = '';
  try {
    const token = await getApiToken(clerk.session);
    if (force) await refreshImports(token);
    const url = new URL('/v1/admin/analytics/overview', apiBase);
    url.searchParams.set('days', selectedDays);
    if (force) url.searchParams.set('force', '1');
    requestUrl = url.toString();
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
    setLoadedStatus(overview);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load analytics.';
    setStatus(message === 'Failed to fetch' && requestUrl ? `${message}: ${requestUrl}` : message, 'error');
  } finally {
    refreshButton.disabled = false;
  }
}

async function getApiToken(session: ClerkSession): Promise<string> {
  let templateError: unknown;
  try {
    const token = await session.getToken({ template: 'chancey-api' });
    if (token) return token;
  } catch (err) {
    templateError = err;
  }

  try {
    const token = await session.getToken();
    if (token) return token;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Clerk token fetch failed: ${detail}`);
  }

  const detail = templateError instanceof Error ? templateError.message : String(templateError ?? 'no token returned');
  throw new Error(`Clerk did not return an API token: ${detail}`);
}

async function refreshImports(token: string): Promise<void> {
  const url = new URL('/v1/admin/analytics/import', apiBase);
  url.searchParams.set('days', selectedDays);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Failed to fetch';
    throw new Error(`Import refresh failed: ${detail}: ${url.toString()}`);
  }
  if (!res.ok) {
    const body = await safeJson(res);
    const message = body?.error?.message || body?.error?.code || `HTTP ${res.status}`;
    throw new Error(`Import refresh failed: ${message}`);
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
  setKpiNotes(data);

  const range = byId('range');
  if (range) range.textContent = `${rangeLabel(data.windowDays)} · ${displayRange(data)}`;

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

function setLoadedStatus(data: AdminAnalyticsOverview): void {
  const needsAttention = data.sourceHealth.filter((source) => source.status !== 'ok');
  const prefix = `Loaded ${data.env} analytics from ${apiBaseLabel(apiBase)}. Generated ${time(data.generatedAt)}.`;
  if (needsAttention.length === 0) {
    setStatus(prefix, 'ok');
    return;
  }
  const sources = needsAttention.map((source) => label(source.source)).join(', ');
  setStatus(`${prefix} Sources need attention: ${sources}.`, needsAttention.some((source) => source.status === 'error') ? 'error' : 'idle');
}

function apiBaseLabel(value: string): string {
  try {
    const host = new URL(value).hostname;
    if (host === 'chancey-api.ninjaconsultingllc.workers.dev') return 'prod API';
    return host;
  } catch {
    return value;
  }
}

function setKpiNotes(data: AdminAnalyticsOverview): void {
  const sourceStatus = new Map(data.sourceHealth.map((source) => [source.source, source.status]));
  const notes: Partial<Record<keyof AdminAnalyticsOverview['kpis'], string>> = {
    websiteVisitors: noteFor(data.kpis.websiteVisitors, sourceStatus.get('cloudflare'), 'Waiting for Cloudflare import.'),
    iosDownloads: noteFor(data.kpis.iosDownloads, sourceStatus.get('app_store_connect'), 'Waiting for App Store import.'),
    androidInstalls: androidInstallNote(data, sourceStatus.get('google_play')),
    newUsers: noteFor(data.kpis.newUsers, null, 'No signup activity yet.'),
    dau: noteFor(data.kpis.dau, null, 'No active users today yet.'),
    proEvents: noteFor(data.kpis.proEvents, sourceStatus.get('revenuecat'), 'Waiting for subscription events.'),
  };
  for (const key of Object.keys(data.kpis) as Array<keyof AdminAnalyticsOverview['kpis']>) {
    const el = document.querySelector(`[data-kpi-note="${key}"]`);
    if (el) el.textContent = notes[key] ?? '';
  }
}

function androidInstallNote(
  data: AdminAnalyticsOverview,
  status: AdminAnalyticsOverview['sourceHealth'][number]['status'] | undefined
): string {
  if (data.kpis.androidInstalls === 0 && status === 'ok') return 'No Android installs in selected range.';
  return noteFor(data.kpis.androidInstalls, status, 'Waiting for Play import.');
}

function noteFor(
  value: number | null | undefined,
  status: AdminAnalyticsOverview['sourceHealth'][number]['status'] | null | undefined,
  fallback: string
): string {
  if (value !== null && value !== undefined) return '';
  if (status === 'error') return 'Import error.';
  if (status === 'stale') return 'Import stale.';
  if (status === 'unconfigured') return 'Not configured.';
  return fallback;
}

function renderTrend(data: AdminAnalyticsOverview): void {
  const el = byId('trend');
  if (!el) return;
  const rows = trimEmptyTrendStart(data.trend);
  const series = TREND_SERIES.map((entry) => ({
    ...entry,
    values: rows.map((row) => entry.value(row) ?? 0),
  }));
  if (series.every((entry) => entry.values.every((value) => !value))) {
    el.innerHTML = '<div class="empty-state">No trend data imported yet.</div>';
    return;
  }
  el.innerHTML = series
    .map((entry) => {
      const max = Math.max(1, ...entry.values);
      const latest = entry.values.at(-1) ?? 0;
      const bars = entry.values
        .map((value, index) => {
          const height = value > 0 ? Math.max(2, Math.round((value / max) * 32)) : 2;
          const date = rows[index]?.date ?? '';
          const title = `${date}: ${whole(value)} ${entry.label.toLowerCase()}`;
          return `<div class="bar" style="height:${height}px" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"></div>`;
        })
        .join('');
      return `<div class="trend-row" aria-label="${escapeHtml(`${rangeLabel(data.windowDays)} ${entry.label.toLowerCase()} trend`)}"><div class="trend-label"><span>${escapeHtml(entry.label)}</span><strong>${whole(latest)}</strong></div><div class="trend-bars">${bars}</div></div>`;
    })
    .join('');
}

function trimEmptyTrendStart(rows: AdminAnalyticsOverview['trend']): AdminAnalyticsOverview['trend'] {
  const firstSignal = rows.findIndex((row) => TREND_SERIES.some((entry) => (entry.value(row) ?? 0) > 0));
  if (firstSignal < 0) return rows;
  return rows.slice(firstSignal);
}

function renderRows(
  id: string,
  rows: Array<{ left: string; right: string; sub?: string }>,
  empty = 'No data yet.'
): void {
  const el = byId(id);
  if (!el) return;
  if (rows.length === 0) {
    el.innerHTML = `<div class="row empty"><span>${escapeHtml(empty)}</span></div>`;
    return;
  }
  el.innerHTML = rows
    .map(
      (row) =>
        `<div class="row"><span class="row-copy"><span>${escapeHtml(row.left)}</span>${row.sub ? `<small>${escapeHtml(row.sub)}</small>` : ''}</span><strong>${row.right}</strong></div>`
    )
    .join('');
}

function setKpi(name: keyof AdminAnalyticsOverview['kpis'], value: string): void {
  const el = document.querySelector(`[data-kpi="${name}"]`);
  if (el) el.textContent = value;
}

function setActiveRangeButton(): void {
  for (const button of rangeButtons) {
    button.classList.toggle('active', button.dataset.rangeDays === selectedDays);
    button.setAttribute('aria-pressed', button.dataset.rangeDays === selectedDays ? 'true' : 'false');
  }
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
  if (!Number.isFinite(value) || value === 0) return '$0';
  const significantDigits = 3;
  const decimals = Math.max(0, Math.min(6, significantDigits - Math.floor(Math.log10(Math.abs(value))) - 1));
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function rangeLabel(days: number): string {
  if (days >= 3650) return 'All days';
  return `Last ${days} days`;
}

function displayRange(data: AdminAnalyticsOverview): string {
  const start = data.windowDays >= 3650 ? trimEmptyTrendStart(data.trend)[0]?.date ?? data.range.start : data.range.start;
  return `${start} to ${data.range.end}`;
}

function time(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function label(value: string): string {
  const exact = SOURCE_LABELS[value];
  if (exact) return exact;
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
