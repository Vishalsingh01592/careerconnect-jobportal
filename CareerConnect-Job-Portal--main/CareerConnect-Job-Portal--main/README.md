# CareerConnect

A job board built with **Next.js 16 (App Router)**, **Prisma 6** and **PostgreSQL**.
Candidates can browse and apply for jobs; recruiters can manage a company
profile, publish jobs, and review applications.

---

## 1. Requirements

- Node.js 20 or newer
- A PostgreSQL database (local or hosted, e.g. Neon / Supabase / Railway)

## 2. Setup

```bash
# 1) install dependencies (also runs `prisma generate`)
npm install

# 2) create your environment file
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
```

Open `.env` and fill in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Long random string used to sign cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SEED_RECRUITER_EMAIL` | Optional. Email of the recruiter the seed script should use. |

```bash
# 3) create the database schema
npm run db:migrate        # or: npm run db:push

# 4) start the dev server
npm run dev
```

The app is now available at <http://localhost:3000>.

## 3. First run

1. Open <http://localhost:3000/register> and create an account.
   - Choose **Recruiter** to publish jobs.
2. A recruiter must create a **company profile** before posting jobs:
   <http://localhost:3000/recruiter/company>.
3. Optional sample data (company + 6 jobs):

   ```bash
   npm run db:seed
   ```

   The seed uses `SEED_RECRUITER_EMAIL` when set, otherwise the first recruiter
   account in the database.

## 4. Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate the Prisma client (also runs on `npm install`) |
| `npm run db:migrate` | Create/apply migrations in development |
| `npm run db:deploy` | Apply existing migrations in production |
| `npm run db:push` | Push the schema without creating a migration |
| `npm run db:seed` | Insert the sample company and jobs |
| `npm run db:studio` | Open Prisma Studio |

## 5. Routes

| Path | Who | What |
| --- | --- | --- |
| `/` | everyone | Landing page with the latest jobs |
| `/jobs` | everyone | Search / filter jobs, apply (candidates) |
| `/login`, `/register` | guests | Authentication |
| `/my-applications` | candidates | Track and withdraw applications |
| `/recruiter/company` | recruiters | Create / edit the company profile |
| `/recruiter/jobs` | recruiters | Post jobs, open/close postings |
| `/recruiter/applications` | recruiters | Review applicants, update status |

## 6. API

All routes return JSON. Authentication uses an `httpOnly` JWT cookie
(`careerconnect_session`).

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/register` | public |
| `POST` | `/api/login` | public |
| `POST` | `/api/logout` | public |
| `GET` | `/api/me` | logged in |
| `GET` | `/api/jobs?search=&location=&type=&page=&pageSize=` | public |
| `POST` | `/api/applications` | candidate |
| `GET` | `/api/applications/my` | candidate |
| `DELETE` | `/api/applications/:id` | candidate (owner) |
| `GET` / `PUT` | `/api/recruiter/company` | recruiter |
| `GET` / `POST` | `/api/recruiter/jobs` | recruiter |
| `PATCH` | `/api/recruiter/jobs/:id` | recruiter (owner) |
| `GET` | `/api/recruiter/applications` | recruiter |
| `PATCH` | `/api/recruiter/applications/:id` | recruiter (owner) |

## 7. Notes

- `middleware` is intentionally not used; page-level protection lives in
  `src/app/recruiter/layout.js` and `src/app/my-applications/layout.js`, which
  verify the cookie on the server before rendering.
- Login and registration are rate limited in memory (`src/lib/rate-limit.js`).
  Replace it with a shared store before scaling horizontally.
- Sessions last 7 days and can be revoked by logging out (the cookie is cleared).
