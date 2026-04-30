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
 *   - MAIL_HOSTNAME       e.g. chancey.io (used as SMTP HELO/EHLO name)
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
  MAIL_HOSTNAME: string;
  RECAPTCHA_SECRET?: string;
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
const MESSAGE_MAX = 5000;
const FIELD_MAX = 200;

function pickAllowedOrigin(envValue: string | undefined, requestOrigin: string | null): string {
  if (!envValue) return 'https://chancey.io';
  const allowed = envValue.split(',').map((o) => o.trim()).filter(Boolean);
  if (!requestOrigin) return allowed[0] ?? 'https://chancey.io';
  for (const pattern of allowed) {
    if (pattern === requestOrigin) return requestOrigin;
    if (pattern.includes('*')) {
      // Wildcard match (e.g. https://*.trycloudflare.com)
      const re: RegExp = new RegExp(
        '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
      );
      if (re.test(requestOrigin)) return requestOrigin;
    }
  }
  return allowed[0] ?? 'https://chancey.io';
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
  allowedOrigin: string
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(allowedOrigin),
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

async function verifyRecaptcha(
  token: string | undefined,
  secret: string | undefined,
  remoteIp: string | undefined
): Promise<{ ok: boolean; score: number | null; codes: string[] }> {
  if (!secret) {
    // No secret configured — skip but flag.
    return { ok: true, score: null, codes: ['skipped'] };
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
  const ok = Boolean(data.success) && (score === null || score >= RECAPTCHA_SCORE_THRESHOLD);
  return { ok, score, codes };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestOrigin = request.headers.get('origin');
    const allowedOrigin = pickAllowedOrigin(env.ALLOWED_ORIGIN, requestOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }

    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'method_not_allowed' }, allowedOrigin);
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

    const name = trimAndCap(payload.name, FIELD_MAX);
    const email = trimAndCap(payload.email, FIELD_MAX);
    const topic = trimAndCap(payload.topic, 50) || 'general';
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

    const recaptcha = await verifyRecaptcha(
      payload.recaptcha_token,
      env.RECAPTCHA_SECRET,
      remoteIp ?? undefined
    );
    if (!recaptcha.ok) {
      return jsonResponse(
        403,
        { error: 'recaptcha_failed', codes: recaptcha.codes, score: recaptcha.score },
        allowedOrigin
      );
    }

    // Build the email
    const subject = `[Chancey contact · ${topic}] ${name}`;
    const text = [
      `From: ${name} <${email}>`,
      `Topic: ${topic}`,
      `reCAPTCHA score: ${recaptcha.score ?? 'n/a'}`,
      `Source IP: ${remoteIp ?? 'unknown'}`,
      '',
      message,
    ].join('\n');

    try {
      const mailer = await WorkerMailer.connect({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: false,
        startTls: true,
        credentials: { username: env.SMTP_USER, password: env.SMTP_PASSWORD },
        authType: 'plain',
        // Some SMTP servers accept either; SES is fine with plain.
        ...(env.MAIL_HOSTNAME ? { name: env.MAIL_HOSTNAME } : {}),
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
    }
  },
};
