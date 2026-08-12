import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Studio from '@/components/Studio';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { isLocale, localeLabels, locales, type Locale } from '@/lib/i18n/config';
import { getSiteUrl } from '@/lib/site';

const base=getSiteUrl();
export default async function Home({params}:{params:Promise<{locale:string}>}){
  const {locale:raw}=await params;if(!isLocale(raw))notFound();const locale=raw as Locale,d=getDictionary(locale);const nonce=(await headers()).get('x-nonce')||undefined;
  const structured={ '@context':'https://schema.org','@type':'SoftwareApplication',name:'Repo2Skill',applicationCategory:'DeveloperApplication',operatingSystem:'Web',url:`${base}/${locale}`,description:d.meta.description,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},featureList:['GitHub repository analysis','ChatGPT Agent Skill export','Claude Agent Skill export','Multilingual user interface','Browser-side deterministic analysis']};
  const faq={'@context':'https://schema.org','@type':'FAQPage',mainEntity:[{q:d.faq.q1,a:d.faq.a1},{q:d.faq.q2,a:d.faq.a2},{q:d.faq.q3,a:d.faq.a3}].map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))};
  return <>
    <header className="site-header"><a className="brand" href={`/${locale}`}><span className="brand-mark">R2</span><span><b>{d.nav.product}</b><small>{d.nav.tag}</small></span></a><div className="header-center"><span className="live-dot"/>{d.studio.reviewTitle}</div><div className="language-wrap"><span>{d.nav.language}</span><nav className="language-switcher" aria-label={d.nav.language}>{locales.map(l=><a key={l} href={`/${l}`} className={l===locale?'active':''} hrefLang={l}>{localeLabels[l]}</a>)}</nav></div></header>
    <main id="main">
      <section className="hero"><div className="aurora a1"/><div className="aurora a2"/><div className="hero-badge"><span/> {d.hero.badge}</div><h1>{d.hero.titleA}<br/><em>{d.hero.titleB}</em></h1><p>{d.hero.subtitle}</p><div className="hero-pills"><span>✓ {d.hero.free}</span><span>✓ {d.hero.browser}</span><span>✓ {d.hero.languages}</span></div><a className="hero-cta" href="#builder">{d.nav.tag} <span>↘</span></a></section>
      <Studio d={d} locale={locale}/>
      <section className="content-section"><div className="section-heading"><span className="eyebrow">{d.how.eyebrow}</span><h2>{d.how.title}</h2></div><div className="feature-grid three"><article><span className="number">01 / PROFILE</span><div className="mini-icon">DNA</div><h3>{d.how.oneTitle}</h3><p>{d.how.oneText}</p></article><article><span className="number">02 / MAP</span><div className="mini-icon">MAP</div><h3>{d.how.twoTitle}</h3><p>{d.how.twoText}</p></article><article><span className="number">03 / OPS</span><div className="mini-icon">OPS</div><h3>{d.how.threeTitle}</h3><p>{d.how.threeText}</p></article></div></section>
      <section className="content-section faq-section"><div className="section-heading"><span className="eyebrow">FAQ</span><h2>{d.faq.title}</h2></div><div className="faq-grid"><details><summary>{d.faq.q1}</summary><p>{d.faq.a1}</p></details><details><summary>{d.faq.q2}</summary><p>{d.faq.a2}</p></details><details><summary>{d.faq.q3}</summary><p>{d.faq.a3}</p></details></div></section>
    </main>
    <footer><div className="brand compact"><span className="brand-mark">R2</span><b>Repo2Skill</b></div><p>{d.footer.line}</p><div><span>{d.footer.zeroCost}</span><span>·</span><span>{d.footer.openSource}</span></div></footer>
    <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/><script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faq).replace(/</g,'\\u003c')}}/>
  </>;
}
