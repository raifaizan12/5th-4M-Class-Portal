# 5th-4M Class Portal

A class-managed attendance and learning portal. The class representative can create the class roster, teachers, subjects, timetable entries and attendance sessions. The student portal displays each student's attendance and class information.

## What's included
- Empty-by-default student roster: add students individually or import a CSV.
- CR-managed teachers, subjects, attendance, timetable and class settings.
- Student login and personal attendance view.
- Attendance reports, CSV export, audit history and database backup tools.
- Responsive dark violet/lime visual theme.
- Footer credit: Rai Faizan Technology · All rights reserved.

## Run locally
1. Install Node.js (LTS) and PostgreSQL.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your own PostgreSQL connection string. Keep `.env` private; never commit it.
3. Install packages: `npm install`
4. Create/update tables: `npx prisma db push`
5. Generate Prisma client: `npx prisma generate`
6. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`, then run `npx prisma db seed`.
7. Start: `npm run dev`

The seed creates only the CR/admin account and class settings. It does not insert students, teachers or subjects. The CR adds those from the dashboard.

## Publish using your own GitHub repository
1. Create a new empty repository under your friend's GitHub account.
2. Extract this project, open its folder in a terminal, then run:
   - `git init`
   - `git add .`
   - `git commit -m "Set up 5th-4M class portal"`
   - `git branch -M main`
   - `git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git`
   - `git push -u origin main`
3. Import that repository into Vercel.
4. Add environment variables in Vercel: `DATABASE_URL` (their own hosted PostgreSQL URL), `NEXTAUTH_SECRET` (a long random secret), `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD`. Set `NEXTAUTH_URL` to the deployed URL if required by the auth setup.
5. Deploy. Ensure the production database schema is pushed and the admin seed has run before signing in.

## Important
- Use a separate database owned by your friend. This project does not contain or connect to your existing production database.
- Never upload `.env`, database passwords, or authentication secrets to GitHub.
- The class roster starts empty in a new database. Existing data in any database is not automatically copied or deleted.
