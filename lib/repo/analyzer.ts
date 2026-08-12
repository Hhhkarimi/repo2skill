import type { RepoFile, RepoSnapshot } from '@/lib/github/types';

export type RepoCommand = { name: string; command: string; source: string; category: 'install'|'dev'|'build'|'test'|'lint'|'format'|'typecheck'|'deploy'|'other' };
export type RepoEndpoint = { method: string; route: string; source: string };
export type RepoSymbol = { name: string; kind: string; source: string };
export type RepoAnalysis = {
  repoKind: string; primaryLanguage: string; frameworks: string[]; packageManagers: string[]; commands: RepoCommand[];
  endpoints: RepoEndpoint[]; symbols: RepoSymbol[]; envVars: string[]; ciWorkflows: string[]; tests: string[];
  keyDirectories: string[]; keyFiles: string[]; architectureNotes: string[]; conventions: string[]; risks: string[];
  dependencies: string[]; devDependencies: string[]; docsHeadings: string[]; coverageScore: number; coverageReasons: string[];
  monorepo: boolean; hasDocker: boolean; hasSecurityPolicy: boolean; hasCi: boolean; hasTests: boolean;
};

const unique = <T>(items: T[]) => [...new Set(items)];
const fileByPath = (snapshot: RepoSnapshot, matcher: RegExp) => snapshot.files.find(f => matcher.test(f.path));
const filesByPath = (snapshot: RepoSnapshot, matcher: RegExp) => snapshot.files.filter(f => matcher.test(f.path));

function json(text: string) { try { return JSON.parse(text) as Record<string, unknown>; } catch { return null; } }
function topLanguage(snapshot: RepoSnapshot) {
  const entries = Object.entries(snapshot.languages).sort((a,b)=>b[1]-a[1]);
  return entries[0]?.[0] || snapshot.repo.language || 'Unknown';
}

function packageData(snapshot: RepoSnapshot) {
  const deps = new Set<string>(), dev = new Set<string>(); const scripts: RepoCommand[] = [];
  for (const file of filesByPath(snapshot, /(^|\/)package\.json$/i)) {
    const data = json(file.text); if (!data) continue;
    for (const name of Object.keys((data.dependencies as Record<string,string>) || {})) deps.add(name);
    for (const name of Object.keys((data.devDependencies as Record<string,string>) || {})) dev.add(name);
    const rawScripts = (data.scripts as Record<string,string>) || {};
    for (const [name, command] of Object.entries(rawScripts)) scripts.push({ name, command, source: file.path, category: categorizeScript(name, command) });
  }
  return { deps: [...deps].sort(), dev: [...dev].sort(), scripts };
}
function categorizeScript(name: string, command: string): RepoCommand['category'] {
  const text = `${name} ${command}`.toLowerCase();
  if (/install|bootstrap/.test(text)) return 'install'; if (/\bdev\b|serve|start/.test(text)) return 'dev';
  if (/build|compile/.test(text)) return 'build'; if (/test|vitest|jest|pytest|playwright|cypress/.test(text)) return 'test';
  if (/lint|eslint|ruff|flake8/.test(text)) return 'lint'; if (/format|prettier|black/.test(text)) return 'format';
  if (/typecheck|type-check|tsc/.test(text)) return 'typecheck'; if (/deploy|publish|release/.test(text)) return 'deploy'; return 'other';
}

function inferPackageManagers(snapshot: RepoSnapshot) {
  const paths = snapshot.tree.map(x=>x.path.toLowerCase()); const out: string[] = [];
  if (paths.includes('pnpm-lock.yaml') || paths.some(p=>p.endsWith('/pnpm-lock.yaml'))) out.push('pnpm');
  if (paths.includes('yarn.lock') || paths.some(p=>p.endsWith('/yarn.lock'))) out.push('Yarn');
  if (paths.includes('package-lock.json') || paths.some(p=>p.endsWith('/package-lock.json'))) out.push('npm');
  if (paths.includes('bun.lock') || paths.includes('bun.lockb')) out.push('Bun');
  if (paths.includes('uv.lock')) out.push('uv'); if (paths.includes('poetry.lock')) out.push('Poetry');
  if (paths.includes('go.mod')) out.push('Go modules'); if (paths.includes('cargo.toml')) out.push('Cargo');
  if (paths.includes('pom.xml')) out.push('Maven'); if (paths.some(p=>/build\.gradle(?:\.kts)?$/.test(p))) out.push('Gradle');
  if (paths.includes('composer.json')) out.push('Composer'); if (paths.includes('gemfile')) out.push('Bundler');
  return unique(out);
}

