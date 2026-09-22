# RailSync AI — Automatic Block Planning System
### AI-Powered Maintenance Scheduling & Asset Availability Maximizer for Indian Railways

> **Corridor Prototype**: South Central & East Coast Mainline — **Secunderabad Jn (`SC`) ↔ Visakhapatnam Jn (`VSKP`)** (699 KM, 10 Stations, 9 Track Segments).

---

## 📌 Project Overview

**RailSync AI** is a real-time, AI-driven railway maintenance block planning and conflict-resolution system designed to maximize railway asset availability while safeguarding passenger and freight train punctuality.

Traditional block planning in Indian Railways is manually coordinated across disparate departments (Civil Engineering/P-Way, Traction Distribution/OHE 25kV, and Signal & Telecom), leading to delayed approvals, corridor bottlenecks, and train detentions. **RailSync AI** solves this through:

1. **Multi-Factor Priority Scoring Formulation**: Dynamically weighs defect severity, urgency, safety risk, and single-line bottlenecks.
2. **Automated Conflict Detection & Shadow Window Generation**: Detects overlapping crew rosters, corridor possessions, and timetable collisions.
3. **Explainable AI (XAI)**: Provides human-readable mathematical justification and safety code compliance checks for Chief Controllers.
4. **Real-Time Cross-Role Collaboration**: Instant bi-directional communication across Operations Control, Department Maintenance Gangs, and Chief Loco Pilots via WebSocket rooms.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client ["Client Tier (Browser / Mobile)"]
        AdminUI["Operations Admin Dashboard\n(OCC, Map, Queue, AI Studio, Swimlanes, Heatmap)"]
        DeptUI["Department Engineer Dashboard\n(Defect Filing, Photo Proof, Status Tracker)"]
        PilotUI["Loco Pilot Portal\n(HUD, Route Map, Live Caution Orders)"]
    end

    subgraph HostingFrontend ["Frontend Hosting (Vercel)"]
        VercelCDN["Vercel Global Edge Network\n(SPA React 18 + Vite + TailwindCSS)"]
    end

    subgraph HostingBackend ["Backend Cloud Service (Render)"]
        REST["REST API & JWT RBAC Guards\n(NestJS 10 + TypeScript)"]
        WS["Socket.io WebSocket Gateway\n(Room Segregation & Live Telemetry)"]
        OptEngine["Embedded Optimization Engine\n(BlockOptimizer & WeeklyMonthlyPlanner)"]
        XAIEngine["Explainable AI (XAI) Explainer"]
        HealthRoute["Health Check Endpoint (GET /)"]
    end

    subgraph CloudDB ["Cloud Database Tier (Neon)"]
        Prisma["Prisma ORM Client"]
        NeonDB[("Neon Serverless PostgreSQL\n(Strict Relational Safety Schema)")]
    end

    AdminUI <--> VercelCDN
    DeptUI <--> VercelCDN
    PilotUI <--> VercelCDN

    VercelCDN <-->|HTTPS REST / WSS| REST
    VercelCDN <-->|WebSocket| WS
    REST <--> OptEngine
    REST <--> XAIEngine
    REST <--> Prisma
    Prisma <--> NeonDB
