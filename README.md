# Repo2Skill

**English** · [فارسی](README.fa.md) · [العربية](README.ar.md) · [中文](README.zh.md) · [Français](README.fr.md) · [Español](README.es.md) · [Italiano](README.it.md)

Turn a public GitHub repository into two professional, repository-native Agent Skills: one for ChatGPT and one for Claude — without paid AI APIs.

## What makes Repo2Skill different

Repo2Skill does not simply summarize a README. It deterministically maps repository evidence and compiles an engineering operating system for the codebase:

- repository shape: monorepo, library/SDK, web app, service/API, CLI or general software repository;
- primary language, frameworks, package/build ecosystems and dependency graph signals;
- real project scripts and Make targets;
- exported/public code symbols and high-signal entrypoints;
- API route/handler patterns across common stacks;
- tests, GitHub Actions CI, Docker, migrations and environment-variable names;
- repository conventions and risk signals;
- bounded source excerpts and a file index for progressive disclosure;
- task playbooks for **Implement, Debug, Review, Test, Explain, Refactor and Migrate**;
- source-of-truth rules and an explicit untrusted-source boundary.

## Outputs

Each analyzed repository can export two ZIP files:

```text
my-repo-repository-engineer-chatgpt/
├── SKILL.md
└── references/
    ├── repository-profile.md
    ├── architecture.md
    ├── workflows.md
    ├── commands.md
    ├── code-map.md
    ├── interfaces.md
    ├── dependencies.md
    ├── testing-and-ci.md
    ├── config-security.md
    ├── source-excerpts.md
    ├── file-index.md
    └── provenance.md
```

Claude receives the same evidence library with a Claude-optimized `SKILL.md` designed around progressive disclosure.

## Zero paid-AI-API architecture

Repo2Skill is browser-first. The browser calls GitHub's public REST API for repository metadata/tree/languages and fetches selected public raw files from `raw.githubusercontent.com`. Analysis and ZIP generation happen in the browser.

No OpenAI API key, Anthropic API key, database, vector database or paid analysis service is required. GitHub's own public API limits still apply.

## Supported UI languages

English is the default. The app also ships with Persian, Arabic, Simplified Chinese, French, Spanish and Italian. Persian and Arabic use real RTL layouts. Locale-aware self-hosted fonts are bundled at build time: Manrope, Vazirmatn, Cairo and Noto Sans SC.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root redirects to `/en`.

Production verification:

```bash
npm run check
```

## Deploy to Vercel

Import the GitHub repository in Vercel and deploy as a Next.js project. No environment variable is required. Optionally set:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

for canonical URLs, Open Graph metadata and sitemap generation.

## Security model

- Only `github.com` repository identifiers are accepted by the URL parser.
- Repository fetching is browser-side; there is no general-purpose server fetch endpoint.
- CSP restricts network connections to GitHub API/raw content plus the application origin.
- Repository text is treated as untrusted evidence and cannot override platform, workspace, user or Skill instructions.
- Secret values are not requested or bundled. Only detected environment-variable **names** can appear in the Skill.
- Generated Skills tell the model to inspect commands before destructive deploy/release/migration actions and to never claim unexecuted checks passed.

## SEO / GEO foundations

Localized metadata, canonical URLs, `hreflang`, sitemap, robots, structured data and `llms.txt` are included without exposing implementation-focused marketing cards in the main user flow.

## Scope

Version 1.0 analyzes **public GitHub repositories**. Private repository OAuth/token support is intentionally not included in the zero-secret MVP.

## License

MIT.
