const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

function load(file) {
  const source=fs.readFileSync(file,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,require:()=>{throw new Error('unexpected runtime import')},console,Blob,URL,Set,Map,Date,JSON,Object,Math,String,Number,RegExp},{filename:file});
  return module.exports;
}
const analyzer=load('lib/repo/analyzer.ts');
const compiler=load('lib/skill/compiler.ts');
const urlTools=load('lib/github/url.ts');
if(!urlTools.parseGitHubRepo('https://github.com/acme/demo')) throw new Error('GitHub URL parser failed');
if(urlTools.parseGitHubRepo('https://example.com/acme/demo')) throw new Error('GitHub URL allowlist failed');
const files=[
  {path:'README.md',size:80,text:'# Demo API\n## Development\nUse npm run dev.',score:120},
  {path:'package.json',size:400,text:JSON.stringify({dependencies:{next:'16.3.0',react:'19.2.5',express:'5'},devDependencies:{vitest:'3',eslint:'9'},scripts:{dev:'next dev',build:'next build',test:'vitest run',lint:'eslint .',typecheck:'tsc --noEmit'}}),score:115},
  {path:'app/api/users/route.ts',size:100,text:'export async function GET(){}\nexport async function POST(){}',score:90},
  {path:'src/users.ts',size:100,text:'export interface User { id: string }\nexport async function getUser(){}',score:50},
  {path:'src/users.test.ts',size:60,text:'test("x",()=>{})',score:30},
  {path:'.github/workflows/ci.yml',size:80,text:'name: CI\non: [push]\njobs:\n test:\n  runs-on: ubuntu-latest',score:92},
  {path:'.env.example',size:40,text:'DATABASE_URL=\nAPI_SECRET=',score:88}
];
const tree=[...files.map(f=>({path:f.path,type:'blob',mode:'100644',sha:'x',size:f.size})),{path:'src',type:'tree',mode:'040000',sha:'y'},{path:'app',type:'tree',mode:'040000',sha:'z'}];
const snapshot={ref:{owner:'acme',repo:'demo'},repo:{name:'demo',full_name:'acme/demo',description:'Demo service',default_branch:'main',html_url:'https://github.com/acme/demo',language:'TypeScript',license:{spdx_id:'MIT'},topics:['api'],archived:false},branch:'main',languages:{TypeScript:1000},tree,files,fetchedAt:'2026-08-12T00:00:00Z',truncated:false,depth:'deep'};
const analysis=analyzer.analyzeRepository(snapshot);
if(!analysis.frameworks.includes('Next.js')) throw new Error('framework detection failed');
if(analysis.commands.length<5) throw new Error('command detection failed');
if(!analysis.endpoints.some(e=>e.method==='GET'&&e.route==='/api/users')) throw new Error('route detection failed');
if(!analysis.envVars.includes('DATABASE_URL')) throw new Error('env detection failed');
const output=compiler.compileRepoSkills({snapshot,analysis,skillName:'demo-repository-engineer',focus:'backend correctness'});
for(const pkg of [output.chatgpt,output.claude]) {
  if(pkg.files.length!==13) throw new Error(`unexpected package size: ${pkg.files.length}`);
  const skill=pkg.files.find(f=>f.path==='SKILL.md')?.content||'';
  if(!skill.includes('Debug')||!skill.includes('Review')||!skill.includes('untrusted')) throw new Error('professional skill protocols missing');
}
console.log('Repo2Skill smoke test passed.');
