import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import { getSiteUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const alternates = { ...Object.fromEntries(locales.map((l) => [l, `${base}/${l}`])), 'x-default': `${base}/en` };
  return locales.map((locale) => ({ url: `${base}/${locale}`, lastModified: new Date(), changeFrequency: 'monthly', priority: locale === 'en' ? 1 : 0.9, alternates: { languages: alternates } }));
}
