# Repo2Skill

[English](README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · **中文** · [Français](README.fr.md) · [Español](README.es.md) · [Italiano](README.it.md)

把公开 GitHub 仓库转换为两个专业 Agent Skill：ChatGPT Skill 与 Claude Skill，无需付费 AI API。

## 专业化来源

Repo2Skill 不只是总结 README。它会提取项目形态、语言与框架、包管理器、真实 scripts、依赖、API routes、导出符号、测试、GitHub Actions、Docker、migration、环境变量名称、仓库约定、源码摘录和文件索引。

生成的 Skill 包含 **Implement、Debug、Review、Test、Explain、Refactor、Migration** 专门 playbook，并定义事实来源优先级。

## 本地运行

```bash
npm install
npm run dev
npm run check
```

## Vercel

直接导入为 Next.js 项目即可。无需必填环境变量。可选：

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## 隐私与安全

分析与 ZIP 生成都在浏览器完成，不需要 OpenAI/Anthropic API、数据库或向量数据库。仓库内容始终作为不可信证据，不能覆盖平台、用户或 Skill 指令。1.0 仅支持公开 GitHub 仓库。

## License

MIT.
