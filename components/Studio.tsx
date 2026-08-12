'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import JSZip from 'jszip';
import type { Dictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import type { AnalysisDepth, RepoSnapshot } from '@/lib/github/types';
import { parseGitHubRepo } from '@/lib/github/url';
import { fetchRepository } from '@/lib/github/client';
import { analyzeRepository, type RepoAnalysis } from '@/lib/repo/analyzer';
import { compileRepoSkills, slugify, type SkillPackage } from '@/lib/skill/compiler';

type Props={d:Dictionary;locale:Locale};
type Generated=ReturnType<typeof compileRepoSkills>;

function Icon({name}:{name:'repo'|'spark'|'check'|'download'|'arrow'|'reset'|'shield'|'code'}){
  const p={width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  if(name==='repo')return <svg {...p}><path d="M4 4h6l2 2h8v14H4z"/><path d="M8 11h8M8 15h5"/></svg>;
  if(name==='spark')return <svg {...p}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>;
  if(name==='check')return <svg {...p}><path d="m5 12 4 4L19 6"/></svg>;
  if(name==='download')return <svg {...p}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>;
  if(name==='arrow')return <svg {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
  if(name==='reset')return <svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>;
  if(name==='shield')return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
  return <svg {...p}><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>;
}


function localizedRepoKind(kind:string,locale:Locale){
  const labels:Record<Locale,Record<string,string>>={
    en:{monorepo:'Monorepo','CLI / developer tool':'CLI / developer tool','web application':'Web application','service / API':'Service / API','library / SDK':'Library / SDK','software repository':'Software repository'},
    fa:{monorepo:'مونوریپو','CLI / developer tool':'ابزار CLI / توسعه‌دهنده','web application':'وب‌اپلیکیشن','service / API':'سرویس / API','library / SDK':'کتابخانه / SDK','software repository':'ریپوی نرم‌افزاری'},
    ar:{monorepo:'Monorepo','CLI / developer tool':'أداة CLI / مطور','web application':'تطبيق ويب','service / API':'خدمة / API','library / SDK':'مكتبة / SDK','software repository':'مستودع برمجي'},
    zh:{monorepo:'Monorepo','CLI / developer tool':'CLI / 开发者工具','web application':'Web 应用','service / API':'服务 / API','library / SDK':'库 / SDK','software repository':'软件仓库'},
    fr:{monorepo:'Monorepo','CLI / developer tool':'Outil CLI / développeur','web application':'Application web','service / API':'Service / API','library / SDK':'Bibliothèque / SDK','software repository':'Dépôt logiciel'},
    es:{monorepo:'Monorepo','CLI / developer tool':'Herramienta CLI / developer','web application':'Aplicación web','service / API':'Servicio / API','library / SDK':'Librería / SDK','software repository':'Repositorio de software'},
    it:{monorepo:'Monorepo','CLI / developer tool':'Tool CLI / developer','web application':'Applicazione web','service / API':'Servizio / API','library / SDK':'Libreria / SDK','software repository':'Repository software'}
  };
  return labels[locale][kind]||kind;
}

async function makeZip(pkg:SkillPackage){ const zip=new JSZip(); const root=zip.folder(pkg.folderName)!; for(const f of pkg.files)root.file(f.path,f.content); return zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}); }
function save(blob:Blob,name:string){ const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }

export default function Studio({d,locale}:Props){
  const [url,setUrl]=useState(''); const [depth,setDepth]=useState<AnalysisDepth>('deep'); const [snapshot,setSnapshot]=useState<RepoSnapshot|null>(null); const [analysis,setAnalysis]=useState<RepoAnalysis|null>(null);
  const [skillName,setSkillName]=useState(''); const [focus,setFocus]=useState(''); const [loading,setLoading]=useState(false); const [progress,setProgress]=useState(0); const [message,setMessage]=useState<{kind:'ok'|'error';text:string}|null>(null); const [generated,setGenerated]=useState<Generated|null>(null);
  const stage=generated?3:analysis?2:1;
  const frameworkText=useMemo(()=>analysis?.frameworks.slice(0,12).join(' · ')||'—',[analysis]);

  async function analyze(){
    setMessage(null);setGenerated(null);const ref=parseGitHubRepo(url);if(!ref){setMessage({kind:'error',text:d.status.invalid});return;}
    setLoading(true);setProgress(4);
    try{
      const snap=await fetchRepository(ref,depth,(done,total)=>setProgress(Math.round((done/total)*100)));
      if(!snap.files.length){setMessage({kind:'error',text:d.status.insufficient});return;}
      const intel=analyzeRepository(snap);setSnapshot(snap);setAnalysis(intel);setSkillName(slugify(`${snap.repo.name}-repository-engineer`));setMessage({kind:'ok',text:d.status.ready});
    }catch(err){ const text=err instanceof Error?err.message:''; setMessage({kind:'error',text:text.startsWith('rate_limited:')?d.status.rate:text==='github_404'?d.status.notFound:d.status.failed}); }
    finally{setLoading(false);setProgress(0);}
  }
  function build(){ if(!snapshot||!analysis)return; const result=compileRepoSkills({snapshot,analysis,skillName,focus});setGenerated(result);setMessage({kind:'ok',text:d.status.generated});requestAnimationFrame(()=>document.getElementById('exports')?.scrollIntoView({behavior:'smooth',block:'start'})); }
  async function download(pkg:SkillPackage){save(await makeZip(pkg),`${pkg.folderName}.zip`);}
  async function downloadBoth(){if(!generated)return;const zip=new JSZip();for(const pkg of [generated.chatgpt,generated.claude]){const root=zip.folder(pkg.folderName)!;for(const f of pkg.files)root.file(f.path,f.content);}save(await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}}),`${snapshot?.repo.name||'repository'}-repo2skill-bundle.zip`);}
  function reset(){setUrl('');setSnapshot(null);setAnalysis(null);setGenerated(null);setSkillName('');setFocus('');setMessage(null);setProgress(0);}

  return <section className="studio-shell" id="builder" aria-labelledby="builder-title">
    <div className="stepper" aria-label={`${d.studio.stepSource} — ${d.studio.stepExport}`}>{[d.studio.stepSource,d.studio.stepReview,d.studio.stepExport].map((label,i)=><div key={label} className={`step ${stage>=i+1?'active':''}`}><span>{stage>i+1?<Icon name="check"/>:i+1}</span><b>{label.replace(/^\d+\s*·\s*|^[۱۲۳]\s*·\s*/,'')}</b></div>)}</div>
    <div className="studio-grid">
      <div className="panel source-panel">
        <div className="panel-kicker"><Icon name="repo"/>{d.studio.stepSource}</div><h2 id="builder-title">{d.studio.sourceTitle}</h2><p className="muted">{d.studio.sourceText}</p>
        <label className="field-label" htmlFor="repo-url">{d.studio.urlLabel}</label><div className="input-action"><input id="repo-url" inputMode="url" autoComplete="url" value={url} onChange={(e:ChangeEvent<HTMLInputElement>)=>{setUrl(e.target.value);setSnapshot(null);setAnalysis(null);setGenerated(null);}} placeholder={d.studio.urlPlaceholder}/><button className="button secondary" onClick={analyze} disabled={loading}>{loading?d.studio.analyzing:d.studio.analyze}</button></div>
        {loading&&<div className="progress-wrap"><div className="progress-top"><span>{d.studio.analyzing}</span><b>{progress}%</b></div><div className="progress-track"><span style={{width:`${Math.max(6,progress)}%`}}/></div></div>}
        <div className="depth-block"><span className="field-label">{d.studio.depth}</span><div className="depth-toggle">
          <button className={depth==='focused'?'active':''} onClick={()=>setDepth('focused')} disabled={loading}><b>{d.studio.focused}</b><small>{d.studio.focusedHint}</small></button>
          <button className={depth==='deep'?'active':''} onClick={()=>setDepth('deep')} disabled={loading}><b>{d.studio.deep}</b><small>{d.studio.deepHint}</small></button>
        </div><p className="micro-copy"><Icon name="shield"/>{d.studio.publicOnly}</p></div>
        {snapshot&&<div className="repo-card"><div className="repo-mark">GH</div><div><strong>{snapshot.repo.full_name}</strong><p>{snapshot.repo.description||snapshot.repo.html_url}</p><div className="repo-meta"><span>{snapshot.branch}</span><span>{snapshot.repo.license?.spdx_id||'—'}</span><span>{snapshot.files.length.toLocaleString(locale)} {d.studio.files.toLowerCase()}</span></div></div></div>}
        {message&&<div role="status" className={`notice ${message.kind}`}><Icon name={message.kind==='ok'?'check':'shield'}/><span>{message.text}</span></div>}
      </div>

      <div className={`panel review-panel ${analysis?'ready':'waiting'}`}>
        <div className="panel-kicker"><Icon name="spark"/>{d.studio.stepReview}</div><h2>{d.studio.reviewTitle}</h2><p className="muted">{d.studio.reviewText}</p>
        {analysis&&snapshot?<>
          <div className="intel-grid"><div><small>{d.studio.repoType}</small><strong>{localizedRepoKind(analysis.repoKind,locale)}</strong></div><div><small>{d.studio.language}</small><strong>{analysis.primaryLanguage}</strong></div><div><small>{d.studio.files}</small><strong>{snapshot.files.length.toLocaleString(locale)}</strong></div><div className="score"><small>{d.studio.coverage}</small><strong>{analysis.coverageScore}<em>/100</em></strong></div></div>
          <div className="signal-block"><div className="signal-head"><b>{d.studio.frameworks}</b><span>{analysis.frameworks.length}</span></div><p className="signal-line">{frameworkText}</p></div>
          <div className="mini-stats"><div><Icon name="code"/><span><b>{analysis.commands.length}</b>{d.studio.commands}</span></div><div><Icon name="check"/><span><b>{analysis.tests.length}</b>{d.studio.tests}</span></div><div><Icon name="arrow"/><span><b>{analysis.endpoints.length}</b>{d.studio.endpoints}</span></div><div><Icon name="spark"/><span><b>{analysis.ciWorkflows.length}</b>{d.studio.ci}</span></div></div>
          <label className="field-label" htmlFor="skill-name">{d.studio.skillName}</label><input id="skill-name" value={skillName} onChange={(e:ChangeEvent<HTMLInputElement>)=>setSkillName(e.target.value.slice(0,64))} placeholder={d.studio.skillNamePlaceholder}/>
          <label className="field-label" htmlFor="focus">{d.studio.focus}</label><textarea id="focus" rows={3} value={focus} onChange={(e:ChangeEvent<HTMLTextAreaElement>)=>setFocus(e.target.value.slice(0,700))} placeholder={d.studio.focusPlaceholder}/>
          <div className="button-row"><button className="button primary" onClick={build}>{d.studio.generate}<Icon name="arrow"/></button><button className="button ghost" onClick={reset}><Icon name="reset"/>{d.studio.reset}</button></div>
        </>:<div className="empty-intel"><div className="radar"><span/><span/><span/><i/></div><p>{d.studio.sourceText}</p></div>}
      </div>
    </div>

    {generated&&<div className="exports" id="exports"><div className="export-heading"><div><span className="eyebrow">{d.studio.stepExport}</span><h2>{d.studio.exportTitle}</h2><p>{d.studio.exportText}</p></div><button className="button bundle" onClick={downloadBoth}><Icon name="download"/>{d.studio.downloadBoth}</button></div><div className="export-grid">
      <article className="export-card chatgpt-card"><div className="platform-logo">GPT</div><div><h3>{d.studio.chatgpt}</h3><p>{d.studio.chatgptText}</p><div className="file-pill">SKILL.md · references/</div></div><button className="button secondary" onClick={()=>download(generated.chatgpt)}><Icon name="download"/>{d.studio.download}</button></article>
      <article className="export-card claude-card"><div className="platform-logo">C</div><div><h3>{d.studio.claude}</h3><p>{d.studio.claudeText}</p><div className="file-pill">SKILL.md · references/</div></div><button className="button secondary" onClick={()=>download(generated.claude)}><Icon name="download"/>{d.studio.download}</button></article>
    </div><div className="trust-strip"><span><Icon name="check"/>{d.studio.noApi}</span><span><Icon name="check"/>{d.studio.localZip}</span><span><Icon name="check"/>{d.studio.publicRepo}</span><span><Icon name="check"/>{d.studio.sourceGuard}</span></div></div>}
  </section>;
}
