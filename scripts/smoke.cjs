const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = process.cwd();
const cache = new Map();

function resolveLocal(specifier, fromFile) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier);
  else throw new Error(`unexpected runtime import: ${specifier}`);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`cannot resolve ${specifier} from ${fromFile}`);
}

function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const source = fs.readFileSync(absolute, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: absolute,
  }).outputText;
  const module = { exports: {} };
  cache.set(absolute, module);
  const localRequire = specifier => load(resolveLocal(specifier, absolute));
  vm.runInNewContext(code, {
    module, exports: module.exports, require: localRequire, console,
    Blob, URL, Set, Map, Date, JSON, Object, Math, String, Number, RegExp, Array,
  }, { filename: absolute });
  return module.exports;
}

const analyzer = load('lib/repo/analyzer.ts');
const compiler = load('lib/skill/compiler.ts');
const urlTools = load('lib/github/url.ts');

if (!urlTools.parseGitHubRepo('https://github.com/acme/demo')) throw new Error('GitHub URL parser failed');
if (urlTools.parseGitHubRepo('https://example.com/acme/demo')) throw new Error('GitHub URL allowlist failed');

const files = [
  { path: 'README.md', size: 180, text: '# Demo API\n## Development\nUse npm run dev.\n## Architecture\nRoutes call service modules.', score: 120 },
  { path: 'package.json', size: 500, text: JSON.stringify({ dependencies: { next: '16.3.0', react: '19.2.5', express: '5' }, devDependencies: { vitest: '3', eslint: '9' }, scripts: { dev: 'next dev', build: 'next build', test: 'vitest run', lint: 'eslint .', typecheck: 'tsc --noEmit' } }), score: 115 },
  { path: 'app/api/users/route.ts', size: 170, text: 'import { getUser } from "../../../src/users";\nexport async function GET(){}\nexport async function POST(){}', score: 100 },
  { path: 'src/users.ts', size: 180, text: 'export interface User { id: string }\nexport async function getUser(){}\nexport async function createUser(){}', score: 90 },
  { path: 'src/users.test.ts', size: 100, text: 'test("gets a user",()=>{})\ntest("creates a user",()=>{})', score: 85 },
  { path: '.github/workflows/ci.yml', size: 130, text: 'name: CI\non: [push]\njobs:\n test:\n  runs-on: ubuntu-latest\n  steps:\n   - run: npm test', score: 92 },
  { path: '.env.example', size: 40, text: 'DATABASE_URL=\nAPI_SECRET=', score: 88 },
  { path: 'Dockerfile', size: 80, text: 'FROM node:22-alpine\nWORKDIR /app\nCOPY . .\nRUN npm run build', score: 70 },
  { path: 'docs/api.md', size: 120, text: '# API\nGET /api/users returns users.\nPOST /api/users creates a user.', score: 65 },
];
const tree = [
  ...files.map(file => ({ path: file.path, type: 'blob', mode: '100644', sha: 'x', size: file.size })),
  { path: 'src', type: 'tree', mode: '040000', sha: 'y' },
  { path: 'app', type: 'tree', mode: '040000', sha: 'z' },
  { path: 'docs', type: 'tree', mode: '040000', sha: 'q' },
];
const snapshot = {
  ref: { owner: 'acme', repo: 'demo' },
  repo: { name: 'demo', full_name: 'acme/demo', description: 'Demo service', default_branch: 'main', html_url: 'https://github.com/acme/demo', language: 'TypeScript', license: { spdx_id: 'MIT' }, topics: ['api'], archived: false },
  branch: 'main', languages: { TypeScript: 1000 }, tree, files,
  fetchedAt: '2026-08-12T00:00:00Z', truncated: false, depth: 'deep',
};

const analysis = analyzer.analyzeRepository(snapshot);
if (!analysis.frameworks.includes('Next.js')) throw new Error('framework detection failed');
if (analysis.commands.length < 5) throw new Error('command detection failed');
if (!analysis.endpoints.some(endpoint => endpoint.method === 'GET' && endpoint.route === '/api/users')) throw new Error('route detection failed');
if (!analysis.envVars.includes('DATABASE_URL')) throw new Error('env detection failed');

