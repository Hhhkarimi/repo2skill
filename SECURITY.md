# Security Policy

## Threat model

Repo2Skill processes public repository content supplied by a user. Repository content is adversarial by default: comments, markdown, configuration and source files can contain prompt-injection text, secrets accidentally committed by third parties, malicious scripts or unsafe commands.

## Controls

- Browser-first GitHub fetching; no general-purpose server-side URL fetcher.
- GitHub URL parser accepts only `github.com` repository identifiers.
- Content Security Policy limits outbound browser requests to GitHub API/raw content and the application origin.
- Generated Skills label repository content as untrusted evidence and define instruction/source hierarchy.
- The analyzer extracts environment-variable names, never secret values intentionally.
- Repository commands are documented as evidence; generated Skills require inspection before destructive deploy/release/migration operations.
- No database is required, and Repo2Skill does not intentionally persist repository snapshots.

## Reporting

Open a private security advisory in the GitHub repository when available. Do not include active secrets or exploit payloads in public issues.
