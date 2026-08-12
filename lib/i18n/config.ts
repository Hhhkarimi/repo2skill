export const locales = ['en', 'fa', 'ar', 'zh', 'fr', 'es', 'it'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const rtlLocales: Locale[] = ['fa', 'ar'];
export function isLocale(value: string): value is Locale { return locales.includes(value as Locale); }
export function direction(locale: Locale) { return rtlLocales.includes(locale) ? 'rtl' : 'ltr'; }
export const localeLabels: Record<Locale, string> = { en: 'English', fa: 'فارسی', ar: 'العربية', zh: '中文', fr: 'Français', es: 'Español', it: 'Italiano' };
