# Repo2Skill

[English](README.md) · **فارسی** · [العربية](README.ar.md) · [中文](README.zh.md) · [Français](README.fr.md) · [Español](README.es.md) · [Italiano](README.it.md)

یک ریپوی عمومی GitHub را بدون API پولی هوش مصنوعی به دو Agent Skill حرفه‌ای و repository-native تبدیل کنید: یکی برای ChatGPT و یکی برای Claude.

## چه چیزی خروجی را حرفه‌ای می‌کند؟

Repo2Skill فقط README را خلاصه نمی‌کند. ساختار واقعی ریپو را می‌خواند و این موارد را استخراج می‌کند: نوع پروژه، زبان و frameworkها، package managerها، scriptهای واقعی، dependencyها، routeها، symbolهای exportشده، testها، GitHub Actions، Docker، migrationها، env variable nameها، conventionها، source excerptها و file index.

Skill نهایی برای **Implement، Debug، Review، Test، Explain، Refactor و Migration** playbook جدا دارد و مشخص می‌کند کدام منبع حقیقت بالاتری دارد.

## ساختار خروجی

```text
repository-engineer-chatgpt/
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

برای Claude نیز همین کتابخانه شواهد با `SKILL.md` بهینه‌شده برای progressive disclosure تولید می‌شود.

## معماری بدون API پولی

تحلیل داخل مرورگر انجام می‌شود. مرورگر metadata/tree/languages را از API عمومی GitHub و فایل‌های منتخب را از `raw.githubusercontent.com` می‌گیرد. ZIP نیز داخل مرورگر ساخته می‌شود. به OpenAI API، Anthropic API، دیتابیس یا vector DB نیاز نیست. محدودیت‌های خود API عمومی GitHub همچنان اعمال می‌شوند.

## زبان‌ها و فونت‌ها

English پیش‌فرض است. فارسی، عربی، چینی ساده، فرانسوی، اسپانیایی و ایتالیایی نیز پشتیبانی می‌شوند. فارسی و عربی RTL واقعی دارند. فونت‌ها در build به‌صورت self-hosted نصب می‌شوند: Manrope، Vazirmatn، Cairo و Noto Sans SC.

## اجرای محلی

```bash
npm install
npm run dev
```

برای بررسی production:

```bash
npm run check
```

## دیپلوی روی Vercel

ریپو را در Vercel Import کنید و به‌عنوان Next.js deploy کنید. Environment Variable اجباری نیست. برای canonical/OG/sitemap می‌توانید اختیاری این مقدار را بگذارید:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## امنیت

Repo2Skill endpoint عمومی برای fetch دلخواه ندارد؛ تحلیل GitHub در مرورگر انجام می‌شود. CSP ارتباط را محدود می‌کند. محتوای ریپو untrusted evidence محسوب می‌شود و نمی‌تواند دستورهای platform/workspace/user/Skill را override کند. مقدار secretها جمع‌آوری نمی‌شود و Skill فقط نام env variableهای تشخیص‌داده‌شده را می‌تواند نگه دارد.

## محدوده نسخه 1.0

فقط ریپوهای عمومی GitHub. OAuth یا token برای private repo عمداً در MVP رایگان و بدون secret قرار نگرفته است.

## مجوز

MIT.
