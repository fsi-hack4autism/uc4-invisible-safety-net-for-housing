# Ambient Guardian

Ambient Guardian is a starter full-stack prototype for monitoring ambient building safety signals in real time.

## What is included

- A FastAPI backend that simulates sensor telemetry
- A lightweight AI/risk pipeline for anomaly flags, risk scoring, and plain-English reasoning
- A WebSocket stream for live dashboard updates
- An Angular frontend with a simple operations dashboard

## Project structure

```text
ambient-guardian/
├── backend/
├── frontend/
└── README.md
```

## Backend run instructions

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Start the API server:

```bash
uvicorn backend.main:app --reload
```

4. Open `http://127.0.0.1:8000/docs` for the API and connect the frontend to `ws://127.0.0.1:8000/ws/live`.

## Frontend run instructions

1. Move into the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the Angular app:

```bash
npm start
```

4. Open `http://localhost:4200`.

## Assumptions

- The backend uses a rule-based fallback anomaly detector so the app works even without a trained model.
- `backend/models/isolation_forest.pkl` is currently a placeholder file for future model training/export.
