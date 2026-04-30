import { site } from '../site';

export const prerender = true;

export function GET() {
  const sitemapUrl = new URL('/sitemap.xml', site.url).toString();
  const lastmod = new Date().toISOString().slice(0, 10);

  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <sitemap>',
      `    <loc>${sitemapUrl}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '  </sitemap>',
      '</sitemapindex>',
      '',
    ].join('\n'),
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
}