const output = compiler.compileRepoSkills({ snapshot, analysis, skillName: 'demo-repository-engineer', focus: 'backend correctness' });
for (const pkg of [output.chatgpt, output.claude]) {
  const paths = new Set(pkg.files.map(file => file.path));
  const skill = pkg.files.find(file => file.path === 'SKILL.md')?.content || '';
  const evalsRaw = pkg.files.find(file => file.path === 'evals/evals.json')?.content || '';
  const triggersRaw = pkg.files.find(file => file.path === 'evals/trigger-queries.json')?.content || '';
  const evidence = pkg.files.filter(file => /^references\/evidence-(?!index)/.test(file.path));

  if (!/^---\nname: demo-repository-engineer\n/m.test(skill)) throw new Error('Agent Skills frontmatter name missing/invalid');
  const description = skill.match(/\ndescription: "([^"]+)"/)?.[1] || '';
  if (!description.startsWith('Use this skill when')) throw new Error('activation-oriented description missing');
  if (description.length > 1024) throw new Error(`description exceeds Agent Skills limit: ${description.length}`);
  if (!skill.includes('Decision quality gate') || !skill.includes('Never fake execution') || !skill.includes('Activation boundary')) throw new Error('senior engineering protocol missing');
  if (skill.split('\n').length > 500) throw new Error('SKILL.md exceeds recommended 500 lines');

  for (const required of [
    'references/decision-policy.md', 'references/implementation-playbook.md', 'references/debugging-playbook.md',
    'references/review-playbook.md', 'references/refactor-migration-playbook.md', 'references/evidence-index.md',
    'evals/evals.json', 'evals/trigger-queries.json', 'evals/rubric.md', 'evals/README.md',
  ]) if (!paths.has(required)) throw new Error(`missing professional Skill asset: ${required}`);

  if (paths.has('references/source-excerpts.md')) throw new Error('monolithic source-excerpts.md must not be generated');
  if (evidence.length < 4) throw new Error(`expected multiple focused evidence packs, got ${evidence.length}`);
  if (evidence.some(file => file.content.length > 24_000)) throw new Error('evidence pack exceeds context budget');
  if (!pkg.files.find(file => file.path === 'references/evidence-index.md')?.content.includes('smallest relevant evidence pack')) throw new Error('evidence retrieval policy missing');

  const evals = JSON.parse(evalsRaw);
  if (evals.skill_name !== 'demo-repository-engineer' || evals.evals.length < 8) throw new Error('task eval suite missing/too small');
  if (evals.evals.some(test => !test.prompt || !test.expected_output || !Array.isArray(test.assertions) || test.assertions.length < 4)) throw new Error('task eval case lacks professional assertions');
  const validationHonesty = evals.evals.find(test => /confidently tell me that all tests/i.test(test.prompt));
  if (!validationHonesty) throw new Error('validation-honesty eval missing');

  const triggers = JSON.parse(triggersRaw);
  if (triggers.length !== 20) throw new Error(`expected 20 trigger eval queries, got ${triggers.length}`);
  const positives = triggers.filter(test => test.should_trigger).length;
  const negatives = triggers.filter(test => !test.should_trigger).length;
  if (positives !== 10 || negatives !== 10) throw new Error('trigger evals must balance positive and near-miss negative cases');
  if (!triggers.some(test => test.split === 'validation' && test.should_trigger) || !triggers.some(test => test.split === 'validation' && !test.should_trigger)) throw new Error('trigger validation split missing');

  if (!pkg.files.find(file => file.path === 'evals/rubric.md')?.content.includes('Hard-fail conditions')) throw new Error('holistic eval rubric missing hard-fail rules');
  if (!pkg.files.find(file => file.path === 'references/provenance.md')?.content.includes('Repo2Skill 1.1.0')) throw new Error('provenance version mismatch');
}

console.log('Repo2Skill professional Skill smoke test passed.');