function inferFrameworks(snapshot: RepoSnapshot, deps: string[], dev: string[]) {
  const all = new Set([...deps, ...dev].map(x=>x.toLowerCase())); const text = snapshot.files.map(f=>f.text.slice(0,6000)).join('\n').toLowerCase();
  const rules: [string, string[]][] = [
    ['Next.js',['next']],['React',['react']],['Vue',['vue']],['Nuxt',['nuxt']],['Svelte',['svelte']],['SvelteKit',['@sveltejs/kit']],['Astro',['astro']],
    ['Express',['express']],['Fastify',['fastify']],['NestJS',['@nestjs/core']],['Hono',['hono']],['Electron',['electron']],['Vite',['vite']],
    ['FastAPI',['fastapi']],['Django',['django']],['Flask',['flask']],['Pydantic',['pydantic']],['SQLAlchemy',['sqlalchemy']],
    ['Spring Boot',['spring-boot']],['Laravel',['laravel/framework']],['Rails',['rails']],['Phoenix',['phoenix']],['Tauri',['tauri']],
    ['Prisma',['prisma','@prisma/client']],['Drizzle',['drizzle-orm']],['Tailwind CSS',['tailwindcss']],['Playwright',['@playwright/test','playwright']],['Vitest',['vitest']],['Jest',['jest']]
  ];
  const out = rules.filter(([,names])=>names.some(n=>all.has(n))).map(([label])=>label);
  if (/\bgin-gonic\/gin\b/.test(text)) out.push('Gin'); if (/\bgorilla\/mux\b/.test(text)) out.push('Gorilla Mux'); if (/\bactix[_-]web\b/.test(text)) out.push('Actix Web');
  return unique(out);
}

function detectRepoKind(snapshot: RepoSnapshot, frameworks: string[]) {
  const paths = snapshot.tree.map(x=>x.path.toLowerCase()); const pkg = fileByPath(snapshot, /(^|\/)package\.json$/i); const data = pkg ? json(pkg.text) : null;
  const packageCount = paths.filter(p=>p.endsWith('/package.json') || /^(packages|apps)\/[^/]+\/(pyproject\.toml|cargo\.toml|go\.mod)$/.test(p)).length;
  if (packageCount >= 2 || paths.includes('pnpm-workspace.yaml') || paths.includes('turbo.json') || paths.includes('nx.json')) return 'monorepo';
  if (paths.some(p=>/(^|\/)cmd\/.+/.test(p)) || Boolean(data?.bin)) return 'CLI / developer tool';
  if (frameworks.some(x=>['Next.js','Nuxt','SvelteKit','Astro'].includes(x))) return 'web application';
  if (frameworks.some(x=>['Express','Fastify','NestJS','FastAPI','Django','Flask','Spring Boot','Gin','Actix Web'].includes(x))) return 'service / API';
  if (Boolean(data?.main) || Boolean(data?.exports) || paths.some(p=>/^src\/lib\./.test(p))) return 'library / SDK';
  return 'software repository';
}

