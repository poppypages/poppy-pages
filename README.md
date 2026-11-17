# PoppyPages Marketing website

The site at poppypages.com. Plain HTML, CSS and JavaScript, hosted on Vercel. No framework.

## How the site is put together

- The pages in the repo root are what Vercel serves. `vercel.json` turns on clean URLs
  (`/services` instead of `/services.html`) and holds two short links (`/free-pack`, `/thank-u`).
- `styles.css` and `script.js` are shared by every page. `js/home.js` runs the homepage
  animations, `js/blog.js` fills the blog list and `js/chat.js` runs the audit chat.
- `fonts/` and `js/vendor/` hold the fonts and the GSAP animation library, so the site
  does not depend on outside servers to look right.
- `api/` holds the blog routes. `content/blog/` and `admin/` are the blog posts and the
  Decap CMS editor.

## Editing pages

Every page except the old `/audit` form is built from `src/`: home, services and the four
service pages, the four area pages, about, contact, FAQ, case studies, the two comparison
pages, blog, chat, thank you and 404. The header, footer, icons, pricing and closing call to
action live in `src/partials/`, so each is edited in one place. `<!--@meta {...}-->` at the
top of a page fills in its title, description, canonical link and social tags, and
`<!--@updated YYYY-MM-DD-->` sets its date in the sitemap.

1. Edit files in `src/pages/`, `src/partials/`, `src/templates/post.html` or `src/script.js`.
2. Run `node tools/build.mjs`. It writes the finished pages, the blog pages, `sitemap.xml`
   and `script.js` into the repo root.
3. Commit both the `src/` change and the rebuilt files.

`styles.css` and the files in `js/` are edited directly.

## The blog

Posts are Markdown files in `content/blog/`, written in the Decap CMS editor at `/admin`.
The build turns each one into a real page at `/blog/<file name>` and writes the post list
into `blog.html`, so the blog reads fine without JavaScript (AI crawlers do not run it).
Old `/post?slug=...` links redirect to the new addresses.

Vercel runs the same build on every deploy (`npm run build`, see `vercel.json`) and serves
the `public/` folder it creates. So a post saved in the CMS gets its page and sitemap entry
on the next deploy without anyone running the build by hand.

## Security settings

`vercel.json` sets the security headers (HSTS, Content-Security-Policy, X-Frame-Options,
nosniff, Referrer-Policy, Permissions-Policy). If you add a new outside script, embed or
form target, add its domain to the Content-Security-Policy or the browser will block it.
The CMS loads a pinned Decap version with an integrity hash; to upgrade it, change the
version and the hash together. `robots.txt` welcomes search and AI crawlers by name.

## Running it locally

```
npm install
node tools/serve.mjs
```

Then open http://localhost:4173. The local server follows the same URL rules as Vercel
and runs the blog routes.

## Things to keep in mind

- The lead forms post to Google Apps Script. A test entry on any copy of the site lands
  in the real lead sheets.
- Only the `public/` folder made by the build is served, so `src/`, `tools/`, `content/`
  and this README are never public.
- Plan prices and what each plan includes are in `src/partials/pricing.html`.

## License

MIT. See [LICENSE.md](LICENSE.md).
