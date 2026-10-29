# AICTE SmartComply AI — Cloud Production Deployment Guide

This guide provides a step-by-step, beginner-friendly walkthrough to deploy **AICTE SmartComply AI** to public HTTPS URLs accessible from any device or browser worldwide.

---

## 1. Deployment Architecture Overview

```mermaid
flowchart LR
    Browser["User Browser (Desktop / Mobile)"]
    Vercel["Frontend on Vercel CDN\n(React 18 + Vite SPA)"]
    Backend["Backend on Render / Railway / VPS\n(FastAPI + PyMuPDF + Uvicorn)"]
    DB[("Hosted PostgreSQL\nSupabase / Neon / Render")]
    Storage["Persistent File Storage\n(Disk Volume / S3)"]

    Browser -->|HTTPS Request| Vercel
    Vercel -->|REST API with Bearer Token| Backend
    Backend -->|SQLAlchemy Connection Pool| DB
    Backend -->|PDF / Image Storage| Storage
```

- **Frontend:** Hosted on **Vercel** (Global Edge CDN, automatic HTTPS, sub-second latency).
- **Backend:** Hosted on **Render** (or Railway/VPS) as a persistent Web Service running Python with C libraries (`fitz`/PyMuPDF).
- **Database:** Hosted on **Supabase** or **Neon** (Managed PostgreSQL with automated backups).

---

## 2. Prerequisites

1. A **GitHub** account with access to your repository:  
   `https://github.com/shrivastavamahi2005-lgtm/Aicte-smartcomply.git`
2. A free account on **[Supabase](https://supabase.com/)** or **[Neon](https://neon.tech/)** (for PostgreSQL).
3. A free account on **[Render](https://render.com/)** (for FastAPI backend).
4. A free account on **[Vercel](https://vercel.com/)** (for Vite React frontend).

---

## 3. Step 1: Deploy Cloud Database (Supabase or Neon)

### Option A: Using Supabase (Recommended)
1. Sign in to [Supabase](https://supabase.com/) and click **New project**.
2. Name your project (e.g. `aicte-smartcomply-db`) and generate a strong database password.
3. Choose a region close to your target audience (e.g., `Central India (Mumbai)` or `Singapore`).
4. Once created, go to **Project Settings** &rarr; **Database**.
5. Under **Connection string**, select the **URI** tab and choose **Mode: Transaction (Port 5432 or 6543)**.
6. Copy the connection string. It looks like:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
   *(Replace `[YOUR-PASSWORD]` with your actual password).*

### Option B: Using Neon (Serverless PostgreSQL)
1. Sign in to [Neon](https://neon.tech/) and click **Create Project**.
2. Name the project `aicte-smartcomply-db` and select the **Asia Pacific (Singapore)** or closest region.
3. In the project dashboard, copy the **Connection details &rarr; Connection string**.

---

## 4. Step 2: Deploy Backend to Render

1. Sign in to [Render](https://render.com/).
2. Click **New +** (top right) &rarr; **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub repo:
   `https://github.com/shrivastavamahi2005-lgtm/Aicte-smartcomply.git`
4. Configure the Web Service settings:
   - **Name:** `aicte-smartcomply-backend`
   - **Region:** Singapore (or Oregon / Frankfurt)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     sh -c "python seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
     ```
5. Scroll down to **Environment Variables** and click **Add Environment Variable** for each:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `PROJECT_NAME` | `AICTE SmartComply AI` | Brand name |
   | `DATABASE_URL` | *`postgresql://postgres:...`* | Your PostgreSQL URI from Step 1 |
   | `SECRET_KEY` | *(Generate a 32+ character random string)* | Used to sign JWT tokens |
   | `BACKEND_CORS_ORIGINS` | `*` | Allows requests from your frontend |
   | `AI_PROVIDER` | `mock` | `mock` for deterministic fallback, or `gemini` |
   | `AI_API_KEY` | *(Optional Gemini API key)* | Leave blank for offline rule mode |
   | `UPLOAD_DIR` | `./uploads` | Directory for evidence uploads |

6. Click **Create Web Service**.
7. Wait 2–3 minutes for the build to finish. Once live, Render displays your service URL:
   ```text
   https://aicte-smartcomply-backend.onrender.com
   ```
8. **Verify Backend Health:**  
   Open `https://aicte-smartcomply-backend.onrender.com/health` in your browser.  
   It should return:
   ```json
   {"status": "healthy"}
   ```

---

## 5. Step 3: Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Select your repository: `Aicte-smartcomply`.
4. In the **Configure Project** screen:
   - **Project Name:** `aicte-smartcomply-ai`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend` (or leave as root if using the root `vercel.json`).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://aicte-smartcomply-backend.onrender.com` |

   *(Use your actual Render backend URL from Step 2).*

6. Click **Deploy**.
7. Vercel will build the React SPA in ~45 seconds and issue a live HTTPS URL:
   ```text
   https://aicte-smartcomply-ai.vercel.app
   ```

---

## 6. Step 4: Final Verification & Demo Login

1. Open your live Vercel URL in your browser: `https://aicte-smartcomply-ai.vercel.app`
2. Test signing in with any of the 5 seeded SIH demo accounts:

   | Role | Email | Password |
   | :--- | :--- | :--- |
   | **College Administrator** | `admin@institution.edu` | `Admin@123` |
   | **Department Coordinator** | `faculty.cs@institution.edu` | `Faculty@123` |
   | **AICTE Reviewing Officer** | `officer@aicte.gov.in` | `Officer@123` |
   | **Senior Approving Authority** | `senior@aicte.gov.in` | `Senior@123` |
   | **Auditor** | `auditor@qualitycouncil.org` | `Auditor@123` |

3. You can also use the **1-Click Switch Persona** menu in the top bar to test different views instantly.

---

## 7. Production Troubleshooting & FAQ

### Q1: My Vercel frontend shows a 404 error when refreshing internal pages (`/compliance`, `/copilot`).
- **Fix:** Both `vercel.json` (at project root) and `frontend/vercel.json` contain single-page application (SPA) rewrite rules that route all traffic to `/index.html`. Ensure `vercel.json` is committed to GitHub.

### Q2: Browser console shows `CORS error: No 'Access-Control-Allow-Origin' header present`.
- **Fix:** On your Render backend dashboard under **Environment Variables**, verify `BACKEND_CORS_ORIGINS` is set to `*` or includes your exact Vercel URL (e.g. `https://aicte-smartcomply-ai.vercel.app`). Restart the Render service after changing.

### Q3: Render backend logs show `ValueError: invalid connection string: postgres://`.
- **Fix:** Supabase or Neon sometimes formats URLs with `postgres://`. The backend automatically converts `postgres://` to `postgresql://` to maintain compatibility with SQLAlchemy 2.0.

### Q4: PyMuPDF installation error on Linux / Docker.
- **Fix:** `backend/Dockerfile` and `backend/requirements.txt` already include all required C-library dependencies (`libpq-dev`, `build-essential`).
