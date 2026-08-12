# Repo2Skill

[English](README.md) · [فارسی](README.fa.md) · **العربية** · [中文](README.zh.md) · [Français](README.fr.md) · [Español](README.es.md) · [Italiano](README.it.md)

حوّل مستودع GitHub عامًا إلى حزمتَي Agent Skill احترافيتين، واحدة لـ ChatGPT وأخرى لـ Claude، بدون API ذكاء اصطناعي مدفوعة.

## لماذا المخرجات احترافية؟

لا يكتفي Repo2Skill بتلخيص README. بل يستخرج شكل المستودع، اللغة والأطر، مديري الحزم، scripts الحقيقية، التبعيات، routes، الرموز المصدرة، الاختبارات، GitHub Actions، Docker، migrations، أسماء متغيرات البيئة، الاتفاقيات، مقتطفات المصدر وفهرس الملفات.

تتضمن Skill playbooks مستقلة لـ **Implement وDebug وReview وTest وExplain وRefactor وMigration** مع تسلسل واضح لمصادر الحقيقة.

## التشغيل

```bash
npm install
npm run dev
```

وللتحقق الكامل:

```bash
npm run check
```

## Vercel

استورد المستودع كمشروع Next.js. لا توجد متغيرات بيئة إلزامية. اختياريًا:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## الخصوصية والأمان

التحليل وإنشاء ZIP داخل المتصفح. لا توجد قاعدة بيانات أو مفاتيح OpenAI/Anthropic. محتوى المستودع دليل غير موثوق ولا يمكنه تجاوز تعليمات المنصة أو المستخدم أو Skill. النسخة 1.0 تدعم مستودعات GitHub العامة فقط.

## الترخيص

MIT.
