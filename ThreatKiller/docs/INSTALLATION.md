# Installation Guide - InsiderGuard AI

This document provides step-by-step instructions on setting up and running the **InsiderGuard AI** platform locally.

---

## Prerequisites

Ensure you have the following installed on your machine:

1. **Docker** (version 20.10 or higher)
2. **Docker Compose** (version 2.0 or higher)
3. **Git** (for cloning code, if applicable)

---

## Quick Start (Docker Compose)

The easiest and recommended way to run the entire stack is using Docker Compose. This starts the PostgreSQL database, FastAPI backend, and React frontend inside isolated containers, seeds the database, and pre-trains the Isolation Forest model.

### 1. Build and Run the Stack

From the root directory containing `docker-compose.yml`, execute:

```bash
docker compose up --build
```

This will:
- Spin up a PostgreSQL database instance on port `5432`.
- Run the automatic database seeding script to populate **100 users**, **5000 logins**, **3000 file logs**, **1000 queries**, and **200 attack events**.
- Pre-train the **Isolation Forest model** and save it to the AI volume.
- Start the FastAPI backend server on `http://localhost:8000`.
- Build the Vite + React frontend and serve it on port `http://localhost:80` (or `http://localhost`).

### 2. Access the Application

- Open your browser and navigate to: **`http://localhost`**
- Log in with the default admin credentials:
  - **Username**: `admin`
  - **Password**: `password123`

---

## Local Development Setup (Manual)

If you wish to run the components manually without Docker:

### 1. PostgreSQL Database Setup
Ensure you have a PostgreSQL server running locally.
1. Create a database named `insiderguard_db`.
2. Create a user `insiderguard_user` with password `insiderguard_secure_password123`.

### 2. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database and train the AI model:
   ```bash
   python database/seed_db.py
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the development frontend at: **`http://localhost:5173`**
   - In development mode, Vite will proxy `/api` calls directly to `http://localhost:8000`.
