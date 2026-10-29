# AICTE SmartComply 360
### Integrated AICTE Approval Workflow Automation, Compliance Monitoring & Alert Management System
**Predict, Trace & Resolve**

> **Smart India Hackathon (SIH) Prototype Submission**  
> **Problem Statement:** Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.  
> **Explicit Scope Boundary:** This system focuses squarely on regulatory workflow automation, AI-assisted document intelligence, cross-document verification, rule validation, dependency graphing, and human-in-the-loop governance. In compliance with directives, the "AICTE Compliance Digital Twin / Virtual Compliance Simulator" (3D virtual campuses or infrastructure what-if simulations) is deliberately excluded.

---

## 1. Executive Summary & Architecture

**AICTE SmartComply 360** transforms the traditional, document-heavy technical education regulatory approval lifecycle into an automated, explainable, transparent digital cockpit. Built on an enterprise SaaS paradigm, the platform features multi-role role-based access control (RBAC), PDF/image extraction pipelines with SHA-256 integrity tracking, a versioned compliance rule engine adhering to the official AICTE Approval Process Handbook (APH 2024-27), cross-document inconsistency detection, an interactive dependency graph, an explainable deadline risk engine, dynamic dark/light/system theme switching, multilingual i18n support across 7 Indian national languages, and an AI regulatory copilot with offline deterministic fallback.

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (React 18 + Vite + TS + Tailwind)"]
        UI["Enterprise SaaS Cockpit (Lucide, Recharts, React Flow)"]
        RoleSwitcher["1-Click SIH Persona Switcher"]
        I18n["7-Language Multilingual Engine (i18next)"]
        Theme["Theme Context (Light / Dark / System)"]
    end

    subgraph APILayer ["API & Business Engine (FastAPI + Pydantic v2)"]
        Router["RESTful API Endpoints (/api/v1)"]
        AuthEng["RBAC Guard & JWT Security (PBKDF2-HMAC-SHA256)"]
        DocEng["Document Intelligence Pipeline (PyMuPDF, Hashes, Heuristics)"]
        MismatchEng["Cross-Document Inconsistency Detector"]
        RuleEng["Compliance Rule Engine (AICTE APH 2024-27 Norms)"]
        GraphEng["Dependency & Root-Cause Graph Service"]
        WorkflowEng["State Machine & Remediation Task Dispatcher"]
        RadarEng["Rule Change Radar (Regulatory Diff Analyzer)"]
        CopilotEng["AI Compliance Copilot (RAG + Deterministic Expert System)"]
        AlertEng["Alert Management & Multi-Factor SLA Risk Engine"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        DB[("SQLite Local / PostgreSQL Hosted via SQLAlchemy ORM")]
        Files["Controlled Physical Document Vault (uploads/)"]
    end

    UI -->|JWT Bearer Authentication| Router
    Router --> AuthEng
    Router --> DocEng
    Router --> MismatchEng
    Router --> RuleEng
    Router --> GraphEng
    Router --> WorkflowEng
    Router --> RadarEng
    Router --> CopilotEng
    Router --> AlertEng

    DocEng --> Files
    Router --> DB
```

---

## 2. Core Functional Modules

| Module | Purpose & Capabilities | Human-in-the-Loop & Trust Boundary |
| :--- | :--- | :--- |
| **1. Authentication & RBAC** | Strict role-based access across 5 distinct regulatory personas. JWT tokens and salted PBKDF2 hashing. | Endpoints protected by server-side role validators, not mere frontend button hiding. |
| **2. Application Lifecycle** | Full state-machine transitions: Draft &rarr; Submitted &rarr; Doc Validation &rarr; Compliance Review &rarr; Officer Review &rarr; Recommended &rarr; Approved/Rejected. | **AI NEVER approves or rejects.** Approval and rejection decisions are strictly reserved for authorized human authorities. |
| **3. AI Document Intelligence** | PyMuPDF text parsing, SHA-256 integrity tracking, heuristic metadata extraction (Fire NOC validity, Land acreage, Principal Ph.D. degree). | Displays explicit disclaimer *"Authenticity not independently verified"* without external registry. Manual reviewer override enabled. |
| **4. Cross-Document Inconsistency Detector** | Scans extracted fields across multiple uploads (e.g. Land Title vs Building Plan vs Application, Faculty list vs Degree Certs, expired NOCs). | Flags findings as *"Potential Inconsistency"* or *"Manual Verification Required"* (strictly avoids premature fraud allegations). |
| **5. Compliance Rule Engine** | Validates technical institutions against official AICTE APH 2024-27 norms (SFR 1:20, Cadre 1:2:6, Principal Ph.D., Land norms, SGRC). | Explicitly separates official verified rules from mock demonstration rules. Computes transparent readiness score. |
| **6. Compliance Graph & Root Cause** | Interactive React Flow visualizer linking Institution &rarr; Courses &rarr; Documents &rarr; Rules &rarr; Findings &rarr; Tasks. | Interactive dependency tracking with tabular accessibility fallback. Dynamic light/dark styling. |
| **7. Workflow & Remediation Tasks** | Converts non-compliant findings into actionable department tasks with SLA deadlines and collaborative audit comment threads. | Uploading replacement evidence does not auto-resolve findings; re-evaluation and human sign-off required. |
| **8. Alert & Deadline Risk Engine** | In-app notification center, read/acknowledged tracking, explainable multi-factor SLA risk calculator (Low, Medium, High). | Clearly labeled heuristic model; never promises certainty. |
| **9. Rule Change Radar** | Regulatory source registry, unified diff engine comparing APH handbook editions, impact analysis mapping affected rules and active applications. | Requires human officer verification before ratifying amendments into active rule catalog. |
| **10. AI Compliance Copilot** | Conversational assistant with RAG over approved rules and application records. Cites handbook clauses and page numbers. | Deterministic rule-based and FAQ fallback when no external LLM API key is present. |
| **11. Multilingual Support (i18n)** | Real-time interface translation across 7 Indian national languages: English, Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu (`react-i18next`). | Instant switching without page reload; preference persisted in `localStorage`. |
| **12. Theme Switching** | Light, Dark, and System Default themes across all pages, charts, tables, and modals. | Instant reactive class toggle; persisted in `localStorage`. |
| **13. Reports & Analytics** | Real-time Recharts dashboards, application stage metrics, CSV export, and printable compliance summary dossier. | All charts and KPIs derive strictly from real database records. |
| **14. Immutable Audit Trail** | Append-only event log capturing actor, action, timestamp, entity diffs, and correlation IDs. | Read-only for standard users; cannot be modified via UI. |

---

## 3. Seeded Demonstration Accounts (5 Regulatory Personas)

For Smart India Hackathon jury review, 5 pre-configured demonstration accounts are provided. The UI also features a **"1-Click Switch Role"** button in the top navigation, login screen, and Settings page.

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **College Administrator** | `admin@institution.edu` | `Admin@123` | Create applications, upload institutional documents, view findings, assign internal corrective tasks, submit applications. |
| **Department Coordinator** | `faculty.cs@institution.edu` | `Faculty@123` | Submit departmental evidence, update assigned remediation tasks, collaborate via audit comments. |
| **AICTE Reviewing Officer** | `officer@aicte.gov.in` | `Officer@123` | Review assigned applications, inspect extracted fields, request clarifications, recommend applications for decision. |
| **Senior Approving Authority** | `senior@aicte.gov.in` | `Senior@123` | Final approval, rejection, or return of applications with mandatory reasoned remarks; review escalations. |
| **Auditor** | `auditor@qualitycouncil.org` | `Auditor@123` | Read-only scrutiny across all applications, documents, compliance rules, and immutable audit logs. |

---

## 4. Production Hosting Architecture

```mermaid
flowchart LR
    Browser["User Browser - Desktop or Mobile"]
    Frontend["Frontend - React and Vite"]
    Backend["Backend - FastAPI and Uvicorn"]
    Database[("PostgreSQL Database")]
    Storage["Persistent Document Storage"]

    Browser -->|HTTPS| Frontend
    Frontend -->|REST API| Backend
    Backend -->|Database Connection| Database
    Backend -->|PDF and Image Files| Storage
```

### Why this architecture?
- **Frontend on Vercel:** React 18 + Vite static output (`dist/`) deploys globally with sub-second response times, automated SSL certificates, automated branch preview deployments, and zero server maintenance.
- **Backend on Render / Railway / VPS:** FastAPI with PyMuPDF layout parsing requires a standard Python runtime with C libraries (`fitz`, `libpq`). Persistent container hosting ensures fast response times and scheduled background task execution.
- **Database on Supabase / Neon / Render PostgreSQL:** Provides high-availability PostgreSQL with automated backups, connection pooling, and SSL connections. The local SQLite database continues to work seamlessly for offline development.

---

## 5. Local Setup & Quickstart Guide

### Prerequisites
- **Python:** 3.10+ (Tested on Python 3.11 - 3.14)
- **Node.js:** 18+ (Tested on Node v20.18 LTS)

### Quick Launch (Windows)
Double-click `run_demo.bat` in the project root. This automatically starts both the FastAPI backend (`http://127.0.0.1:8000`) and the Vite React frontend (`http://127.0.0.1:5173`).

```bash
# Or start components individually:
start_backend.bat   # Starts FastAPI on http://127.0.0.1:8000
start_frontend.bat  # Starts Vite frontend on http://127.0.0.1:5173
```

### Manual Setup Instructions

#### Backend Setup:
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed_data.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API documentation is available at `http://127.0.0.1:8000/api/v1/docs`.

#### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

#### Running Tests:
```bash
cd backend
pytest -v tests/test_api.py
```

---

## 6. Docker Deployment (Single-Command Launch)

Both frontend and backend are containerized with production Dockerfiles and docker-compose orchestration:

```bash
# Build and run containers
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```
- Frontend: `http://localhost:5173` (Nginx serving React SPA)
- Backend: `http://localhost:8000` (FastAPI + Uvicorn)

---

## 7. GitHub Repository Setup Guide

Follow these beginner-friendly steps to upload this project to GitHub.

### Option A: Using the Terminal (Recommended)

1. Open your terminal in the project root directory:
   ```bash
   cd "c:\Users\mahis\OneDrive\Desktop\SIH PROTOTYPE"
   ```

2. Initialize Git (if not already done):
   ```bash
   git init
   ```

3. Stage all files (the preconfigured `.gitignore` will automatically exclude `.env`, `node_modules`, database files, and cache):
   ```bash
   git add .
   ```

4. Commit the files:
   ```bash
   git commit -m "Initial commit: AICTE SmartComply 360 full-stack prototype"
   ```

5. Create a new repository on [GitHub](https://github.com/new) named:
   ```
   aicte-smartcomply-360
   ```
   *(Select **Public** or **Private**, do not check "Initialize with README" as we already have one).*

6. Link your local project to GitHub and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/aicte-smartcomply-360.git
   git push -u origin main
   ```

### Option B: Using GitHub Desktop (Graphical Interface)

1. Download and install [GitHub Desktop](https://desktop.github.com/).
2. Click **File** &rarr; **Add Local Repository...** and select this project folder (`SIH PROTOTYPE`).
3. Click **Publish repository** to GitHub.
4. Set the name as `aicte-smartcomply-360` and click **Publish**.

---

## 8. Step-by-Step Production Cloud Deployment

### Step 1: Deploy Hosted Database (Supabase / Neon)
1. Go to [Supabase](https://supabase.com/) or [Neon](https://neon.tech/) and create a free project.
2. In your database dashboard, copy the **Transaction Connection String (URI)**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```
3. Save this connection string for the backend step.

### Step 2: Deploy Backend to Render (Free Web Service)
1. Sign in to [Render](https://render.com/).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository: `aicte-smartcomply-360`.
4. Configure service settings:
   - **Name:** `aicte-smartcomply-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3` (or `Docker`)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `sh -c "python seed_data.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT"`
5. In **Environment Variables**, add:
   - `DATABASE_URL`: `[Your PostgreSQL URI from Step 1]` (or leave empty to use local SQLite)
   - `SECRET_KEY`: `[Generate a secure 32+ character random string]`
   - `BACKEND_CORS_ORIGINS`: `*` (or your Vercel URL)
   - `AI_PROVIDER`: `mock` (or `gemini`)
   - `AI_API_KEY`: `[Your Gemini API Key if using Gemini]`
6. Click **Create Web Service**. Once deployed, Render will provide a live URL, e.g.:
   `https://aicte-smartcomply-backend.onrender.com`
7. Verify by opening `https://aicte-smartcomply-backend.onrender.com/health` in your browser. It should return `{"status":"healthy"}`.

### Step 3: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Import the `aicte-smartcomply-360` repository.
4. In the Project Configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and choose `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
5. Expand **Environment Variables** and add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://aicte-smartcomply-backend.onrender.com` *(your backend Render URL from Step 2)*
6. Click **Deploy**.
7. Vercel will build the frontend and issue a production HTTPS URL, e.g.:
   `https://aicte-smartcomply-360.vercel.app`

---

## 9. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default | Example for Production |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | Name displayed in docs | `AICTE SmartComply 360` | `AICTE SmartComply 360` |
| `DATABASE_URL` | SQLAlchemy database URI | `sqlite:///./smartcomply.db` | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | Salt/signature for JWT tokens | `aicte_smartcomply...` | Secure 64-hex string |
| `ALGORITHM` | Cryptographic signing algorithm | `HS256` | `HS256` |
| `BACKEND_CORS_ORIGINS` | Permitted frontend origins | `*` | `https://your-app.vercel.app` |
| `AI_PROVIDER` | AI Copilot engine provider | `mock` | `mock` / `gemini` / `openai` |
| `AI_API_KEY` | API Key for external LLM | Empty | `AIzaSy...` |
| `UPLOAD_DIR` | Upload storage directory | `./uploads` | `./uploads` |

### Frontend (`frontend/.env`)

| Variable | Description | Default | Example for Production |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of deployed backend | Empty (uses `/api/v1` reverse proxy) | `https://aicte-smartcomply-backend.onrender.com` |

---

## 10. Verified Official AICTE Norms vs Demo Rules

To ensure regulatory integrity, rules configured in the engine explicitly display their verification status:

- **Verified AICTE Rules (`is_officially_verified=True`):**
  - `RULE-AICTE-001`: Student-Faculty Ratio (1:20 for Engineering UG, APH Clause 7.1).
  - `RULE-AICTE-002`: Faculty Cadre Ratio (1:2:6, APH Appendix 7).
  - `RULE-AICTE-003`: Principal Ph.D. Requirement (AICTE Minimum Qualifications Regulation 3.2a).
  - `RULE-AICTE-004`: State Fire NOC Validity (APH Chapter I Clause 1.4).
  - `RULE-AICTE-005`: Mandatory Land Area (2.5 Urban / 7.5 Rural Acres, APH Appendix 4).
  - `RULE-AICTE-006`: Student Grievance Redressal Committee (Clause 6.3).
  - `RULE-AICTE-007`: Mandatory Anti-Ragging Committee (2009 Regulations).
- **Demo Rules (`is_officially_verified=False`):**
  - `RULE-DEMO-001`: Digital Library High-Speed Bandwidth Benchmark (500 Mbps).
  - `RULE-DEMO-002`: Campus Renewable Solar Energy Quota (15% capacity).

---

## 11. Troubleshooting & FAQ

#### 1. Why do I see a 404 when refreshing a subroute on Vercel?
`frontend/vercel.json` contains a rewrite rule routing all paths to `index.html`. Ensure `vercel.json` is committed in your repository.

#### 2. CORS error in browser console:
Ensure your backend has `BACKEND_CORS_ORIGINS="*"` or includes your exact Vercel frontend URL (e.g. `https://aicte-smartcomply-360.vercel.app`).

#### 3. Database connection fails with `postgres://`:
Hosted providers often provide URIs starting with `postgres://`. The backend automatically converts this to `postgresql://` to comply with SQLAlchemy 2.0.

#### 4. PyMuPDF fails to build on Debian/Ubuntu:
Ensure `build-essential` and `libpq-dev` are installed (`backend/Dockerfile` includes these by default).
