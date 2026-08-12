import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { direction, isLocale, locales, type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/dictionaries';
import '@fontsource-variable/manrope';
import '@fontsource-variable/vazirmatn';
import '@fontsource-variable/cairo';
import '@fontsource-variable/noto-sans-sc';
import '../globals.css';
import { getSiteUrl } from '@/lib/site';

const base=getSiteUrl();
export function generateStaticParams(){return locales.map(locale=>({locale}));}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale:raw}=await params;if(!isLocale(raw))return{};const locale=raw as Locale,d=getDictionary(locale);const languages=Object.fromEntries(locales.map(l=>[l,`${base}/${l}`]));return{metadataBase:new URL(base),title:d.meta.title,description:d.meta.description,applicationName:'Repo2Skill',alternates:{canonical:`${base}/${locale}`,languages:{...languages,'x-default':`${base}/en`}},openGraph:{type:'website',url:`${base}/${locale}`,title:d.meta.ogTitle,description:d.meta.ogDescription,siteName:'Repo2Skill',locale},twitter:{card:'summary_large_image',title:d.meta.ogTitle,description:d.meta.ogDescription},robots:{index:true,follow:true},category:'technology'};}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const{locale:raw}=await params;if(!isLocale(raw))notFound();const locale=raw as Locale;const skip:Record<Locale,string>={en:'Skip to content',fa:'رفتن به محتوای اصلی',ar:'انتقل إلى المحتوى',zh:'跳到主要内容',fr:'Aller au contenu',es:'Saltar al contenido',it:'Vai al contenuto'};return <html lang={locale} dir={direction(locale)}><body><a className="skip-link" href="#main">{skip[locale]}</a>{children}</body></html>;}
