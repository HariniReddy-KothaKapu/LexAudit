# LexAudit – AI-Powered Contract Intelligence Platform

## Overview

LexAudit is an AI-powered contract intelligence platform that helps individuals, startups, freelancers, and businesses understand legal agreements before signing them.

Legal contracts are often lengthy, complex, and difficult to interpret without legal expertise. Important clauses related to liability, confidentiality, intellectual property, termination rights, compliance obligations, and dispute resolution are frequently overlooked, exposing users to legal and financial risks.

LexAudit simplifies contract review by automatically extracting clauses, identifying risks, detecting missing protections, generating executive summaries, comparing agreements, and producing downloadable PDF reports. The platform transforms complex legal language into actionable insights, enabling faster and more informed decision-making.

---

## Key Features

### Contract Analysis

* Upload PDF and DOCX contracts
* Automated text extraction and processing
* AI-powered clause identification and classification
* Executive summary generation
* Missing clause detection
* Risk assessment and recommendations

### Risk Intelligence

* Custom risk scoring engine (0–100)
* Clause-level severity analysis
* Missing protection detection
* Risk categorization (Low, Medium, High)
* Contract health assessment

### Contract Comparison

* Side-by-side comparison of two agreements
* Clause-level difference identification
* AI-generated comparison summary
* Change impact analysis

### Reporting

* Downloadable PDF analysis reports
* Executive summaries
* Risk breakdown reports
* Comparison reports

### Dashboard & History

* Analysis statistics
* Risk distribution charts
* Recent activity tracking
* Search and filter analysis history
* Historical contract management

### User Management

* Secure authentication
* User profiles
* Account management
* Personalized contract history

---

## Tech Stack

| Layer              | Technology              |
| ------------------ | ----------------------- |
| Frontend           | React 18 + Vite         |
| Styling            | Tailwind CSS            |
| Routing            | React Router DOM        |
| API Communication  | Axios                   |
| Charts & Analytics | Recharts                |
| File Upload        | React Dropzone          |
| Backend            | Node.js + Express.js    |
| Database           | MongoDB Atlas           |
| ODM                | Mongoose                |
| Authentication     | JWT + bcryptjs          |
| PDF Parsing        | pdf-parse               |
| DOCX Parsing       | mammoth                 |
| AI Engine          | Google Gemini 2.5 Flash |
| PDF Generation     | jsPDF + jspdf-autotable |
| Deployment         | Vercel + Render         |

---

## Project Structure

```text
LexAudit/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Setup Instructions

### Prerequisites

* Node.js 18+
* MongoDB Atlas Account
* Google Gemini API Key

---

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Run the backend:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend

| Variable       | Purpose                         |
| -------------- | ------------------------------- |
| PORT           | Backend server port             |
| MONGODB_URI    | MongoDB Atlas connection string |
| JWT_SECRET     | JWT signing secret              |
| JWT_EXPIRES_IN | Token expiry duration           |
| GEMINI_API_KEY | Gemini API key                  |
| CLIENT_URL     | Frontend URL                    |
| NODE_ENV       | Development/Production          |

### Frontend

| Variable     | Purpose         |
| ------------ | --------------- |
| VITE_API_URL | Backend API URL |

---

## API Modules

### Authentication

* User Registration
* User Login
* JWT Authentication
* Profile Management

### Contract Management

* Upload Contract
* Analyze Contract
* Retrieve Contract Details
* View Analysis History
* Delete Contract

### Contract Comparison

* Compare Two Agreements
* Generate Difference Summary
* Produce Comparison Reports

---

## Risk Scoring Engine

LexAudit uses a custom contract risk assessment engine that combines:

* Average clause severity
* High-risk clause count
* Missing critical clauses
* Contract imbalance indicators

The final score is normalized to a 0–100 scale and categorized into:

| Score Range | Risk Level  |
| ----------- | ----------- |
| 0–30        | Low Risk    |
| 31–60       | Medium Risk |
| 61–100      | High Risk   |

---

## Deployment

### Frontend

Hosted on Vercel.

### Backend

Hosted on Render.

### Database

MongoDB Atlas.

---

## Sample Workflow

1. User uploads a contract (PDF/DOCX).
2. Text extraction engine processes the document.
3. Contract content is sent to Gemini AI.
4. Clauses are identified and categorized.
5. Risk scoring engine calculates overall risk.
6. Missing protections are detected.
7. Executive summary is generated.
8. Results are stored in MongoDB.
9. Dashboard and reports are generated.
10. User downloads a PDF report if required.

---

## Why LexAudit?

LexAudit delivers significantly more value than uploading a contract directly into a general-purpose AI chatbot.

The platform combines:

* Structured contract analysis workflows
* Contract-specific clause detection
* Missing clause identification
* Custom risk scoring logic
* Contract comparison capabilities
* Executive reporting
* Historical analysis tracking
* Downloadable PDF reports

Instead of producing only a generic summary, LexAudit generates actionable legal intelligence through domain-specific processing, risk assessment, workflow automation, and decision-support mechanisms designed specifically for contract review.

---

## Future Enhancements

* Multi-jurisdiction legal frameworks
* Regulatory compliance validation
* Legal precedent integration
* Team collaboration workflows
* Advanced retrieval-augmented legal research

---

## Disclaimer

LexAudit is designed to assist users in understanding contracts and identifying potential risks. The platform does not constitute legal advice and should not replace consultation with qualified legal professionals for critical legal decisions.

---

## Mock Data

The repository includes sample contracts under the `mock-data/` directory that were created exclusively for testing and demonstration purposes.

Example file:
- smaple_data/sample_employee_data.pdf

These sample agreements were used to validate:
- Contract text extraction
- Clause detection and classification
- Risk scoring logic
- Missing clause identification
- Executive summary generation
- Contract comparison workflows
- PDF report generation

##Author
KOTHA KAPU HARINI REDDY
