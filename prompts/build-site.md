# Master prompt: build an original site from a Design DNA brief

Paste this into your AI tool (Cursor, Claude Code, Codex, Copilot, Windsurf, etc.).
Replace the bracketed parts.

---

You are a senior front-end designer-engineer.

**Inputs**
- Design brief: `output/[host]/DESIGN.md`
- Tokens: `output/[host]/tokens.css` (use these CSS variables)
- Visual reference: `output/[host]/screenshots/` (look, don't trace)

**My project:** [what the site is, who it's for, name, tone, pages needed]

**Task**
1. Read DESIGN.md fully. Summarise the design language in 5 bullets (layout rhythm, type, color, shapes, motion).
2. Propose an original brand name/logo concept and a section plan for my project, adapting the structure (reorder or merge sections, vary the hero).
3. Build the site with [stack: plain HTML/CSS/JS | React + Vite | Next.js + Tailwind]. Import `tokens.css`, and map the tokens into the framework config.
4. Write all copy yourself for my project. Use open-licensed or generated imagery and icons only.
5. Make it responsive using the breakpoints in the brief, accessible (WCAG AA contrast, focus rings, alt text, semantic HTML) and fast.
6. Finish with a short "What I changed vs. the reference" list so I can verify the result is original.

**Hard rules**
- Never copy text, logos, images, icons, proprietary fonts, or code from the reference site.
- Capture the *feel*, not the *file*.
