# Commons API

Backend for the Commons community app: accounts, posts (ideas, blog posts, news), and replies. Node.js, Express, PostgreSQL, and Prisma.

## Run it locally

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the env template and fill it in:
   ```
   cp .env.example .env
   ```
3. Start a local Postgres database (or point `DATABASE_URL` at one you already have):
   ```
   docker compose up -d
   ```
4. Create the database tables:
   ```
   npm run prisma:migrate
   ```
5. Start the API:
   ```
   npm run dev
   ```
   It runs on `http://localhost:4000` by default. Check `http://localhost:4000/health`.

## Deploying

The API needs two things wherever you deploy it: a Postgres database and the app itself.

### Database: Supabase (easiest, free tier)
1. Create a project at supabase.com.
2. Go to Project Settings → Database → Connection string, and copy the "URI" value (use the pooled connection string for serverless hosts like Render/Railway's free tier).
3. Set that as `DATABASE_URL` wherever you deploy the app.

### App: Render or Railway
1. Push this folder to a GitHub repo.
2. Create a new Web Service (Render) or Project (Railway) from that repo.
3. Set the build command to `npm install && npx prisma generate` and the start command to `npm run prisma:deploy && npm start`.
4. Add environment variables from `.env.example` in the host's dashboard — `DATABASE_URL`, `JWT_SECRET` (generate a real one with `openssl rand -base64 32`), `CORS_ORIGIN` (your frontend's deployed URL), `PORT` (most hosts set this for you automatically).
5. Deploy. `npm run prisma:deploy` applies your migrations to the live database on every deploy.

## API reference

All request/response bodies are JSON. Authenticated routes need `Authorization: Bearer <token>`.

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `name, email, password` | Create an account, returns `{ token, user }` |
| POST | `/api/auth/login` | — | `email, password` | Returns `{ token, user }` |
| GET | `/api/auth/me` | required | — | Current user's profile |
| GET | `/api/posts` | — | query: `type`, `cursor`, `limit` | List posts, newest first, cursor-paginated |
| POST | `/api/posts` | required | `type, title?, tag?, body` | Create a post. `type` is `idea`, `blog`, or `news`; title is required for blog/news |
| GET | `/api/posts/:id` | — | — | One post with its replies |
| DELETE | `/api/posts/:id` | required (owner) | — | Delete your own post |
| GET | `/api/posts/:id/replies` | — | — | List replies on a post |
| POST | `/api/posts/:id/replies` | required | `body` | Add a reply |
| DELETE | `/api/posts/:id/replies/:replyId` | required (owner) | — | Delete your own reply |

## Connecting the frontend

From the Commons React artifact (or any frontend), call this API with `fetch`:

```js
const res = await fetch("https://your-api-url.com/api/posts?type=idea", {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
const { posts, nextCursor } = await res.json();
```

Store the `token` you get back from register/login (in memory or a secure cookie — avoid `localStorage` if the frontend runs inside an artifact, since browser storage isn't available there) and attach it to every authenticated request.

## Notes

- Passwords are hashed with bcrypt (12 rounds) — never stored in plain text.
- `express-rate-limit` throttles all traffic, with a tighter limit on `/api/auth` to slow down credential-stuffing attempts.
- Input is validated with `zod` on every write route.
- This sandbox's network allowlist blocked the Prisma engine download when generating this project, so `prisma generate` wasn't run here — it will work normally in your own environment, which has full internet access. All server code was syntax-checked and the dependency tree installs cleanly.
