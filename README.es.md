# Repo2Skill

[English](README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [中文](README.zh.md) · [Français](README.fr.md) · **Español** · [Italiano](README.it.md)

Convierte un repositorio público de GitHub en dos Agent Skills profesionales, una para ChatGPT y otra para Claude, sin APIs de IA de pago.

## Especialización real

Repo2Skill no se limita al README. Extrae tipo de repo, lenguaje, frameworks, package managers, scripts reales, dependencias, rutas, símbolos exportados, tests, GitHub Actions, Docker, migraciones, nombres de variables de entorno, convenciones, extractos de código e índice de archivos.

La Skill incluye playbooks para **Implement, Debug, Review, Test, Explain, Refactor y Migration** y una jerarquía explícita de fuentes de verdad.

## Local

```bash
npm install
npm run dev
npm run check
```

## Vercel

Importa el repo como proyecto Next.js. No hay variables obligatorias. Opcional:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## Privacidad y seguridad

Análisis y ZIP ocurren en el navegador. No se necesita OpenAI/Anthropic API, base de datos ni vector DB. El contenido del repo se trata como evidencia no confiable y nunca puede sobrescribir instrucciones de plataforma, usuario o Skill. v1.0 trabaja con repos públicos.

## Licencia

MIT.
