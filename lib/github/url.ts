import type { RepoRef } from './types';
const part = /^[A-Za-z0-9_.-]{1,100}$/;
export function parseGitHubRepo(value: string): RepoRef | null {
  const raw = value.trim().replace(/\.git\/?$/, '');
  if (!raw) return null;
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(raw)) {
    const [owner, repo] = raw.split('/'); return part.test(owner) && part.test(repo) ? { owner, repo } : null;
  }
  try {
    const url = new URL(raw);
    if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) return null;
    const [owner, repo] = url.pathname.split('/').filter(Boolean);
    return owner && repo && part.test(owner) && part.test(repo) ? { owner, repo } : null;
  } catch { return null; }
}
export function repoLabel(ref: RepoRef) { return `${ref.owner}/${ref.repo}`; }
