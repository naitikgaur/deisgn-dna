# Instructions for AI coding agents

This repo contains **design-dna**, a CLI that extracts a website's design language.

## Workflow
1. If `node_modules/` is missing run `npm install`.
2. Run `node bin/cli.js <url> --remix` for the site the user wants as design inspiration.
3. Read `output/<host>/DESIGN.md` and `output/<host>/tokens.css`. View the images in `output/<host>/screenshots/` if you can see images.
4. Follow `prompts/build-site.md` to build the user's project in a **separate folder** (e.g. `./my-site`).

## Rules
- Use the design as inspiration only. Write original copy, original brand, original components.
- Never copy text, logos, images, icons, non-open fonts, or code from the reference site.
- Prefer the `--remix` tokens in `tokens.css`.
- Respect the target site's robots/ToS; only analyse pages the user is allowed to visit.