function extractCommands(snapshot: RepoSnapshot, scripts: RepoCommand[]) {
  const out = [...scripts];
  const make = fileByPath(snapshot, /(^|\/)Makefile$/); if (make) {
    for (const match of make.text.matchAll(/^([A-Za-z0-9_.-]+):(?:\s|$)/gm)) {
      const name = match[1]; if (name.startsWith('.')) continue;
      out.push({ name, command:`make ${name}`, source:make.path, category:categorizeScript(name, name) });
    }
  }
  const py = fileByPath(snapshot, /(^|\/)pyproject\.toml$/i); if (py) {
    for (const m of py.text.matchAll(/^([A-Za-z0-9_.-]+)\s*=\s*["'][^"']+:[^"']+["']\s*$/gm)) out.push({ name:m[1], command:m[1], source:py.path, category:'other' });
  }
  return unique(out.map(c=>`${c.name}\0${c.command}\0${c.source}`)).map(key=>{ const [name,command,source]=key.split('\0'); return {name,command,source,category:categorizeScript(name,command)} as RepoCommand; }).slice(0,80);
}

function extractEndpoints(snapshot: RepoSnapshot) {
  const out: RepoEndpoint[] = [];
  for (const file of snapshot.files) {
    const p=file.path, t=file.text;
    const next = p.match(/(?:^|\/)app\/api\/(.+)\/route\.[cm]?[jt]s$/i);
    if (next) { const route='/api/'+next[1].replace(/\[(?:\.\.\.)?([^\]]+)\]/g,':$1').replace(/\/route$/,''); const methods=[...t.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map(m=>m[1]); for(const method of methods.length?methods:['ANY']) out.push({method,route,source:p}); }
    for (const m of t.matchAll(/\b(?:app|router)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi)) out.push({method:m[1].toUpperCase(),route:m[2],source:p});
    for (const m of t.matchAll(/@(?:app|router)\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/gi)) out.push({method:m[1].toUpperCase(),route:m[2],source:p});
    for (const m of t.matchAll(/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/g)) out.push({method:m[1].replace('Mapping','').replace('Request','ANY').toUpperCase(),route:m[2],source:p});
    for (const m of t.matchAll(/HandleFunc\(\s*["']([^"']+)["']/g)) out.push({method:'ANY',route:m[1],source:p});
  }
  return unique(out.map(e=>`${e.method}\0${e.route}\0${e.source}`)).map(x=>{const [method,route,source]=x.split('\0');return{method,route,source}}).slice(0,120);
}

function extractSymbols(snapshot: RepoSnapshot) {
  const out: RepoSymbol[]=[];
  for (const file of snapshot.files.filter(f=>/\.(?:[cm]?[jt]sx?|py|go|rs|java|kt|cs)$/i.test(f.path))) {
    const t=file.text;
    const patterns: [RegExp,string][] = [
      [/export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,'function'],[/export\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/g,'class'],[/export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,'export'],[/export\s+(?:interface|type|enum)\s+([A-Za-z_$][\w$]*)/g,'type'],
      [/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/gm,'function'],[/^class\s+([A-Za-z_]\w*)\b/gm,'class'],[/^func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)\s*\(/gm,'function'],[/^type\s+([A-Za-z_]\w*)\s+(?:struct|interface)\b/gm,'type'],
      [/\bpub\s+(?:async\s+)?fn\s+([A-Za-z_]\w*)/g,'function'],[/\bpub\s+(?:struct|enum|trait)\s+([A-Za-z_]\w*)/g,'type'],[/\bpublic\s+(?:abstract\s+|final\s+)?(?:class|interface|record|enum)\s+([A-Za-z_]\w*)/g,'type']
    ];
    for(const [re,kind] of patterns) for(const m of t.matchAll(re)) out.push({name:m[1],kind,source:file.path});
  }
  const seen=new Set<string>(); return out.filter(s=>{const k=`${s.source}:${s.kind}:${s.name}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,260);
}

function extractEnv(snapshot: RepoSnapshot) {
  const out:string[]=[];
  for(const file of snapshot.files){ const t=file.text;
    for(const m of t.matchAll(/(?:process\.env\.|import\.meta\.env\.)([A-Z][A-Z0-9_]{2,})/g)) out.push(m[1]);
    for(const m of t.matchAll(/(?:os\.getenv|os\.environ\.get|env::var|System\.getenv)\(\s*["']([A-Z][A-Z0-9_]{2,})["']/g)) out.push(m[1]);
    if(/\.env\.(?:example|sample)$/i.test(file.path)) for(const m of t.matchAll(/^([A-Z][A-Z0-9_]{2,})\s*=/gm)) out.push(m[1]);
  }
  return unique(out).sort().slice(0,120);
}

function extractCi(snapshot: RepoSnapshot) {
  return filesByPath(snapshot,/^\.github\/workflows\/.*\.ya?ml$/i).map(f=>{
    const name=f.text.match(/^name:\s*["']?([^\n"']+)/m)?.[1]?.trim(); return `${name || f.path.split('/').pop()} (${f.path})`;
  }).slice(0,40);
}
function extractTests(snapshot: RepoSnapshot){ return snapshot.tree.filter(x=>x.type==='blob' && (/(^|\/)(test|tests|__tests__|spec|e2e)\//i.test(x.path)||/\.(?:test|spec)\.[cm]?[jt]sx?$|_test\.go$|test_.*\.py$/i.test(x.path))).map(x=>x.path).slice(0,100); }
function docsHeadings(snapshot: RepoSnapshot){ const docs=filesByPath(snapshot,/(^|\/)(README|CONTRIBUTING|ARCHITECTURE|SECURITY).*\.md$/i).slice(0,8); const out:string[]=[]; for(const f of docs) for(const m of f.text.matchAll(/^#{1,3}\s+(.+)$/gm)) out.push(`${m[1].trim()} — ${f.path}`); return unique(out).slice(0,80); }

function architecture(snapshot: RepoSnapshot, kind:string, frameworks:string[], pm:string[]){ const paths=snapshot.tree.map(x=>x.path); const notes:string[]=[];
  notes.push(`Repository shape: ${kind}.`); if(frameworks.length) notes.push(`Detected framework/tooling signals: ${frameworks.join(', ')}.`); if(pm.length) notes.push(`Package/build ecosystem: ${pm.join(', ')}.`);
  const roots=['apps','packages','src','app','pages','lib','server','client','api','cmd','internal','pkg','services','modules','crates'].filter(r=>paths.some(p=>p===r||p.startsWith(r+'/'))); if(roots.length) notes.push(`Important top-level code areas: ${roots.join(', ')}.`);
  if(paths.some(p=>/migrations?\//i.test(p))) notes.push('Database/schema migrations are present; changes may require migration-aware validation.');
  if(paths.some(p=>/(prisma\/schema\.prisma|drizzle\.config|alembic|typeorm)/i.test(p))) notes.push('Database ORM/schema tooling is present.');
  if(paths.some(p=>/^\.github\/workflows\//.test(p))) notes.push('GitHub Actions workflows encode repository CI/release expectations.');
  if(paths.some(p=>/(dockerfile|docker-compose)/i.test(p))) notes.push('Container configuration is part of the operational surface.'); return notes; }

function conventions(snapshot: RepoSnapshot){ const p=snapshot.tree.map(x=>x.path.toLowerCase()), out:string[]=[];
  if(p.some(x=>x.includes('eslint'))) out.push('Run the repository ESLint workflow for JavaScript/TypeScript changes.'); if(p.some(x=>x.includes('prettier'))) out.push('Preserve Prettier formatting conventions.');
  if(p.some(x=>/(ruff|pyproject\.toml)/.test(x))) out.push('Respect Python lint/format configuration from pyproject/ruff settings.'); if(p.some(x=>x.includes('mypy'))) out.push('Preserve mypy/type-checking expectations.');
  if(p.some(x=>x.includes('golangci'))) out.push('Preserve golangci-lint expectations for Go changes.'); if(p.some(x=>x.includes('rustfmt')||x.includes('clippy'))) out.push('Use rustfmt/clippy conventions for Rust changes.');
  if(p.some(x=>x.endsWith('editorconfig'))) out.push('Follow .editorconfig whitespace and newline rules.'); return out; }

function coverage(snapshot:RepoSnapshot, commands:RepoCommand[], tests:string[], ci:string[], endpoints:RepoEndpoint[], frameworks:string[]){ let score=30; const reasons:string[]=[];
  const hasReadme=snapshot.files.some(f=>/(^|\/)readme/i.test(f.path)); if(hasReadme){score+=15;reasons.push('README/docs captured');}
  if(commands.length){score+=15;reasons.push('project commands detected');} if(tests.length){score+=12;reasons.push('tests detected');} if(ci.length){score+=10;reasons.push('CI workflows captured');}
  if(frameworks.length){score+=8;reasons.push('frameworks detected');} if(endpoints.length){score+=5;reasons.push('API routes detected');} if(snapshot.truncated){score-=10;reasons.push('GitHub tree was truncated');}
  return {score:Math.max(0,Math.min(100,score)),reasons}; }

export function analyzeRepository(snapshot: RepoSnapshot): RepoAnalysis {
  const pkg=packageData(snapshot); const packageManagers=inferPackageManagers(snapshot); const frameworks=inferFrameworks(snapshot,pkg.deps,pkg.dev); const repoKind=detectRepoKind(snapshot,frameworks);
  const commands=extractCommands(snapshot,pkg.scripts); const endpoints=extractEndpoints(snapshot); const symbols=extractSymbols(snapshot); const envVars=extractEnv(snapshot); const ciWorkflows=extractCi(snapshot); const tests=extractTests(snapshot);
  const keyDirectories=unique(snapshot.tree.filter(x=>x.type==='tree').map(x=>x.path.split('/')[0]).filter(Boolean)).slice(0,24);
  const keyFiles=snapshot.files.slice().sort((a,b)=>b.score-a.score).map(f=>f.path).slice(0,40); const hasSecurityPolicy=snapshot.tree.some(x=>/(^|\/)security\.md$/i.test(x.path));
  const risks:string[]=[]; if(envVars.length) risks.push('Configuration depends on environment variables; avoid inventing values or exposing secrets.'); if(snapshot.tree.some(x=>/migrations?\//i.test(x.path))) risks.push('Schema migrations are present; data compatibility may be affected by changes.'); if(!tests.length) risks.push('No test files were detected in the analyzed tree; validation may rely on build/lint/manual checks.'); if(snapshot.truncated) risks.push('GitHub reported a truncated recursive tree; some repository areas may be missing from this snapshot.'); if(snapshot.repo.archived) risks.push('The repository is archived; recommendations should account for maintenance status.');
  const cov=coverage(snapshot,commands,tests,ciWorkflows,endpoints,frameworks);
  return { repoKind, primaryLanguage:topLanguage(snapshot), frameworks, packageManagers, commands, endpoints, symbols, envVars, ciWorkflows, tests, keyDirectories, keyFiles, architectureNotes:architecture(snapshot,repoKind,frameworks,packageManagers), conventions:conventions(snapshot), risks, dependencies:pkg.deps, devDependencies:pkg.dev, docsHeadings:docsHeadings(snapshot), coverageScore:cov.score, coverageReasons:cov.reasons, monorepo:repoKind==='monorepo', hasDocker:snapshot.tree.some(x=>/(^|\/)(dockerfile|docker-compose)/i.test(x.path)), hasSecurityPolicy, hasCi:ciWorkflows.length>0, hasTests:tests.length>0 };
}
