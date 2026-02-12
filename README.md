# ForRentAll

A simple property/tenant management app with separate `backend` (Express + Mongoose) and `frontend` (React + Vite).

This README contains steps to install, run, and prepare the project for publishing to GitHub.

--

## Prerequisites

- Node.js v18+ and npm (or Yarn)
- Internet access for installing packages
- A MongoDB instance (MongoDB Atlas recommended) or local MongoDB

## Security note (IMPORTANT)

This repository currently contains hard-coded MongoDB credentials and a hard-coded JWT secret inside backend files. DO NOT publish these credentials publicly. Before pushing to a public GitHub repo:

- Remove or replace hard-coded credentials in `backend/config/db.js`.
- Replace hard-coded `JWT_SECRET` strings in backend route/middleware files with an environment variable (see `.env` below).
- Add a `.env` file to `backend/` and add `.env` and `node_modules/` to `.gitignore`.

## Quick setup (development)

1. Clone the repository

```bash
git clone <your-repo-url>
cd "Tenant Mgmt"
```

2. Backend

```bash
cd backend
npm install

# create a .env file in backend/ with at least:
# MONGODB_URI=your_mongodb_connection_string
# PORT=5000
# JWT_SECRET=a_strong_secret

# start backend in dev mode (uses nodemon)
npm run dev
```

The backend listens on port `5000` by default (see `server.js`).

3. Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`). The frontend is configured to use the backend API at `http://localhost:5000` (see `frontend/src/api.js`).

Open the site in the browser and use the app.

## Production build and serving

Frontend:

```bash
cd frontend
npm run build
# the built files will be in frontend/dist
```

You can host `frontend/dist` on any static host (Netlify, Vercel, S3, etc.).

Backend (serve API):

1. Ensure `MONGODB_URI` and `JWT_SECRET` are set in environment variables or a secure `.env` mechanism.
2. Start the backend in production mode:

```bash
cd backend
node server.js
```

Optional: serve built frontend from the backend by adding static middleware to `server.js` pointing to the `frontend/dist` folder.

## Environment variables example (`backend/.env`)

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/Tenant_Mgmt
PORT=5000
JWT_SECRET=replace_with_secure_value
```

## GitHub / Git steps (uploading)

From the repository root:

```bash
git init
git add .
git commit -m "Initial commit"
# create repo on GitHub (via website or `gh repo create`) then:
git remote add origin https://github.com/<your-username>/<repo>.git
git branch -M main
git push -u origin main
```

Before pushing, ensure `.gitignore` includes:

```
node_modules/
backend/.env
frontend/.env
uploads/
```

## Notes & next steps

- Replace any hard-coded secrets before publishing. The current code contains DB credentials and a `supersecretkey` JWT secret in several backend files — rotate these immediately.
- Consider moving sensitive values into `process.env` and loading them with `dotenv`.
- Add a `.env.example` file listing required env vars (without values) so contributors know what's needed.

