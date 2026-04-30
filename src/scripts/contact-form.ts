/**
 * Contact form handling.
 *
 * - Captures form input
 * - Optionally fetches a reCAPTCHA v3 token (if PUBLIC_RECAPTCHA_SITE_KEY is set)
 * - POSTs JSON to PUBLIC_CONTACT_ENDPOINT (typically a Cloudflare Worker URL)
 * - Updates the on-page status message
 * - Fires GA4 events at every meaningful step
 */

export {};

type GtagFn = (...args: unknown[]) => void;

interface RecaptchaApi {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
    gtag?: GtagFn;
  }
}

(function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  if (!form) return;

  const endpoint = form.dataset.endpoint?.trim() ?? '';
  const recaptchaKey = form.dataset.recaptchaKey?.trim() ?? '';
  const statusEl = document.querySelector<HTMLDivElement>('#form-status');
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const labelDefault = form.querySelector<HTMLElement>('[data-form-label="default"]');
  const labelLoading = form.querySelector<HTMLElement>('[data-form-label="loading"]');

  function gtagSafe(event: string, params: Record<string, unknown>): void {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  }

  function setStatus(status: 'idle' | 'loading' | 'success' | 'error', message = ''): void {
    if (!statusEl) return;
    if (status === 'idle') {
      statusEl.removeAttribute('data-status');
      statusEl.textContent = '';
      return;
    }
    statusEl.dataset.status = status;
    statusEl.textContent = message;
  }

  function setLoading(loading: boolean): void {
    if (submitBtn) submitBtn.disabled = loading;
    if (labelDefault) labelDefault.hidden = loading;
    if (labelLoading) labelLoading.hidden = !loading;
  }

  // Pre-select the topic from ?topic= query param (e.g. /contact/?topic=security)
  const topicParam = new URLSearchParams(window.location.search).get('topic');
  if (topicParam) {
    const topicSelect = form.elements.namedItem('topic') as HTMLSelectElement | null;
    if (topicSelect) {
      const validValues = Array.from(topicSelect.options).map((o) => o.value);
      if (validValues.includes(topicParam)) {
        topicSelect.value = topicParam;
      }
    }
  }

  // contact_form_view fires once on page load.
  gtagSafe('contact_form_view', {
    page: window.location.pathname,
    topic_prefilled: topicParam || null,
  });

  // contact_form_start fires the first time any field gets focus.
  let firstFocusFired = false;
  form.addEventListener('focusin', () => {
    if (firstFocusFired) return;
    firstFocusFired = true;
    gtagSafe('contact_form_start', { page: window.location.pathname });
  });

  async function getRecaptchaToken(): Promise<string | null> {
    if (!recaptchaKey || !window.grecaptcha) return null;
    return new Promise<string | null>((resolve) => {
      try {
        window.grecaptcha!.ready(() => {
          window
            .grecaptcha!.execute(recaptchaKey, { action: 'contact' })
            .then((token) => resolve(token))
            .catch(() => resolve(null));
        });
      } catch {
        resolve(null);
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Honeypot — bots will fill any visible <input>; humans never see this one.
    const honeypot = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    if (honeypot.trim() !== '') {
      // Pretend it worked and fire no events. Don't tip off the bot.
      setStatus('success', 'Thanks! Your message is on its way.');
      form.reset();
      return;
    }

    if (!endpoint) {
      setStatus(
        'error',
        'The contact endpoint is not configured yet. Please try again later.'
      );
      gtagSafe('contact_form_submit_error', { error: 'no_endpoint_configured' });
      return;
    }

    const formData = new FormData(form);
    const topic = String(formData.get('topic') ?? 'general');

    gtagSafe('contact_form_submit_attempt', { topic, page: window.location.pathname });

    setLoading(true);
    setStatus('loading', 'Sending your message…');

    const start = performance.now();

    try {
      const recaptchaToken = await getRecaptchaToken();

      const payload: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') payload[key] = value;
      }
      if (recaptchaToken) payload.recaptcha_token = recaptchaToken;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const latencyMs = Math.round(performance.now() - start);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const error = (data as { error?: string }).error || `HTTP ${response.status}`;
        throw new Error(error);
      }

      setStatus(
        'success',
        "Thanks! Your message is on its way. We'll reply within two business days."
      );
      form.reset();
      // Allow the success state to dismiss when the user starts editing again
      const dismissOnEdit = () => {
        setStatus('idle');
        form.removeEventListener('input', dismissOnEdit);
      };
      form.addEventListener('input', dismissOnEdit, { once: true });

      gtagSafe('contact_form_submit_success', {
        topic,
        latency_ms: latencyMs,
        page: window.location.pathname,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const friendly =
        message === 'recaptcha_failed'
          ? "We couldn't confirm you're human. Please reload the page and try again."
          : "Something went wrong sending your message. Please try again, or come back in a few minutes.";
      setStatus('error', friendly);

      gtagSafe('contact_form_submit_error', {
        topic,
        error: message,
        page: window.location.pathname,
      });
    } finally {
      setLoading(false);
    }
  });
})();