```

---

## 📋 System Requirements

### Development & Local Execution
- **Node.js**: `v18.0.0` or higher (Recommended: `v20.x` or `v22.x` / `v24.x`)
- **Package Manager**: `npm` `v9.x` or higher
- **Database**:
  - **Option A (Cloud)**: [Neon Serverless PostgreSQL](https://neon.tech) (Recommended)
  - **Option B (Local)**: PostgreSQL `16+` (configured in `backend/.env`)
- **Browsers**: Google Chrome 100+, Microsoft Edge 100+, Mozilla Firefox 100+, Safari 15+
- **Operating System**: Windows 10/11, macOS 12+, or Ubuntu/Debian Linux

### Cloud Production Stack
- **Frontend Hosting**: [Vercel](https://vercel.com) (React 18 SPA)
- **Backend Hosting**: [Render](https://render.com) (Node.js Web Service with WebSockets)
- **Cloud Database**: [Neon](https://neon.tech) (Serverless PostgreSQL with Connection Pooling)

---

## 🔑 Pre-Seeded Demo Accounts & Credentials

The system comes pre-seeded with real-world Indian Railways roles on the Secunderabad–Visakhapatnam corridor:

| Role | Employee ID | Email | Password | Assigned Corridor / Train |
|---|---|---|---|---|
| **Chief Controller (Admin)** | `EMP-ADM-001` | `admin@railsync.ir` | `Admin@123` | Operations Control Centre (Corridor-wide) |
| **Sr. Section Engineer (Civil)** | `EMP-ENG-101` | `engg@railsync.ir` | `Password@123` | Engineering Department (P-Way) |
| **OHE Section Engineer (Electrical)** | `EMP-TD-201` | `td@railsync.ir` | `Password@123` | Traction Distribution (25kV OHE) |
| **Signal Inspector (S&T)** | `EMP-SNT-301` | `sandt@railsync.ir` | `Password@123` | Signal & Telecommunication |
| **Chief Loco Pilot (Driver)** | `EMP-PLT-501` | `pilot@railsync.ir` | `Password@123` | Train 12728 (Godavari Superfast Express) |

---

## 🚀 Deployment Guide

### 1. Cloud Database (Neon PostgreSQL)
1. Create a free project on [Neon.tech](https://neon.tech) named `railsync`.
2. Copy your pooled connection string:
   ```env
   DATABASE_URL="postgresql://neondb_owner:<password>@ep-bitter-poetry-b4zm5bmo-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Push schema and seed initial corridor data:
   ```bash
   cd backend
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

---

### 2. Backend Deployment (Render)
1. Create a new **Web Service** on [Render.com](https://render.com) from this repository.
2. Configure settings:
   - **Root Directory**: `(Leave empty / repository root)`
   - **Build Command**: `npm install && npm --prefix backend run build`
   - **Start Command**: `npm run start:prod`
3. Environment Variables:
   - `DATABASE_URL`: `(Your Neon PostgreSQL connection string)`
   - `PORT`: `4000`
   - `JWT_SECRET`: `railsync_super_secure_jwt_secret_key_2026_sih`
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`

---

### 3. Frontend Deployment (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Configure environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<your-render-backend-url>.onrender.com` *(no trailing slash)*
3. Deploy. The dynamic API client automatically connects to your live cloud backend.

---

## 💻 Local Quick-Start

### One-Click Fast Launcher (Windows)
Double-click `start-project.bat` or run in PowerShell:
```powershell
./start-project.ps1
```
This automatically launches:
- PostgreSQL service
- Backend NestJS server (`http://localhost:4000`)
- Frontend Vite dev server (`http://localhost:5173`)
- Opens your browser directly to the Role Selection portal.

### Manual Setup
```bash
# 1. Install all dependencies
npm install

# 2. Start Backend
cd backend
npm run start:dev

# 3. Start Frontend (in a new terminal)
cd frontend
npm run dev
```

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/neondb?sslmode=require` |
| `PORT` | HTTP Server port | `4000` |
| `JWT_SECRET` | Secret key for JWT signing | `railsync_super_secure_jwt_secret_key_2026_sih` |
| `JWT_EXPIRES_IN` | JWT expiration duration | `7d` |
| `UPLOAD_DIR` | Directory for uploaded photo evidence | `./uploads` |
| `FRONTEND_URL` | Allowed origin for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env` / Vercel)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API | `https://railsync-backend.onrender.com` |

---

## 🧠 Core Optimization & AI Features

