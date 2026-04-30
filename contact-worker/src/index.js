const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 4000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'chancey-contact' }, 200, origin, env);
    }

    if (url.pathname !== '/v1/contact') {
      return json({ error: 'not_found' }, 404, origin, env);
    }

    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405, origin, env, {
        Allow: 'POST, OPTIONS',
      });
    }

    if (!isAllowedOrigin(origin, env)) {
      return json({ error: 'forbidden_origin' }, 403, origin, env);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400, origin, env);
    }

    const validation = validateContactPayload(payload);
    if (!validation.ok) {
      return json({ error: 'invalid_contact_request', fields: validation.fields }, 400, origin, env);
    }

    if (payload.company) {
      return json({ ok: true }, 202, origin, env);
    }

    if (!env.RESEND_API_KEY) {
      return json({ error: 'email_provider_not_configured' }, 503, origin, env);
    }

    const sent = await sendContactEmail(payload, env);
    if (!sent.ok) {
      console.error('contact_email_failed', sent.status);
      return json({ error: 'email_delivery_failed' }, 502, origin, env);
    }

    return json({ ok: true }, 202, origin, env);
  },
};

function validateContactPayload(payload) {
  const fields = {};
  const name = normalizeString(payload.name);
  const email = normalizeString(payload.email);
  const subject = normalizeString(payload.subject);
  const message = normalizeString(payload.message);

  if (!name || name.length > MAX_NAME_LENGTH) {
    fields.name = 'required';
  }

  if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = 'invalid';
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    fields.subject = 'too_long';
  }

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    fields.message = 'required';
  }

  return {
    ok: Object.keys(fields).length === 0,
    fields,
  };
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isAllowedOrigin(origin, env) {
  if (!origin) {
    return false;
  }

  return allowedOrigins(env).includes(origin);
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (isAllowedOrigin(origin, env)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

function json(body, status, origin, env, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin, env),
      ...extraHeaders,
    },
  });
}

async function sendContactEmail(payload, env) {
  const name = normalizeString(payload.name);
  const email = normalizeString(payload.email);
  const subject = normalizeString(payload.subject) || 'Website contact';
  const message = normalizeString(payload.message);
  const source = normalizeString(payload.source) || 'chancey.io';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `[Chancey] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Source: ${source}`,
        '',
        message,
      ].join('\n'),
    }),
  });

  return { ok: response.ok, status: response.status };
}
