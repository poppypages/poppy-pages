// Builds the site.
//
//   node tools/build.mjs          writes the finished pages into the repo root (what you commit)
//   node tools/build.mjs --dist   does the same, then copies the public files into public/
//                                 (Vercel runs this on every deploy, see vercel.json)
//
// What it does:
//   1. Stamps the shared partials (header, footer, icons, pricing, CTA...) into every page in
//      src/pages, including subfolders (services/, locations/, case-studies/, vs/).
//      <!--@meta {...}--> expands into the title, description, canonical and social tags.
//   2. Turns each Markdown post in content/blog into a real HTML page at /blog/<slug>, and writes
//      the post list straight into blog.html, so the blog reads fine without JavaScript
//      (AI crawlers such as GPTBot, ClaudeBot and PerplexityBot do not run JavaScript).
//   3. Writes sitemap.xml from every indexable page and post.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');
import { marked } from 'marked';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://www.poppypages.com';
const ORG = { '@type': 'ProfessionalService', '@id': SITE + '/#org', name: 'PoppyPages Marketing', url: SITE + '/' };

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (obj) => '    <script type="application/ld+json">\n' + JSON.stringify(obj, null, 2).replace(/</g, '\\u003c').replace(/^/gm, '    ') + '\n    </script>';

// ---------- partials ----------
const partials = {};
for (const f of readdirSync(join(root, 'src/partials'))) {
    if (f.endsWith('.html')) partials[f.replace(/\.html$/, '')] = readFileSync(join(root, 'src/partials', f), 'utf8').replace(/\n$/, '');
}

// <!--@meta {"title": "...", "description": "...", "path": "/services/web-design", "crumbs": [["Services","/services"],["Web design"]], "noindex": false}-->
function metaTags(m) {
    const url = SITE + (m.path === '/' ? '/' : m.path);
    const out = [
        `    <title>${esc(m.title)}</title>`,
        `    <meta name="description" content="${esc(m.description)}">`,
        `    <link rel="canonical" href="${url}">`,
        `    <meta name="theme-color" content="#1a0a25">`,
        `    <meta property="og:title" content="${esc(m.ogTitle || m.title)}">`,
        `    <meta property="og:description" content="${esc(m.description)}">`,
        `    <meta property="og:type" content="${m.ogType || 'website'}">`,
        `    <meta property="og:url" content="${url}">`,
        `    <meta property="og:image" content="${esc(m.image || SITE + '/assets/og-image.png')}">`,
        `    <meta property="og:site_name" content="PoppyPages Marketing">`,
        `    <meta name="twitter:card" content="summary_large_image">`,
    ];
    if (m.noindex) out.push('    <meta name="robots" content="noindex">');
    if (m.crumbs) {
        const items = [['Home', '/'], ...m.crumbs].map(([name, p], i, all) => ({
            '@type': 'ListItem', position: i + 1, name, item: SITE + (p || m.path)
        }));
        out.push(ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items }));
    }
    return out.join('\n');
}

function stamp(html, file, extra = {}) {
    let meta = null;
    html = html.replace(/<!--@meta\s+([\s\S]*?)-->/, (m, json) => {
        meta = JSON.parse(json);
        return metaTags(meta);
    });
    html = html.replace(/<!--@([a-z-]+)-->/g, (m, name) => {
        if (name in extra) return extra[name];
        if (!(name in partials)) throw new Error(`Unknown partial ${name} in ${file}`);
        return partials[name];
    });
    return { html, meta };
}

// ---------- pages ----------
const pages = []; // { path, updated, noindex }
function walk(dir) {
    const out = [];
    for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (f.endsWith('.html')) out.push(p);
    }
    return out;
}

function pagePath(rel) {
    const clean = '/' + rel.replace(/\.html$/, '').replace(/(^|\/)index$/, '');
    return clean === '/' ? '/' : clean.replace(/\/$/, '');
}

