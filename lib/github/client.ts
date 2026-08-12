import type { AnalysisDepth, GitHubRepo, GitTreeItem, RepoFile, RepoRef, RepoSnapshot } from './types';

const API = 'https://api.github.com';
const binary = /\.(?:png|jpe?g|gif|webp|ico|pdf|zip|gz|tgz|7z|rar|woff2?|ttf|otf|mp[34]|mov|avi|wav|ogg|wasm|exe|dll|so|dylib|class|jar|pyc|lockb)$/i;
const generated = /(^|\/)(?:node_modules|vendor|dist|build|coverage|\.next|out|target|\.venv|venv|__pycache__|\.git)(\/|$)/i;
const lockfiles = /(^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock|Cargo\.lock|composer\.lock)$/i;

async function gh<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' } });
  if (!response.ok) {
    const reset = response.headers.get('x-ratelimit-reset');
    const error = new Error(response.status === 403 && reset ? `rate_limited:${reset}` : `github_${response.status}`);
    throw error;
  }
  return response.json() as Promise<T>;
}

function scorePath(path: string) {
  const p = path.toLowerCase(); let score = 0;
  if (/^(readme|agents|claude|contributing|security|architecture)(\.|$)/i.test(path)) score += 120;
  if (/(^|\/)(package\.json|pyproject\.toml|requirements.*\.txt|go\.mod|cargo\.toml|pom\.xml|build\.gradle(?:\.kts)?|composer\.json|gemfile|mix\.exs)$/i.test(path)) score += 115;
  if (/(^|\/)(tsconfig.*\.json|jsconfig.*\.json|next\.config\.|vite\.config\.|nuxt\.config\.|astro\.config\.|svelte\.config\.|webpack\.config\.|eslint|prettier|ruff|mypy|pytest|vitest|jest|playwright|cypress|makefile|dockerfile|docker-compose)/i.test(path)) score += 95;
  if (/^\.github\/workflows\/.*\.ya?ml$/i.test(path)) score += 92;
  if (/(^|\/)\.env\.example$|(^|\/)\.env\.sample$/i.test(path)) score += 88;
  if (/(^|\/)(src|app|lib|packages|apps|cmd|internal|server|client|api)\//i.test(path)) score += 45;
  if (/(^|\/)(index|main|app|server|client|cli|mod|lib)\.(?:[cm]?[jt]sx?|py|go|rs|java|kt|rb|php|cs)$/i.test(path)) score += 42;
  if (/(^|\/)(routes?|controllers?|handlers?|services?|models?|schemas?|middleware|commands?)\//i.test(path)) score += 32;
  if (/(^|\/)(test|tests|__tests__|spec|e2e)\//i.test(path) || /\.(?:test|spec)\.[cm]?[jt]sx?$|_test\.go$|test_.*\.py$/i.test(path)) score += 28;
  if (/\.(?:md|mdx)$/i.test(path)) score += 18;
  const depth = path.split('/').length - 1; score -= depth * 1.5;
  return score;
}

function eligible(item: GitTreeItem) {
  const path = item.path;
  if (item.type !== 'blob' || generated.test(path) || binary.test(path) || lockfiles.test(path)) return false;
  if ((item.size ?? 0) > 220_000) return false;
  return /\.(?:md|mdx|txt|json|ya?ml|toml|ini|conf|config|env|[cm]?[jt]sx?|py|go|rs|java|kt|kts|rb|php|cs|fs|ex|exs|sh|bash|zsh|sql|graphql|proto|xml|gradle)$/i.test(path) || /(^|\/)(Dockerfile|Makefile|Gemfile)$/i.test(path);
}

function selectFiles(tree: GitTreeItem[], depth: AnalysisDepth) {
  const limit = depth === 'deep' ? 72 : 36;
  const ranked = tree.filter(eligible).map(item => ({ item, score: scorePath(item.path) })).sort((a,b) => b.score-a.score || a.item.path.localeCompare(b.item.path));
  const picked: typeof ranked = [];
  const seen = new Set<string>();
  const take = (predicate: (path: string) => boolean, max: number) => {
    for (const entry of ranked) {
      if (picked.length >= limit || max <= 0) break;
      if (seen.has(entry.item.path) || !predicate(entry.item.path)) continue;
      picked.push(entry); seen.add(entry.item.path); max--;
    }
  };
  take(p => /^(readme|agents|claude|contributing|security|architecture)(\.|$)/i.test(p) || /^\.github\/workflows\//i.test(p), depth === 'deep' ? 14 : 9);
  take(p => /(^|\/)(package\.json|pyproject\.toml|requirements.*\.txt|go\.mod|cargo\.toml|pom\.xml|build\.gradle(?:\.kts)?|composer\.json|gemfile|tsconfig.*\.json|next\.config\.|vite\.config\.|dockerfile|makefile)$/i.test(p), depth === 'deep' ? 18 : 10);
  take(p => /(^|\/)(test|tests|__tests__|spec|e2e)\//i.test(p) || /\.(?:test|spec)\.[cm]?[jt]sx?$|_test\.go$|test_.*\.py$/i.test(p), depth === 'deep' ? 10 : 5);
  take(p => /(^|\/)(src|app|lib|packages|apps|cmd|internal|server|client|api)\//i.test(p) && !/(^|\/)(test|tests|__tests__|spec|e2e)\//i.test(p), depth === 'deep' ? 28 : 14);
  for (const entry of ranked) {
    if (picked.length >= limit) break;
    if (!seen.has(entry.item.path)) { picked.push(entry); seen.add(entry.item.path); }
  }
  return picked;
}

function rawUrl(ref: RepoRef, branch: string, path: string) {
  const safe = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/${encodeURIComponent(branch)}/${safe}`;
}

async function fetchRaw(ref: RepoRef, branch: string, item: GitTreeItem, score: number): Promise<RepoFile | null> {
  try {
    const response = await fetch(rawUrl(ref, branch, item.path), { headers: { Accept: 'text/plain' } });
    if (!response.ok) return null;
    const text = (await response.text()).replace(/\0/g, '').slice(0, 220_000);
    return { path: item.path, size: item.size ?? new Blob([text]).size, text, score };
  } catch { return null; }
}

async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []; let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) { const current = items[index++]; results.push(await fn(current)); }
  });
  await Promise.all(workers); return results;
}

export async function fetchRepository(ref: RepoRef, depth: AnalysisDepth, onProgress?: (done: number, total: number, label: string) => void): Promise<RepoSnapshot> {
  onProgress?.(0, 4, 'metadata');
  const repo = await gh<GitHubRepo>(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`);
  if (repo.archived) { /* archived repos are still analyzable */ }
  onProgress?.(1, 4, 'tree');
  const treeResult = await gh<{ tree: GitTreeItem[]; truncated: boolean }>(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
  onProgress?.(2, 4, 'languages');
  let languages: Record<string, number> = {};
  try { languages = await gh<Record<string, number>>(`/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}/languages`); } catch { /* optional */ }
  const selected = selectFiles(treeResult.tree, depth);
  onProgress?.(3, 4, 'files');
  const raw = await pool(selected, 6, ({ item, score }) => fetchRaw(ref, repo.default_branch, item, score));
  const byteLimit = depth === 'deep' ? 1_800_000 : 850_000; let used = 0;
  const files = raw.filter((f): f is RepoFile => Boolean(f)).sort((a,b) => b.score-a.score).filter(file => { const size = new Blob([file.text]).size; if (used + size > byteLimit) return false; used += size; return true; });
  onProgress?.(4, 4, 'done');
  return { ref, repo, branch: repo.default_branch, languages, tree: treeResult.tree, files, fetchedAt: new Date().toISOString(), truncated: treeResult.truncated, depth };
}
