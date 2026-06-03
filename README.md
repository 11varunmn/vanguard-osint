# ⬡ Vanguard OSINT Platform

> **Lawful social media intelligence and digital forensics — built for investigators, not algorithms.**

![Status](https://img.shields.io/badge/status-active-00d4ff?style=flat-square)
![Python](https://img.shields.io/badge/python-3.12-3776ab?style=flat-square&logo=python)
![React](https://img.shields.io/badge/react-18-61dafb?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/fastapi-0.110-009688?style=flat-square&logo=fastapi)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What is Vanguard?

Vanguard is a prototype platform for **lawful Open Source Intelligence (OSINT)** investigations. It consolidates fragmented public data from multiple platforms, identifies behavioural patterns through linguistic analysis, and preserves every artifact in a tamper-evident evidence vault.

It is designed for **investigators, journalists, and security researchers** who need:
- Auditable, court-ready evidence chains
- Explainable AI — scores are leads, not verdicts
- A single workspace for multi-platform identity analysis

---

## Core Capabilities

### 🔬 Linguistic Stylometry Engine
Compare writing samples across platforms to detect probable authorship similarity. Extracts lexical density, punctuation habits, sentence rhythm, vocabulary overlap, capitalisation style, and syntactic patterns. Returns a scored, explainable comparison trace — not a black-box decision.

### ◈ Graph-Based Relationship Analysis
Models accounts, posts, hashtags, shared URLs, and interaction events as a knowledge graph (Neo4j). Identifies clusters, bridge nodes, and cross-platform coordination patterns visually.

### ◎ Immutable Forensic Evidence Vault
Every artifact is SHA-256 hashed at ingestion, timestamped in UTC, and written to an append-only audit log. Nothing is ever overwritten. Exports include full chain-of-custody metadata.

### ▦ Forensic Report Generator
Produces investigation-ready reports in PDF and JSON, with evidence hashes, stylometry traces, graph findings, and analyst sign-off.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Analyst Browser                       │
│              React 18 · TypeScript · Tailwind            │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS / REST
┌─────────────────────▼───────────────────────────────────┐
│                  FastAPI Backend                          │
│     Auth · Cases · Ingestion · Stylometry · Reports      │
└──────┬──────────────┬──────────────────┬────────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐  ┌───────▼───────┐
│  PostgreSQL  │ │   Neo4j    │  │ Evidence Vault │
│  Cases/Meta  │ │   Graph    │  │  Raw artifacts │
└─────────────┘ └────────────┘  └───────────────┘
```

---

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/vanguard-osint.git
cd vanguard-osint
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings (see Environment Variables below)
```

### 3. Start everything
```bash
docker compose up --build
```

The platform will be available at:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Neo4j Browser:** http://localhost:7474

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEO4J_URI` | Neo4j bolt URI |
| `SECRET_KEY` | JWT signing key (generate with `openssl rand -hex 32`) |
| `EVIDENCE_VAULT_PATH` | Local path for artifact storage |

---

## Project Structure

```
vanguard-osint/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── views/          # Page-level views
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # API client, utilities
│   └── package.json
├── backend/                # FastAPI application
│   ├── api/routes/         # HTTP route handlers
│   ├── services/           # Business logic
│   │   ├── stylometry.py   # Linguistic analysis engine
│   │   ├── graph.py        # Neo4j graph operations
│   │   └── vault.py        # Evidence storage
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic request/response schemas
│   └── core/               # Config, auth, database setup
├── docker-compose.yml      # Full stack orchestration
├── .env.example            # Environment template
└── .github/workflows/      # CI/CD pipelines
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate and receive JWT |
| POST | `/cases` | Create a new investigation case |
| GET | `/cases/{id}` | Get case details |
| POST | `/cases/{id}/ingest` | Ingest sources into a case |
| POST | `/cases/{id}/stylometry/compare` | Run stylometric comparison |
| GET | `/cases/{id}/graph` | Get graph data for visualisation |
| GET | `/cases/{id}/audit` | Get full audit trail |
| POST | `/cases/{id}/reports` | Generate a forensic report |

Full interactive docs at `/docs` when running.

---

## Ethical Disclaimer

> Vanguard is designed for **lawful investigations only**. Similarity scores are investigative leads, not proof of identity. All analysis must be corroborated before any conclusions are drawn. The platform does not access private accounts, perform credential attacks, or violate platform terms of service.

---

## Development

### Backend (Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Node)
```bash
cd frontend
npm install
npm run dev
```

### Run tests
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

---

## Roadmap

- [x] Case management system
- [x] Evidence vault with SHA-256 integrity
- [x] Stylometry engine (lexical + syntactic features)
- [x] Graph builder and visualiser
- [x] Forensic report generator
- [ ] Platform API connectors (Twitter v2, Reddit)
- [ ] Background task queue (Celery + Redis)
- [ ] Multi-analyst collaboration
- [ ] Advanced entity resolution
- [ ] Export to MISP / OpenCTI

---

## License

MIT — see [LICENSE](LICENSE) for details.

Built with ☕ and a lot of terminal sessions.
