#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { extract } from '../src/extract.js';
import { buildTokens, tokensCss, buildMarkdown } from '../src/report.js';

const args = process.argv.slice(2);
const help = `
design-dna <url> [options]

  --out <dir>     Output folder (default: ./output/<hostname>)
  --remix         Also generate a shifted palette/fonts/radius so your build is clearly its own
  --seed <n>      Seed for --remix (repeatable results)
  --no-mobile     Skip the mobile screenshot

Example: node bin/cli.js https://example.com --remix
`;

if (!args[0] || args.includes('-h') || args.includes('--help')) { console.log(help); process.exit(0); }

const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);

let url = args[0];
if (!/^https?:\/\//.test(url)) url = 'https://' + url;
const host = new URL(url).hostname.replace(/^www\./, '');
const outDir = path.resolve(val('--out') || `output/${host}`);
const shotDir = path.join(outDir, 'screenshots');
fs.mkdirSync(shotDir, { recursive: true });

console.log(`\n🧬 Reading design DNA of ${url} ...`);
const { data, screenshots } = await extract(url, { screenshotDir: shotDir, mobile: !flag('--no-mobile') });
const remix = flag('--remix');
const tokens = buildTokens(data, { remix, seed: val('--seed') ? Number(val('--seed')) : Date.now() });

fs.writeFileSync(path.join(outDir, 'design-dna.json'), JSON.stringify({ url, tokens, raw: data }, null, 2));
fs.writeFileSync(path.join(outDir, 'tokens.css'), tokensCss(tokens.remix || tokens.original));
fs.writeFileSync(path.join(outDir, 'DESIGN.md'), buildMarkdown({ url, data, tokens, screenshots, remix: tokens.remix }));

console.log(`✅ Done → ${outDir}
   DESIGN.md        AI-ready design brief
   tokens.css       CSS variables${remix ? ' (remixed)' : ''}
   design-dna.json  raw data
   screenshots/     visual reference

Next, tell your AI tool: "Read ${path.relative(process.cwd(), path.join(outDir, 'DESIGN.md'))} and follow prompts/build-site.md"
`);
