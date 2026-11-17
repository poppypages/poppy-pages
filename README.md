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

## Editing the newer pages

Home, Services, About, Contact, Blog, Chat, Thank you and the 404 page are built from
`src/`. The header, footer, icons, pricing and closing call to action live in
`src/partials/`, so each is edited in one place.

1. Edit files in `src/pages/`, `src/partials/` or `src/script.js`.
2. Run `node tools/build.mjs`. It writes the finished pages and `script.js` into the repo root.
3. Commit both the `src/` change and the rebuilt files.

`styles.css` and the files in `js/` are edited directly.

The older pages (locations, service detail pages, case studies, comparisons, FAQ, the
`/audit` form and blog posts) keep their own HTML. The shared `styles.css` and `script.js`
give them the new look and swap in the new header and footer when they load.

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
- `src/`, `tools/` and this README are left out of the deployed site by `.vercelignore`.
- Plan prices and what each plan includes are in `src/partials/pricing.html`.

## License

MIT. See [LICENSE.md](LICENSE.md).
