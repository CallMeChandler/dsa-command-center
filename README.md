# DSA Command Center

A dark, responsive Next.js practice portal for Aakarsh's 27-pattern, 162-question DSA roadmap.

## Features

- Daily mission generated from unfinished questions
- Topic, status, title and LeetCode-number filtering
- Completion strike-through, overall progress and topic progress
- Daily goal, streak tracking and 12-week activity heatmap
- Completed-question archive with dates
- Per-question personal notes
- Mobile-first responsive design
- Offline localStorage fallback
- Cross-device JSON sync through the GitHub Contents API
- Twice-daily HTML reminder emails using Gmail and Vercel Cron
- All LeetCode names and direct links included in `data/topics.json`

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Cross-device JSON sync

Vercel serverless files are not durable. This project therefore uses `data/progress.json` as the source of truth and updates it through the GitHub Contents API.

1. Create the GitHub repository and push this project.
2. Create a fine-grained GitHub token with **Contents: Read and write** access only for this repository.
3. Add the token and repository values from `.env.example` to Vercel Environment Variables.
4. Redeploy.

The browser saves immediately to localStorage, then the API commits the updated JSON to GitHub. Other devices load the latest JSON from the same repository.

## Gmail reminders

Create a fresh Gmail App Password for `aakarshtechie@gmail.com`, then add these variables in Vercel:

```env
GMAIL_USER=aakarshtechie@gmail.com
GMAIL_APP_PASSWORD=your_new_app_password
GMAIL_TO=aakarsh0324@gmail.com
CRON_SECRET=your_long_random_secret
```

`vercel.json` schedules reminders at 09:00 and 20:00 IST using UTC cron expressions.

## Deploy

1. Push to GitHub.
2. Import the repository into Vercel.
3. Add all environment variables.
4. Deploy.

## Important security note

Never commit `.env.local`, Gmail App Passwords, GitHub tokens or `CRON_SECRET`. `.gitignore` already excludes environment files. If a credential has been shared in chat or anywhere public, revoke it and create a new one before deployment.
