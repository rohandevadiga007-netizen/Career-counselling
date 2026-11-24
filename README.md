# CareerPath — Career Counselling Website

## Requirements
- Node.js 20 or later (LTS recommended)
- VS Code

## Run
1. Open this folder in VS Code.
2. Open Terminal > New Terminal.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000` in your browser.

The SQLite database `careerpath.db` is created automatically.

## Features
Responsive homepage, career search/filter, career details and roadmaps, 15-question interest quiz with scoring, sign up/login, saved careers, quiz history, contact form, dark mode.

## Quiz logic
Each of the five categories has three questions. Answers are scored 1–5, yielding 3–15 points per category. Categories are sorted by score. Recommendations are careers belonging to the top three categories. This is exploratory guidance, not a validated psychological test.

## Project architecture
Browser (HTML/CSS/JS) → Express API (Node.js) → SQLite database. Passwords are hashed with bcryptjs.

## Important deployment notes
This is a **local college demonstration**, not production-ready. For public deployment use a strong SESSION_SECRET environment variable, HTTPS, a persistent session store, CSRF protection, rate limiting, improved validation and security review. The default in-memory session store is not for production. Contact form submissions are stored locally; they are not emailed.
