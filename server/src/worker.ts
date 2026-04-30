/**
 * Chancey contact-form Cloudflare Worker.
 *
 * Receives a JSON POST from chancey.io/contact/, verifies reCAPTCHA v3,
 * and forwards the message to the admin inbox via Amazon SES SMTP using
 * `worker-mailer` (which uses Cloudflare's TCP socket API).
 *
 * Required environment / secrets (set with `wrangler secret put`):
 *   - SMTP_HOST           e.g. email-smtp.us-east-1.amazonaws.com
 *   - SMTP_PORT           e.g. 587
 *   - SMTP_USER           SES SMTP username (an IAM access key ID)
 *   - SMTP_PASSWORD       SES SMTP password
 *   - MAIL_FROM           Verified SES sender, e.g. lucky@chancey.io
 *   - MAIL_TO             Where messages should be delivered, e.g. lucky@chancey.io
 *   - RECAPTCHA_SECRET    Google reCAPTCHA v3 secret key
 *   - ALLOWED_ORIGIN      e.g. https://chancey.io
 */

import { WorkerMailer } from 'worker-mailer';

interface Env {
  STAGE?: 'local' | 'dev' | 'production';
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  MAIL_FROM: string;
  MAIL_TO: string;
  RECAPTCHA_SECRET?: string;
  RECAPTCHA_ALLOWED_HOSTNAMES?: string;
  ALLOWED_ORIGIN?: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
  website?: string; // honeypot
  recaptcha_token?: string;
}