// ---------- blog ----------
function niceDate(d) {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
}
const isoDay = (d) => d.toISOString().slice(0, 10);
const assetUrl = (src) => (!src ? '' : /^(https?:)?\/\//.test(src) || src.startsWith('/') ? src : '/' + src);
const absUrl = (src) => (!src ? '' : /^https?:/.test(src) ? src : SITE + assetUrl(src));

function loadPosts() {
    const dir = join(root, 'content/blog');
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
            const slug = f.replace(/\.md$/, '');
            if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`Blog file name must be lowercase letters, numbers and dashes: ${f}`);
            const { data, content } = matter(readFileSync(join(dir, f), 'utf8'));
            const date = new Date(data.date || slug.slice(0, 10));
            const updated = data.updated ? new Date(data.updated) : date;
            let body = marked.parse(content);
            // images and links saved by the CMS are relative to the site root
            body = body.replace(/(src|href)="(assets\/[^"]+)"/g, '$1="/$2"');
            const author = !data.author || /^poppypages$/i.test(String(data.author).trim()) ? 'PoppyPages Team' : String(data.author);
            return {
                slug, title: String(data.title || slug), description: String(data.description || '').replace(/\s+/g, ' ').trim(),
                date, updated, author, thumbnail: data.thumbnail ? String(data.thumbnail) : '',
                schemaType: ['BlogPosting', 'Article', 'NewsArticle'].includes(data.schema_type) ? data.schema_type : 'BlogPosting',
                body, words: content.split(/\s+/).filter(Boolean).length
            };
        })
        .sort((a, b) => b.date - a.date);
}

function postCard(p, lead) {
    const img = p.thumbnail
        ? `<div class="thumb"><img src="${esc(assetUrl(p.thumbnail))}" alt="" loading="${lead ? 'eager' : 'lazy'}" decoding="async"></div>`
        : '<div class="thumb is-empty"></div>';
    return `                    <a class="post-card${lead ? ' is-lead' : ''}" href="/blog/${p.slug}">
                        ${img}
                        <div class="body">
                            <time datetime="${isoDay(p.date)}">${niceDate(p.date)}</time>
                            <h2>${esc(p.title)}</h2>
                            ${p.description ? `<p>${esc(p.description)}</p>` : ''}
                            <span class="text-link">Read the post</span>
                        </div>
                    </a>`;
}

function postPage(tpl, p, posts) {
    const url = `${SITE}/blog/${p.slug}`;
    const others = posts.filter((o) => o.slug !== p.slug).slice(0, 3);
    const article = {
        '@context': 'https://schema.org',
        '@type': p.schemaType,
        headline: p.title,
        description: p.description || undefined,
        image: p.thumbnail ? absUrl(p.thumbnail) : SITE + '/assets/og-image.png',
        datePublished: p.date.toISOString(),
        dateModified: p.updated.toISOString(),
        author: { '@type': 'Organization', name: p.author, url: SITE + '/about' },
        publisher: { ...ORG, logo: { '@type': 'ImageObject', url: SITE + '/assets/poppy-mark.png' } },
        mainEntityOfPage: url,
        wordCount: p.words,
        inLanguage: 'en-US'
    };
    const meta = {
        title: `${p.title} | PoppyPages Marketing`, ogTitle: p.title, description: p.description || p.title,
        path: `/blog/${p.slug}`, ogType: 'article', image: p.thumbnail ? absUrl(p.thumbnail) : '',
        crumbs: [['Blog', '/blog'], [p.title]]
    };
    const updatedLine = isoDay(p.updated) !== isoDay(p.date)
        ? ` · Updated <time datetime="${isoDay(p.updated)}">${niceDate(p.updated)}</time>` : '';
    const more = others.length ? `
        <section class="section-tight" aria-labelledby="more-title">
            <div class="wrap">
                <div class="section-head"><p class="label">Keep reading</p><h2 id="more-title">More from the blog</h2></div>
                <div class="posts">
${others.map((o) => postCard(o, false)).join('\n')}
                </div>
            </div>
        </section>` : '';
    let html = tpl.replace('<!--@meta-->', '<!--@meta ' + JSON.stringify(meta) + '-->');
    const { html: out } = stamp(html, 'post template', {
        'post-ld': ld(article),
        'post-title': esc(p.title),
        'post-byline': `By ${esc(p.author)} · Published <time datetime="${isoDay(p.date)}">${niceDate(p.date)}</time>${updatedLine}`,
        'post-image': p.thumbnail ? `<img class="post-hero-img" src="${esc(assetUrl(p.thumbnail))}" alt="${esc(p.title)}" width="1200" height="630" decoding="async">` : '',
        'post-body': p.body,
        'post-more': more
    });
    return out;
}

