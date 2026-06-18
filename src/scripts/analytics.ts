/**
 * Chancey marketing site analytics, wires GA4 events with no PII.
 *
 * Tracked events (in addition to GA4 auto-tracked page_view + outbound):
 *   - cta_click               { cta_label, cta_destination, cta_location, cta_variant, cta_id, hero_variant }
 *   - app_link_click          { source, destination, cta_variant, cta_id, hero_variant }
 *   - store_badge_click       { platform: 'ios'|'android', source, hero_variant }
 *   - hero_view               { hero_variant, page }
 *   - external_link_click     { url, page }
 *   - nav_click               { label, destination }
 *   - footer_click            { label, destination }
 *   - faq_toggle              { question, opened, page }
 *   - scroll_milestone        { percent, page }
 *
 * Contact-form events (in src/scripts/contact-form.ts):
 *   - contact_form_view             { page }
 *   - contact_form_start            { page }       (first focus)
 *   - contact_form_submit_attempt   { topic, page }
 *   - contact_form_submit_success   { topic, latency_ms, page }
 *   - contact_form_submit_error     { topic, error, page }
 *
 * The script is small enough to live in <head> as type="module".
 */

export {};

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

(function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  function gtagSafe(event: string, params: Record<string, unknown>): void {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  }

  // Active hero H1 variant, recorded so swaps stay comparable in GA4.
  const heroVariant =
    document.querySelector<HTMLElement>('.hero[data-hero-variant]')?.dataset.heroVariant ?? null;

  function getEventLocation(target: Element): string {
    const ctaId = (target.closest('[data-cta]') as HTMLElement | null)?.dataset.cta ?? '';
    if (ctaId.startsWith('pricing-page')) return 'pricing_page';
    if (ctaId.startsWith('pricing-')) return 'pricing_section';
    if (target.closest('.site-header')) return 'header';
    if (target.closest('.hero')) return 'hero';
    if (target.closest('.cta-card')) return 'cta_section';
    if (target.closest('.responsible-callout')) return 'responsible_callout';
    if (target.closest('.feature-block')) return 'feature_block';
    if (target.closest('.steps')) return 'how_it_works';
    if (target.closest('.feature-grid')) return 'features_grid';
    if (target.closest('.faq')) return 'faq';
    if (target.closest('.site-footer')) return 'footer';
    if (target.closest('.article')) return 'article';
    if (target.closest('.not-found')) return 'not_found';
    return 'page';
  }

  function isExternalLink(href: string): boolean {
    if (!/^https?:\/\//i.test(href)) return false;
    try {
      const url = new URL(href);
      return !url.hostname.endsWith('chancey.io');
    } catch {
      return false;
    }
  }

  function isAppLink(href: string): boolean {
    return /^https?:\/\/(?:stage\.)?app\.chancey\.io/i.test(href);
  }

  // ---------------- Click delegation ----------------
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a, button') as HTMLAnchorElement | HTMLButtonElement | null;
      if (!link) return;

      const rawHref = link.getAttribute('href') ?? '';
      const label = (link.textContent ?? '').trim().slice(0, 96);
      const isPrimary = link.classList.contains('primary');
      const isCtaButton = link.classList.contains('button');
      const location = getEventLocation(link);

      const ctaId = (link as HTMLElement).dataset.cta ?? null;
      const storeBadge = (link.closest('[data-store-badge]') as HTMLElement | null)?.dataset;

      // 0. Store badge click (iOS / Android)
      if (storeBadge?.storeBadge) {
        gtagSafe('store_badge_click', {
          platform: storeBadge.storeBadge,
          source: storeBadge.storeSource ?? 'hero',
          hero_variant: heroVariant,
        });
      }

      // 1. App link (most important, conversion proxy)
      if (rawHref && isAppLink(rawHref)) {
        gtagSafe('app_link_click', {
          source: location,
          destination: rawHref,
          cta_variant: isPrimary ? 'primary' : 'secondary',
          cta_label: label,
          cta_id: ctaId,
          hero_variant: location === 'hero' ? heroVariant : null,
        });
      }

      // 2. External link (helplines, etc.) — but not Chancey app domains
      if (rawHref && isExternalLink(rawHref) && !isAppLink(rawHref)) {
        gtagSafe('external_link_click', {
          url: rawHref,
          page: window.location.pathname,
          location,
        });
      }

      // 3. CTA button click (any .button)
      if (isCtaButton) {
        gtagSafe('cta_click', {
          cta_label: label,
          cta_destination: rawHref,
          cta_location: location,
          cta_variant: isPrimary ? 'primary' : 'secondary',
          cta_id: ctaId,
          hero_variant: location === 'hero' ? heroVariant : null,
        });
      }

      // 4. Header / footer nav click
      if (link.closest('.primary-nav') && !isCtaButton) {
        gtagSafe('nav_click', { label, destination: rawHref });
      }
      if (link.closest('.site-footer .footer-col')) {
        gtagSafe('footer_click', { label, destination: rawHref });
      }
    },
    { passive: true }
  );

  // ---------------- FAQ toggle ----------------
  const faqDetails = document.querySelectorAll<HTMLDetailsElement>('.faq details');
  faqDetails.forEach((details) => {
    details.addEventListener('toggle', () => {
      const summary = details.querySelector('summary');
      const question = (summary?.textContent ?? '').trim().slice(0, 96);
      gtagSafe('faq_toggle', {
        question,
        opened: details.open,
        page: window.location.pathname,
      });
    });
  });

  // ---------------- Scroll milestones (25/50/75/100) ----------------
  const milestones = [25, 50, 75, 100];
  const fired = new Set<number>();
  let ticking = false;

  function checkScrollDepth(): void {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    if (total <= 0) {
      ticking = false;
      return;
    }
    const pct = Math.min(100, Math.floor((window.scrollY / total) * 100));
    for (const m of milestones) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        gtagSafe('scroll_milestone', {
          percent: m,
          page: window.location.pathname,
        });
      }
    }
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScrollDepth);
        ticking = true;
      }
    },
    { passive: true }
  );

  // One hero_view ping per page that has a hero, records which H1 variant
  // was shown so conversion rate per variant is computable later.
  if (heroVariant) {
    gtagSafe('hero_view', { hero_variant: heroVariant, page: window.location.pathname });
  }
})();