interface RecaptchaVerifyResponse {
  success?: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

const RECAPTCHA_SCORE_THRESHOLD = 0.5;
const RECAPTCHA_ACTION = 'contact';
const MESSAGE_MAX = 5000;
const FIELD_MAX = 200;
const TOPIC_LABELS: Record<string, string> = {
  general: 'General question',
  support: 'Help with the app',
  privacy: 'Privacy or data request',
  feedback: 'Product feedback',
  bug: 'Bug report',
  security: 'Security issue',
};
const DEFAULT_ALLOWED_ORIGIN = 'https://chancey.io';

function originPatterns(envValue: string | undefined): string[] {
  return String(envValue || DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function wildcardPattern(pattern: string): RegExp {
  return new RegExp(
    '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  );
}

function isAllowedOrigin(envValue: string | undefined, requestOrigin: string | null): boolean {
  if (!requestOrigin) return false;
  for (const pattern of originPatterns(envValue)) {
    if (pattern === requestOrigin) return true;
    if (pattern.includes('*') && wildcardPattern(pattern).test(requestOrigin)) return true;
  }
  return false;
}

function pickAllowedOrigin(envValue: string | undefined, requestOrigin: string | null): string {
  const allowed = originPatterns(envValue);
  if (!requestOrigin) return allowed[0] ?? DEFAULT_ALLOWED_ORIGIN;
  for (const pattern of allowed) {
    if (pattern === requestOrigin) return requestOrigin;
    if (pattern.includes('*')) {
      if (wildcardPattern(pattern).test(requestOrigin)) return requestOrigin;
    }
  }
  return originPatterns(envValue)[0] ?? DEFAULT_ALLOWED_ORIGIN;
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(
  status: number,
  body: unknown,
  allowedOrigin: string,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(allowedOrigin),
      ...extraHeaders,
    },
  });
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function trimAndCap(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function trimSingleLine(value: unknown, max: number): string {
  return trimAndCap(value, max)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTopic(value: unknown): { key: string; label: string } {
  const key = trimSingleLine(value, 50).toLowerCase();
  if (key in TOPIC_LABELS) {
    return { key, label: TOPIC_LABELS[key] };
  }
  return { key: 'general', label: TOPIC_LABELS.general };
}

function csvValues(value: string | undefined): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyRecaptcha(
  token: string | undefined,
  secret: string | undefined,
  remoteIp: string | undefined,
  allowedHostnames: string[],
  stage: Env['STAGE']
): Promise<{ ok: boolean; score: number | null; codes: string[] }> {
  if (!secret) {
    const isProduction = stage === 'production';
    return { ok: !isProduction, score: null, codes: [isProduction ? 'missing-secret' : 'skipped'] };
  }
  if (!token) {
    return { ok: false, score: null, codes: ['missing-input-response'] };
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  if (remoteIp) params.set('remoteip', remoteIp);

  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = (await r.json()) as RecaptchaVerifyResponse;
  const codes = data['error-codes'] ?? [];
  const score = typeof data.score === 'number' ? data.score : null;
  const hostname = data.hostname?.toLowerCase();
  const hostnameOk = Boolean(hostname && allowedHostnames.includes(hostname));
  const actionOk = data.action === RECAPTCHA_ACTION;
  const scoreOk = score !== null && score >= RECAPTCHA_SCORE_THRESHOLD;
  const ok = Boolean(data.success) && scoreOk && actionOk && hostnameOk;
  if (data.success && !actionOk) codes.push('unexpected-action');
  if (data.success && !hostnameOk) codes.push('unexpected-hostname');
  if (data.success && !scoreOk) codes.push('low-score');
  return { ok, score, codes };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('origin');
    const allowedOrigin = pickAllowedOrigin(env.ALLOWED_ORIGIN, requestOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }

    if (new URL(request.url).pathname === '/health' && request.method === 'GET') {
      return jsonResponse(200, { ok: true, service: 'chancey-contact' }, allowedOrigin);
    }

    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'method_not_allowed' }, allowedOrigin, {
        Allow: 'POST, OPTIONS',
      });
    }

    if (!isAllowedOrigin(env.ALLOWED_ORIGIN, requestOrigin)) {
      return jsonResponse(403, { error: 'forbidden_origin' }, allowedOrigin);
    }

    let payload: ContactPayload;
    try {
      payload = (await request.json()) as ContactPayload;
    } catch {
      return jsonResponse(400, { error: 'invalid_json' }, allowedOrigin);
    }

    // Honeypot — silently 200 so bots don't retry
    if (payload.website && payload.website.trim() !== '') {
      return jsonResponse(200, { ok: true }, allowedOrigin);
    }

    const name = trimSingleLine(payload.name, FIELD_MAX);
    const email = trimAndCap(payload.email, FIELD_MAX);
    const topic = normalizeTopic(payload.topic);
    const message = trimAndCap(payload.message, MESSAGE_MAX);

    if (!name || !email || !message) {
      return jsonResponse(400, { error: 'missing_required_fields' }, allowedOrigin);
    }
    if (!isEmail(email)) {
      return jsonResponse(400, { error: 'invalid_email' }, allowedOrigin);
    }

    const remoteIp =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

    let recaptcha: Awaited<ReturnType<typeof verifyRecaptcha>>;
    try {
      recaptcha = await verifyRecaptcha(
        payload.recaptcha_token,
        env.RECAPTCHA_SECRET,
        remoteIp ?? undefined,
        csvValues(env.RECAPTCHA_ALLOWED_HOSTNAMES),
        env.STAGE
      );
    } catch (err) {
      console.error('reCAPTCHA verification failed', err);
      return jsonResponse(503, { error: 'recaptcha_unavailable' }, allowedOrigin);
    }
    if (!recaptcha.ok) {
      return jsonResponse(
        403,
        { error: 'recaptcha_failed', codes: recaptcha.codes, score: recaptcha.score },
        allowedOrigin
      );
    }

    // Build the email
    const subject = `[Chancey contact - ${topic.label}] ${name}`;
    const text = [
      `From: ${name} <${email}>`,
      `Topic: ${topic.label} (${topic.key})`,
      `reCAPTCHA score: ${recaptcha.score ?? 'n/a'}`,
      `Source IP: ${remoteIp ?? 'unknown'}`,
      '',
      message,
    ].join('\n');

    let mailer: WorkerMailer | undefined;
    try {
      mailer = await WorkerMailer.connect({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: false,
        startTls: true,
        credentials: { username: env.SMTP_USER, password: env.SMTP_PASSWORD },
        authType: 'plain',
      });

      await mailer.send({
        from: { name: 'Chancey contact form', email: env.MAIL_FROM },
        to: env.MAIL_TO,
        reply: email,
        subject,
        text,
      });

      return jsonResponse(200, { ok: true }, allowedOrigin);
    } catch (err) {
      console.error('SMTP send failed', err);
      return jsonResponse(502, { error: 'send_failed' }, allowedOrigin);
    } finally {
      if (mailer) {
        try {
          await mailer.close();
        } catch (err) {
          console.error('SMTP close failed', err);
        }
      }
    }
  },
};
