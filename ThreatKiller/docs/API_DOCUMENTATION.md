# API Documentation - InsiderGuard AI

This document provides specifications for the **InsiderGuard AI** REST API endpoints. All requests and responses are in JSON format.

---

## Authentication

All endpoints (except `/login`) require a JWT Bearer token in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints Summary

| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public | Login credentials, returns JWT token |
| `GET` | `/dashboard` | User | Fetch summary metrics, charts, and recent activity logs |
| `GET` | `/users` | User | List all users and their risk profiles |
| `GET` | `/alerts` | User | Fetch all incident alerts |
| `POST` | `/alerts/{id}/resolve` | SOC Analyst / Admin | Resolve a security alert |
| `GET` | `/risk` | User | Fetch current risk scores for all users |
| `GET` | `/risk/{user_id}` | User | Fetch detailed Explainable AI factors for a user |
| `POST` | `/simulate` | Admin | Run a synthetic cyber threat simulation |
| `POST` | `/upload-logs` | SOC Analyst / Admin | Upload a batch of system logs for AI processing |
| `GET` | `/analytics` | User | Fetch security intelligence and threat vector metrics |

---

## Endpoint Details

### 1. Authentication
- **Path**: `/login` (also available as `/api/auth/login`)
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1...",
    "token_type": "bearer",
    "role": "Admin",
    "username": "admin",
    "status": "Active"
  }
  ```

---

### 2. Get Dashboard Feed
- **Path**: `/dashboard` (also available as `/api/dashboard`)
- **Method**: `GET`
- **Success Response (200 OK)**:
  ```json
  {
    "metrics": {
      "total_users": 100,
      "high_risk_users": 3,
      "active_sessions": 12,
      "alerts_today": 5
    },
    "risk_distribution": [
      { "name": "Safe", "value": 90 },
      { "name": "Medium", "value": 7 },
      { "name": "High", "value": 2 },
      { "name": "Critical", "value": 1 }
    ],
    "threat_timeline": [
      { "date": "Jul 10", "alerts": 1 },
      { "date": "Jul 11", "alerts": 0 }
      // ... 7 items
    ],
    "login_activity": [
      { "date": "Jul 10", "success": 150, "failed": 4 }
      // ... 7 items
    ],
    "top_risk_users": [
      {
        "username": "john.smith45",
        "role": "Standard Employee",
        "score": 92,
        "status": "Critical"
      }
    ],
    "recent_alerts": [
      {
        "id": 12,
        "username": "john.smith45",
        "title": "Insider Data Theft Detected",
        "description": "User downloaded 1200MB of files from /restricted/financials",
        "risk_score": 92,
        "severity": "Critical",
        "is_resolved": false,
        "timestamp": "2026-07-16T12:00:00"
      }
    ],
    "recent_logins": [
      {
        "id": 543,
        "username": "emily.watson12",
        "ip_address": "192.168.1.42",
        "device_id": "dev-45321",
        "country": "United States",
        "is_success": true,
        "timestamp": "2026-07-16T12:05:00"
      }
    ]
  }
  ```

---

### 3. Attack Simulator
- **Path**: `/simulate` (also available as `/api/simulate`)
- **Method**: `POST`
- **Requires Admin role**.
- **Payload**:
  ```json
  {
    "simulation_type": "Insider Data Theft"
  }
  ```
  *(Valid simulation types: `Insider Data Theft`, `Privilege Escalation`, `Credential Compromise`, `Malicious Admin`)*
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Simulation of 'Insider Data Theft' completed successfully.",
    "target_user": "john.doe88",
    "risk_score": 85,
    "status": "Critical",
    "reasons": [
      "Download volume significantly exceeded user's baseline",
      "Access to restricted filepath"
    ],
    "action_enforced": "Terminate Session",
    "alert_created": true
  }
  ```

---

### 4. Upload System Logs
- **Path**: `/upload-logs` (also available as `/api/upload-logs`)
- **Method**: `POST`
- **Requires Admin or SOC Analyst role**.
- **Payload**:
  ```json
  [
    {
      "username": "emily.watson12",
      "event_type": "file",
      "ip_address": "192.168.1.42",
      "device_id": "dev-45321",
      "filepath": "/restricted/database_exports/client_profiles.csv",
      "file_size_bytes": 850000000,
      "action": "Read"
    }
  ]
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Successfully processed 1 logs.",
    "anomalies_found": 1
  }
  ```
