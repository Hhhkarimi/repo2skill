# Repo2Skill

[English](README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [中文](README.zh.md) · **Français** · [Español](README.es.md) · [Italiano](README.it.md)

Transformez un dépôt GitHub public en deux Agent Skills professionnelles, une pour ChatGPT et une pour Claude, sans API IA payante.

## Une Skill réellement spécialisée

Repo2Skill ne résume pas seulement le README. Il extrait le type de dépôt, le langage, les frameworks, gestionnaires de paquets, scripts réels, dépendances, routes, symboles exportés, tests, GitHub Actions, Docker, migrations, noms de variables d’environnement, conventions, extraits source et index des fichiers.

La Skill contient des playbooks **Implement, Debug, Review, Test, Explain, Refactor et Migration** et une hiérarchie explicite des sources de vérité.

## Local

```bash
npm install
npm run dev
npm run check
```

## Vercel

Importez le dépôt comme projet Next.js. Aucune variable obligatoire. Optionnel :

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## Confidentialité et sécurité

Analyse et ZIP sont réalisés dans le navigateur. Pas d’API OpenAI/Anthropic, base de données ou vector DB. Le contenu du dépôt reste une preuve non fiable et ne peut pas remplacer les instructions de la plateforme, de l’utilisateur ou de la Skill. La v1.0 cible les dépôts GitHub publics.

## Licence

MIT.
