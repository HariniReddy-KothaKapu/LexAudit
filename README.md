# LexAudit – AI Contract Risk Analyzer

A production-quality MVP that helps businesses and individuals understand legal contracts before signing. Powered by Google Gemini AI.

## Features

- **Contract Upload** — PDF & DOCX support with drag-and-drop
- **Clause Detection** — Automatically identifies 10+ clause types
- **AI Risk Analysis** — Risk level, severity score, business & legal impact per clause
- **Plain-English Translation** — Simple explanations for every clause
- **Negotiation Assistant** — Safer alternatives, talking points, and modified wording
- **Risk Score Engine** — Custom 0–100 composite scoring algorithm
- **Missing Clause Detection** — Alerts for missing critical protections
- **Executive Summary** — Overview, top risks, and a Sign/Review/Do Not Sign verdict
- **Dashboard** — Charts, stats, and recent activity
- **Contract History** — Search, filter, and manage past analyses

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| AI | Google Gemini 1.5 Flash |
| PDF Parsing | pdf-parse |
| DOCX Parsing | mammoth |
| Auth | JWT + bcryptjs |
| Charts | Recharts |
| Deployment | Vercel (Frontend) + Render (Backend) |

---

## Project Structure

```
LexAudit/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth + upload middleware
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Gemini AI service
│   │   ├── utils/          # Text extractor + scoring engine
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, RiskBadge, RiskGauge, etc.
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # All 8 pages
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd LexAudit
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/lexaudit
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The API will be running at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
```

The `.env` file for development uses the Vite proxy, so no changes needed.

Start the frontend:

```bash
npm run dev
```

The app will be at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `7d`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLIENT_URL` | Frontend URL for CORS |
| `NODE_ENV` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (production only) |

In development, the Vite proxy forwards `/api` requests to `localhost:5000` automatically.

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node src/server.js`
5. Add all environment variables from `.env`
6. Set `CLIENT_URL` to your Vercel frontend URL
7. Set `NODE_ENV=production`

### Frontend → Vercel

1. Import the `frontend/` folder on [Vercel](https://vercel.com)
2. Set **Framework**: Vite
3. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com/api`
4. Deploy

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/profile` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update name/email |

### Contracts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/contracts/upload` | Yes | Upload & analyze contract |
| GET | `/api/contracts` | Yes | List user's contracts |
| GET | `/api/contracts/stats` | Yes | Dashboard statistics |
| GET | `/api/contracts/:id` | Yes | Get contract + clauses |
| DELETE | `/api/contracts/:id` | Yes | Delete contract |

---

## Risk Scoring Formula

```
Risk Score = 
  (high_risk_clause_count × 15) +
  (average_severity × 5) +
  (missing_critical_clause_count × 10) +
  (unbalanced_obligations_penalty × 5)
```

Capped at 100. Categories: 0–30 = Low, 31–60 = Medium, 61–100 = High.

---

## License

MIT License. LexAudit is not a substitute for professional legal advice.
