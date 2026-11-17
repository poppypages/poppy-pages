// Stamps the shared header, footer, icon sprite and head tags into every page.
// Usage: node tools/build.mjs   (reads src/, writes the pages and script.js into the repo root)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const part = (n) => readFileSync(join(root, 'src/partials', n), 'utf8').replace(/\n$/, '');
const partials = {};
for (const f of readdirSync(join(root, 'src/partials'))) {
    if (f.endsWith('.html')) partials[f.replace(/\.html$/, '')] = part(f);
}

for (const file of readdirSync(join(root, 'src/pages'))) {
    if (!file.endsWith('.html')) continue;
    let html = readFileSync(join(root, 'src/pages', file), 'utf8');
    html = html.replace(/<!--@([a-z-]+)-->/g, (m, name) => {
        if (!(name in partials)) throw new Error(`Unknown partial ${name} in ${file}`);
        return partials[name];
    });
    writeFileSync(join(root, file), html);
    console.log('built', file);
}

// script.js carries the header and footer too, so the older pages
// (locations, guides, blog posts) can be given the same chrome at runtime.
let js = readFileSync(join(root, 'src/script.js'), 'utf8');
js = js
    .replace('"__HEADER__"', JSON.stringify(partials.header))
    .replace('"__FOOTER__"', JSON.stringify(partials.footer))
    .replace('"__SPRITE__"', JSON.stringify(partials.sprite));
writeFileSync(join(root, 'script.js'), js);
console.log('built script.js');
