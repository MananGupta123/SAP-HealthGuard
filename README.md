# SAP HealthGuard (mini)

AI-powered SAP incident triage and prediction system with agentic analysis, risk scoring, and automated playbook generation.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Next.js%20%7C%20SQLite-blue)

## 🎯 Features

- **Incident Ingestion** — Normalize SAP logs into structured incidents
- **AI Analysis** — Classify incidents and identify root causes using Groq LLM
- **Similarity Search** — Find related historical incidents using TF-IDF
- **Risk Prediction** — Rule-based scoring with month-end and system metrics
- **Playbook Generation** — L1/L2 remediation steps with verification and rollback
- **Escalation Flow** — Human-in-the-loop for high-risk actions

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────────────┐
│   Next.js       │────▶│  Express Backend                 │
│   Frontend      │     │  ├─ SAP Sandbox Routes           │
│   (Vercel)      │     │  ├─ Incident API                 │
└─────────────────┘     │  ├─ Agent Tools                  │
                        │  │   ├─ analyze_incident (Groq)  │
                        │  │   ├─ find_similar (TF-IDF)    │
                        │  │   ├─ predict_risk (Rules)     │
                        │  │   ├─ suggest_playbook (Groq)  │
                        │  │   └─ escalate_to_human        │
                        │  └─ SQLite Database              │
                        └──────────────────────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   Groq API    │
                              │               │
                              └───────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Groq API key (free at https://console.groq.com)

### 1. Clone and Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Frontend
cd ../frontend
npm install
```

### 2. Start Development

```bash
# Terminal 1 - Backend (port 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3001)
cd frontend
npm run dev
```

### 3. Open the App
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

### 4. Ingest Sample Logs
Click "⟳ Ingest Logs" on the dashboard to import 18 sample SAP incidents.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sap/sandbox/logs` | Get all SAP logs |
| POST | `/sap/sandbox/logs` | Create new log |
| POST | `/api/incidents/ingest` | Ingest and normalize logs |
| POST | `/api/incidents/analyze` | Full analysis pipeline |
| GET | `/api/incidents` | List all incidents |
| POST | `/api/escalate` | Create escalation |

## 🔄 Swap to Real SAP

To connect to real SAP APIs instead of the sandbox:

1. **Update Backend** — Modify `src/routes/incidents.ts`:
   ```typescript
   // Replace getAllLogs() with:
   const res = await fetch(`${process.env.SAP_API_URL}/sap/opu/odata/...`, {
     headers: { 'Authorization': `Bearer ${process.env.SAP_API_KEY}` }
   });
   ```

2. **Add Environment Variables**:
   ```
   SAP_API_URL=https://your-sap-instance.com
   SAP_API_KEY=your_api_key
   ```

3. **Update Log Schema** — Map SAP Business Event Enablement fields to the `SapLog` interface in `src/types/index.ts`.

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```
Set `NEXT_PUBLIC_API_URL` to your backend URL.

### Backend → Railway
```bash
cd backend
railway up
```
Set `GROQ_API_KEY` and `FRONTEND_URL` in Railway dashboard.

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.ts         # Express server
│   │   ├── db/schema.ts      # SQLite setup
│   │   ├── routes/           # API routes
│   │   ├── tools/            # Agent tools
│   │   ├── services/         # Groq, TF-IDF
│   │   └── types/            # TypeScript types
│   └── prompts/              # LLM prompts
├── frontend/
│   └── app/                  # Next.js pages
└── README.md
```

## 🔑 Environment Variables

### Backend (`.env`)
```
GROQ_API_KEY=gsk_...       # Required
PORT=3000                   # Optional
FRONTEND_URL=http://localhost:3001
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📄 License

MIT
