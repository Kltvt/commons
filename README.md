# Commons

A shared feed for ideas, blog posts, and local news.

- **`index.html`** — the site itself. Static HTML/CSS/JS, no build step. Talks to the backend API over `fetch`.
- **`backend/`** — the API: accounts, posts, replies. Node.js, Express, PostgreSQL via Prisma. See `backend/README.md` to run or deploy it.

## Running it locally

1. Start the backend (see `backend/README.md`) — it runs on `http://localhost:4000` by default.
2. Open `index.html` directly in a browser, or serve it:
   ```
   npx serve .
   ```
   `index.html` points at `http://localhost:4000` automatically.

## Pointing the site at a deployed backend

Once your backend is deployed (Render, Railway, etc.), set its URL before `index.html` loads its script — either edit the `API_BASE` line near the top of the `<script>` tag, or add this just before it:

```html
<script>window.COMMONS_API_BASE = "https://your-api-url.com";</script>
```

## Deploying the site

`index.html` is a static file, so any static host works — GitHub Pages, Netlify, Vercel, or Cloudflare Pages. For GitHub Pages on this repo: Settings → Pages → Deploy from branch → `main` → `/ (root)`.
