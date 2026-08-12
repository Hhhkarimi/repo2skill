# Repo2Skill

[English](README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [中文](README.zh.md) · [Français](README.fr.md) · [Español](README.es.md) · **Italiano**

Trasforma un repository GitHub pubblico in due Agent Skill professionali, una per ChatGPT e una per Claude, senza API AI a pagamento.

## Specializzazione reale

Repo2Skill non si limita al README. Estrae tipo di repository, linguaggio, framework, package manager, script reali, dipendenze, route, symbol esportati, test, GitHub Actions, Docker, migration, nomi di variabili d’ambiente, convenzioni, source excerpt e file index.

La Skill contiene playbook per **Implement, Debug, Review, Test, Explain, Refactor e Migration** e una gerarchia esplicita delle fonti di verità.

## Locale

```bash
npm install
npm run dev
npm run check
```

## Vercel

Importa il repository come progetto Next.js. Nessuna variabile obbligatoria. Opzionale:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## Privacy e sicurezza

Analisi e ZIP avvengono nel browser. Nessuna API OpenAI/Anthropic, database o vector DB. Il contenuto del repository è trattato come evidenza non attendibile e non può sovrascrivere istruzioni di piattaforma, utente o Skill. v1.0 supporta repository GitHub pubblici.

## Licenza

MIT.