// ---------- run ----------
const posts = loadPosts();

// pages from src/pages
const srcPages = join(root, 'src/pages');
for (const file of walk(srcPages)) {
    const rel = relative(srcPages, file);
    let src = readFileSync(file, 'utf8');
    let updated = null;
    src = src.replace(/<!--@updated (\d{4}-\d{2}-\d{2})-->\n?/, (m, d) => { updated = d; return ''; });
    const extra = {};
    if (rel === 'blog.html') {
        extra.posts = posts.length
            ? posts.map((p, i) => postCard(p, i === 0)).join('\n')
            : '                    <div class="post-empty"><h2>New posts are on the way.</h2><p>Check back soon, or start with a free audit below.</p></div>';
        extra['blog-ld'] = ld({
            '@context': 'https://schema.org', '@type': 'Blog', name: 'The PoppyPages Marketing blog', url: SITE + '/blog', publisher: ORG,
            blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.date.toISOString() }))
        });
        if (posts.length) updated = isoDay(posts.reduce((a, p) => (p.updated > a ? p.updated : a), new Date(updated || 0)));
    }
    const { html, meta } = stamp(src, rel, extra);
    const outFile = join(root, rel);
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, html);
    const noindex = /<meta name="robots" content="noindex/.test(html);
    if (!noindex && updated) pages.push({ path: meta?.path || pagePath(rel), updated });
    console.log('built', rel);
}

// blog posts
const tpl = readFileSync(join(root, 'src/templates/post.html'), 'utf8');
rmSync(join(root, 'blog'), { recursive: true, force: true });
mkdirSync(join(root, 'blog'), { recursive: true });
for (const p of posts) {
    writeFileSync(join(root, 'blog', p.slug + '.html'), postPage(tpl, p, posts));
    pages.push({ path: `/blog/${p.slug}`, updated: isoDay(p.updated) });
}
console.log('built', posts.length, 'blog posts');

// older pages that are not built from src yet
const legacy = JSON.parse(readFileSync(join(root, 'src/legacy-pages.json'), 'utf8'));
for (const [path, updated] of Object.entries(legacy)) pages.push({ path, updated });

// sitemap
pages.sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
const seen = new Set();
const urls = pages.filter((p) => !seen.has(p.path) && seen.add(p.path)).map((p) =>
    `    <url>\n        <loc>${SITE}${p.path === '/' ? '/' : p.path}</loc>\n        <lastmod>${p.updated}</lastmod>\n    </url>`);
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log('built sitemap.xml with', urls.length, 'pages');

// script.js carries the header and footer too, so the older pages can be given the same chrome at runtime.
let js = readFileSync(join(root, 'src/script.js'), 'utf8');
js = js
    .replace('"__HEADER__"', JSON.stringify(partials.header))
    .replace('"__FOOTER__"', JSON.stringify(partials.footer))
    .replace('"__SPRITE__"', JSON.stringify(partials.sprite));
writeFileSync(join(root, 'script.js'), js);
console.log('built script.js');

// public/ for Vercel: everything a visitor may load, nothing else
if (process.argv.includes('--dist')) {
    const out = join(root, 'public');
    const skip = new Set(['public', 'src', 'tools', 'api', 'content', 'node_modules', '.git', '.github', '.vercel',
        'package.json', 'package-lock.json', 'vercel.json', 'README.md', 'LICENSE.md', 'google_sheets_script.gs',
        '.gitignore', '.vercelignore', '.env', '.env.local', '.DS_Store']);
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out);
    for (const f of readdirSync(root)) {
        if (skip.has(f) || f.startsWith('.env')) continue;
        cpSync(join(root, f), join(out, f), { recursive: true });
    }
    console.log('copied the public site into public/');
}
