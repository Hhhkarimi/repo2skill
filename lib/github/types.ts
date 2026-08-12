export type AnalysisDepth = 'focused' | 'deep';
export type RepoRef = { owner: string; repo: string };
export type GitHubRepo = {
  name: string; full_name: string; description: string | null; default_branch: string; html_url: string;
  language: string | null; license: { spdx_id?: string | null; name?: string | null } | null;
  topics?: string[]; stargazers_count?: number; forks_count?: number; archived?: boolean; fork?: boolean;
  pushed_at?: string; updated_at?: string;
};
export type GitTreeItem = { path: string; mode: string; type: 'blob' | 'tree' | 'commit'; sha: string; size?: number; url?: string };
export type RepoFile = { path: string; size: number; text: string; score: number };
export type RepoSnapshot = {
  ref: RepoRef; repo: GitHubRepo; branch: string; languages: Record<string, number>; tree: GitTreeItem[];
  files: RepoFile[]; fetchedAt: string; truncated: boolean; depth: AnalysisDepth;
};
