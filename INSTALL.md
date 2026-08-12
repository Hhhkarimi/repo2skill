# Repo2Skill Multilingual README Pack v2

Copy everything in this folder into the root of your `repo2skill` repository and allow replacement of the README files.

Expected structure:

```text
repo2skill/
├── README.md
├── README.fa.md
├── README.ar.md
├── README.zh.md
├── README.fr.md
├── README.es.md
├── README.it.md
└── assets/
    └── readme/
        ├── repo2skill-hero-en.png
        ├── repo2skill-hero-fa.png
        ├── repo2skill-hero-ar.png
        ├── repo2skill-hero-zh.png
        ├── repo2skill-hero-fr.png
        ├── repo2skill-hero-es.png
        ├── repo2skill-hero-it.png
        ├── repo2skill-demo-en.gif
        ├── repo2skill-demo-fa.gif
        ├── repo2skill-demo-ar.gif
        ├── repo2skill-demo-zh.gif
        ├── repo2skill-demo-fr.gif
        ├── repo2skill-demo-es.gif
        └── repo2skill-demo-it.gif
```

Commit:

```bash
git add README*.md assets/readme
git commit -m "docs: add localized README heroes and demos"
git push
```
