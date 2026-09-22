# Architecture & Design Decisions (DECISIONS.md)

This log documents all architectural choices, engineering trade-offs, and design decisions made for **RailSync AI — Automatic Block Planning System**.

---

## 1. Database Architecture & Engine
- **Choice**: PostgreSQL 18 with Prisma ORM.
- **Rationale**: Strict relational schema enforcement is paramount for railway safety data (stations, connected track segments, maintenance requests, and train schedules). Prisma provides type-safe queries, automatic migrations, and clean relations.
- **Port**: Configured on port `5433` for local direct development, and exposed on `5432` in `docker-compose.yml`.

## 2. Optimization Layer
- **Choice**: Embedded TypeScript optimization engine (`src/engine/blockOptimizer.ts`) with Explainable AI module (`src/engine/xaiExplainer.ts`).
- **Rationale**: Running the optimizer in TypeScript within the Node.js service ensures zero inter-process overhead, instant sub-second response times, shared type definitions with Prisma models, and zero Python runtime dependencies in container deployments.
- **Priority Scoring Formulation**:
  $$\text{Priority} = w_1 \times \text{Severity} + w_2 \times \text{Urgency} + w_3 \times \text{SafetyImpact} + w_4 \times \text{AssetAvailabilityImpact}$$
  Weights:
  - Severity: 0.35 (Critical: 100, High: 75, Medium: 50, Low: 25)
  - Urgency (Time to Impact): 0.25 (Inverse function of hours remaining before critical failure or train delay)
  - Safety Impact: 0.20 (Track / OHE electrical hazards score higher)
  - Asset Availability Impact: 0.20 (Double line vs Single line bottle-neck analysis)

## 3. Real-Time Layer (Socket.io)
- **Choice**: Socket.io WebSocket server with structured room segregation.
- **Rooms**:
  - `admin-room`: All Operations Admins receive live incoming requests, conflicts, and resolutions.
  - `dept-engineering`, `dept-td`, `dept-sandt`: Department-specific streams for work alerts and co-required tasks.
  - `pilot-{userId}`: Targeted alerts for Loco Pilots running trains across affected corridor segments.
- **Fallback**: Persistent `Notification` records in PostgreSQL guarantee zero missed events for offline or reconnected clients.

## 4. File Storage Architecture
- **Choice**: Abstract `StorageAdapter` interface with local filesystem implementation (`LocalStorageAdapter`) saving to `uploads/` volume.
- **Rationale**: Fully functional without requiring cloud credentials during local evaluation or SIH judging, while enabling instant 1-line swap to S3 or Azure Blob for production.

## 5. Security & RBAC Enforcement
- **Choice**: JWT bearer token authentication with server-side NestJS `RolesGuard`.
- **Constraint**: Loco Pilots (`USER_PILOT`) are strictly forbidden from mutation endpoints (`POST /requests`, `PATCH /requests/*/schedule`, etc.) returning HTTP 403 Forbidden.
- **Password Security**: Bcrypt hash with salt rounds = 10.

## 6. Cloud Hosting & Serverless Database Architecture
- **Choice**: Distributed Cloud Deployment — Vercel (Frontend SPA) + Render (NestJS API & WebSockets) + Neon (Serverless PostgreSQL).
- **Rationale**:
  - **Vercel**: Provides sub-second global edge delivery and static asset caching for the React SPA.
  - **Render**: Supports persistent, non-serverless Node.js execution required for stateful Socket.io WebSocket rooms and background optimization calculations.
  - **Neon PostgreSQL**: Provides instant scaling, pooled connection management, and zero cold-start database reliability.

## 7. Dynamic API & WebSocket Host Resolution
- **Choice**: Multi-environment client-side resolver (`getApiBaseUrl()`).
- **Rationale**: Enables seamless transition across local development (`http://localhost:4000`), local network testing (`192.168.x.x`), and live cloud environments (`https://*.onrender.com`) without manual code re-bundling.

