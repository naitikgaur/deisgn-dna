import { chromium } from 'playwright';

/** Runs inside the browser. Collects ONLY style/structure data, never page copy or assets. */
function collect() {
  const bump = (map, key, n = 1) => key && map.set(key, (map.get(key) || 0) + n);
  const top = (map, n = 20) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  const visible = (el, cs) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const clear = (c) => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent';

  const textColors = new Map(), bgColors = new Map(), borderColors = new Map();
  const fontFamilies = new Map(), fontSizes = new Map(), fontWeights = new Map(), lineHeights = new Map();
  const spacing = new Map(), radii = new Map(), shadows = new Map(), widths = new Map();
  const gradients = new Map();

  const els = [...document.querySelectorAll('body *')].slice(0, 4000);
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (!visible(el, cs)) continue;
    const rect = el.getBoundingClientRect();
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      bump(textColors, cs.color);
      bump(fontFamilies, cs.fontFamily);
      bump(fontSizes, cs.fontSize);
      bump(fontWeights, cs.fontWeight);
      bump(lineHeights, cs.lineHeight);
    }
    if (clear(cs.backgroundColor)) bump(bgColors, cs.backgroundColor, Math.max(1, Math.round((rect.width * rect.height) / 20000)));
    if (parseFloat(cs.borderTopWidth) > 0 && clear(cs.borderTopColor)) bump(borderColors, cs.borderTopColor);
    if (cs.backgroundImage.includes('gradient')) bump(gradients, cs.backgroundImage.slice(0, 200));
    for (const p of ['paddingTop', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap']) {
      const v = parseFloat(cs[p]);
      if (v > 0 && v < 400) bump(spacing, Math.round(v));
    }
    const rad = cs.borderTopLeftRadius;
    if (rad && rad !== '0px') bump(radii, rad);
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow);
    const mw = cs.maxWidth;
    if (mw && mw !== 'none' && mw.endsWith('px')) bump(widths, mw);
  }

  const typeSample = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, color: cs.color,
      textTransform: cs.textTransform,
    };
  };
  const typography = {};
  for (const s of ['h1', 'h2', 'h3', 'h4', 'p', 'a', 'button', 'nav a', 'small']) typography[s] = typeSample(s);

  const btnSeen = new Set(), buttons = [];
  for (const el of document.querySelectorAll('button, a[class*="btn" i], a[class*="button" i], [role="button"]')) {
    const cs = getComputedStyle(el);
    if (!visible(el, cs)) continue;
    const sig = [cs.backgroundColor, cs.color, cs.borderTopLeftRadius, cs.padding].join('|');
    if (btnSeen.has(sig)) continue;
    btnSeen.add(sig);
    buttons.push({
      background: cs.backgroundColor, color: cs.color, radius: cs.borderTopLeftRadius,
      padding: cs.padding, border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      fontSize: cs.fontSize, fontWeight: cs.fontWeight, shadow: cs.boxShadow,
      textTransform: cs.textTransform, letterSpacing: cs.letterSpacing,
    });
    if (buttons.length >= 5) break;
  }

  const cssVars = {};
  const breakpoints = new Set();
  let hasDark = false;
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules || []) {
      if (rule.selectorText === ':root' || rule.selectorText === 'html') {
        for (const name of rule.style) if (name.startsWith('--') && Object.keys(cssVars).length < 80) cssVars[name] = rule.style.getPropertyValue(name).trim();
      }
      if (rule.type === CSSRule.MEDIA_RULE) {
        if (rule.conditionText.includes('prefers-color-scheme: dark')) hasDark = true;
        const m = rule.conditionText.match(/(?:min|max)-width:\s*(\d+)px/g) || [];
        m.forEach((x) => breakpoints.add(parseInt(x.match(/(\d+)/)[1], 10)));
      }
    }
  }

  const count = (root, sel) => root.querySelectorAll(sel).length;
  const roots = [];
  const header = document.querySelector('header, [role="banner"]');
  if (header) roots.push(header);
  const main = document.querySelector('main') || document.body;
  roots.push(...[...main.children].filter((c) => c.getBoundingClientRect().height > 40 && c !== header).slice(0, 14));
  const footer = document.querySelector('footer');
  if (footer) roots.push(footer);

  const layout = roots.map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const inner = [...el.querySelectorAll('*')].find((c) => {
      const d = getComputedStyle(c).display;
      return d === 'grid' || d === 'flex';
    });
    const ics = inner ? getComputedStyle(inner) : null;
    return {
      tag: el.tagName.toLowerCase(),
      height: Math.round(r.height),
      background: clear(cs.backgroundColor) ? cs.backgroundColor : (cs.backgroundImage !== 'none' ? 'image/gradient' : 'transparent'),
      paddingY: `${cs.paddingTop} / ${cs.paddingBottom}`,
      innerLayout: ics ? { display: ics.display, direction: ics.flexDirection, columns: ics.gridTemplateColumns !== 'none' ? ics.gridTemplateColumns.split(' ').length : null, gap: ics.gap } : null,
      counts: { headings: count(el, 'h1,h2,h3,h4'), paragraphs: count(el, 'p'), images: count(el, 'img,picture,svg,video'), buttons: count(el, 'button,[role=button],a[class*=btn i]'), links: count(el, 'a'), cards: count(el, '[class*=card i]') },
    };
  });

  return {
    colors: { text: top(textColors), background: top(bgColors), border: top(borderColors), gradients: top(gradients, 6) },
    fonts: { families: top(fontFamilies, 6), sizes: top(fontSizes, 14), weights: top(fontWeights, 6), lineHeights: top(lineHeights, 6) },
    spacing: top(spacing, 16), radii: top(radii, 8), shadows: top(shadows, 6), containerWidths: top(widths, 5),
    typography, buttons, cssVars, breakpoints: [...breakpoints].sort((a, b) => a - b), layout,
    meta: { hasDarkModeQuery: hasDark },
  };
}

export async function extract(url, { screenshotDir, mobile = true } = {}) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    await page.waitForTimeout(1500);
    const data = await page.evaluate(collect);
    const shots = [];
    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/desktop-fold.png` });
      await page.screenshot({ path: `${screenshotDir}/desktop-full.png`, fullPage: true });
      shots.push('desktop-fold.png', 'desktop-full.png');
      if (mobile) {
        const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
        const mp = await m.newPage();
        await mp.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await mp.waitForTimeout(1500);
        await mp.screenshot({ path: `${screenshotDir}/mobile-full.png`, fullPage: true });
        shots.push('mobile-full.png');
      }
    }
    return { url, data, screenshots: shots };
  } finally {
    await browser.close();
  }
}