### 1. Multi-Factor Priority Score Formulation
Implemented in [`backend/src/engine/blockOptimizer.ts`](file:///c:/Users/omkar/OneDrive/Documents/reddy513/backend/src/engine/blockOptimizer.ts):

$$\text{Priority} = 0.35 \times \text{Severity} + 0.25 \times \text{Urgency} + 0.20 \times \text{SafetyRisk} + 0.20 \times \text{AssetBottleneck}$$

- **Severity ($w_1 = 0.35$)**: Critical (100), High (75), Medium (50), Low (25).
- **Urgency ($w_2 = 0.25$)**: Calculated as a function of elapsed defect time and estimated train detention minutes.
- **Safety Risk ($w_3 = 0.20$)**: S&T (95, interlocking collision risk), TD (90, 25kV OHE hazard), Engineering (100 for derailment risk, 80 standard).
- **Asset Bottleneck ($w_4 = 0.20$)**: Single-line sections (Duvvada ↔ Visakhapatnam) score 95 due to network throughput collapse vs 65 for double-line track.

### 2. Candidate Window Generation
The engine evaluates 3 candidate windows for each maintenance defect:
- **Candidate 1: Immediate Shadow Block Window** (Integrated joint block utilizing off-peak traffic intervals).
- **Candidate 2: Midday Traffic Lull Window** (Exploits passenger schedule gaps between 11:30 and 13:45).
- **Candidate 3: Night Low-Density Window** (01:00 to 04:00 off-peak heavy maintenance).

### 3. Explainable AI (XAI) Module
Implemented in [`backend/src/engine/xaiExplainer.ts`](file:///c:/Users/omkar/OneDrive/Documents/reddy513/backend/src/engine/xaiExplainer.ts):
- Transparently decomposes the mathematical score for human safety audits.
- Verifies hard constraints: Crew Overlap Conflict Free, Corridor Exclusivity, Timetable Integrity.
- Generates Joint Departmental Coordination Directives and Safety Compliance Mandates.

---

## 🧪 Testing & Verification

```bash
# Run backend Jest unit tests
npm --prefix backend run test

# Run frontend production build validation
npm --prefix frontend run build
```

---

## 📁 Repository Structure

```
reddy513/
├── backend/                      # NestJS 10 Backend Service
│   ├── prisma/                   # Schema, migrations & corridor seed script
│   ├── src/
│   │   ├── app.controller.ts     # Health check & root API status
│   │   ├── app.module.ts         # Root module configuration
│   │   ├── engine/               # Optimizer, XAI & Planner engines + specs
│   │   ├── modules/
│   │   │   ├── auth/             # JWT, Bcrypt, Passport & RolesGuard
│   │   │   ├── requests/         # Multer storage, workflow & status updates
│   │   │   ├── optimizer/        # AI Block recommendation endpoints
│   │   │   ├── segments/         # Track segments & station telemetry
│   │   │   ├── trains/           # Train scheduling & pilot tracking
│   │   │   ├── notifications/    # Socket.io gateway & persistent alerts
│   │   │   └── audit/            # Immutable operations audit logs
│   ├── Dockerfile
│   └── package.json
├── frontend/                     # React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── api/                  # Axios typed API client (dynamic host resolution)
│   │   ├── components/           # CorridorTrackMap, ProtectedRoute, Layout
│   │   ├── sockets/              # Socket.io client connection manager
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx     # Role-based login with clear network error handling
│   │   │   ├── RegisterPage.tsx  # Employee registration
│   │   │   ├── RoleSelectPage.tsx# Interactive portal selector
│   │   │   └── dashboards/
│   │   │       ├── AdminDashboard.tsx       # OCC, Map, Queue, Schedule, Heatmap
│   │   │       ├── AdminOptimizerStudio.tsx # Dedicated XAI Optimizer Workbench
│   │   │       ├── DepartmentDashboard.tsx  # Defect filing & status tracking
│   │   │       └── UserDashboard.tsx        # Loco Pilot HUD & Route Map
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml            # Multi-container production deployment
├── start-project.bat             # Fast Windows launcher
├── start-project.ps1             # Fast PowerShell launcher
├── DECISIONS.md                  # Architectural decisions & design rationale
└── README.md                     # Comprehensive project documentation
```
