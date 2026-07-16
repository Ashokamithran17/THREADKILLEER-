# InsiderGuard AI 🛡️

**InsiderGuard AI** is a production-ready, AI-powered Insider Threat Detection and Privileged Access Monitoring platform designed specifically for banking and high-security financial environments. 

The platform leverages **machine learning (Isolation Forest)** combined with custom heuristic threat analysis to continuously monitor insider logins, file activity, and database queries. It dynamically calculates user risk scores, explains anomalous behavior (Explainable AI), and enforces security policies in real-time (Adaptive Response).

---

## Technical Architecture

The platform runs as a multi-container stack orchestrated via Docker Compose:

```
                  ┌──────────────────────────────────────────────┐
                  │               REACT FRONTEND                 │
                  │   Vite + TS + Tailwind CSS + Recharts        │
                  └──────────────────────┬───────────────────────┘
                                         │ (HTTPS/HTTP)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                 NGINX PROXY                  │
                  │   Serves frontend assets, routes API traffic │
                  └──────────────────────┬───────────────────────┘
                                         │ (Proxied requests)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                FASTAPI SERVER                │
                  │    JWT Auth, Risk Engine, Simulator Endpoints│
                  └──────────┬────────────────────────┬──────────┘
                             │                        │
                             ▼                        ▼
                  ┌────────────────────┐    ┌────────────────────┐
                  │    POSTGRES DB     │    │  ISOLATION FOREST  │
                  │  SQLAlchemy Models │    │  Scikit-Learn ML   │
                  └────────────────────┘    └────────────────────┘
```

---

## Documentation Links

- [Installation Guide](file:///C:/Users/logam/.gemini/antigravity/scratch/insiderguard-ai/docs/INSTALLATION.md): Complete guidelines on how to spin up the containerized stack.
- [API Documentation](file:///C:/Users/logam/.gemini/antigravity/scratch/insiderguard-ai/docs/API_DOCUMENTATION.md): Detailed information on REST endpoints, schemas, payloads, and response objects.

---

## Features

1. **AI Anomaly Detection (Isolation Forest)**:
   - Trained on historical user behavior (login times, known devices, IP locations, file sizes, query targets).
   - Detects deviations (e.g. standard employees downloading huge files, off-hours brute forcing, administrative log clearing).

2. **Explainable AI (XAI)**:
   - Breaks down exactly why a user's risk score is high (e.g., "New device detected", "Payroll database queried").
   - Provides recommended remediation steps for SOC analysts.

3. **Adaptive Response Policy**:
   - **Score < 30 (Safe)**: Normal auditing.
   - **Score 31 - 60 (Medium)**: Require Multi-Factor Authentication (MFA).
   - **Score 61 - 80 (High)**: Disable downloads and restrict privileges.
   - **Score 81 - 100 (Critical)**: Terminate active sessions and suspend account access.

4. **SOC Security Dashboard**:
   - Glowing dark enterprise interface.
   - Live metrics, charts (Risk Distribution, Threat Timeline, Login Traffic, Top Insiders), and triage logs.

5. **Threat Simulator**:
   - Play out typical scenarios: *Insider Data Theft*, *Privilege Escalation*, *Credential Compromise*, and *Malicious Admin*.
   - Watch logs get injected, parsed, analyzed, and countered instantly inside the simulation terminal.

---

## Quick Start (Docker Compose)

Wipe and spin up the complete, seeded system in one command:

```bash
docker compose up --build
```

**Access URL**: `http://localhost`
- **Demo Username**: `admin`
- **Demo Password**: `password123`
- **Role**: `Admin`

---

## Project Structure

```
insiderguard-ai/
├── docker-compose.yml
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── database/
│   │   ├── __init__.py
│   │   ├── db.py
│   │   ├── models.py
│   │   └── seed_db.py
│   └── ai/
│       ├── __init__.py
│       ├── ai_engine.py
│       └── risk_engine.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── nginx.conf
│   ├── Dockerfile
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── types.ts
│       └── components/
│           ├── DashboardView.tsx
│           ├── UsersView.tsx
│           ├── SimulatorView.tsx
│           └── AlertsView.tsx
└── docs/
    ├── INSTALLATION.md
    └── API_DOCUMENTATION.md
```
