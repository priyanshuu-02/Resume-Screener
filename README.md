# Lucent — Smart AI Resume Screener & Intelligence Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-forestgreen.svg)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-orange.svg)](https://ai.google.dev/)

An enterprise-grade, user-isolated AI resume screening and intelligence platform built with **React (Vite)**, **Node.js (Express)**, **MongoDB Atlas**, and **Google Gemini 1.5/3.6 Flash**. 

Upload candidate resumes (PDF/DOCX/TXT), analyze fit against job descriptions, generate real-time actionable recommendations, and export styled PDF resumes.

---

## 🌟 Key Features

- **🔐 Google OAuth 2.0 & Local Authentication**: Authenticate via Google OAuth 2.0 or email/password JWT sessions.
- **🛡️ User-Based Data Persistence & Isolation**: All uploaded resumes, jobs, and intelligence screenings are strictly scoped and isolated to each logged-in user.
- **⚡ Automatic Gemini Multi-Key Rotation**: Built-in API key pool rotation with automatic failover to backup keys when quota limits (429/403) are hit.
- **📊 Real-time AI Intelligence Analysis**: Deep resume scoring (1–10), matched/missing keywords, experience assessment, and actionable improvements.
- **📄 Interactive Resume Studio & PDF Generator**: Live rendering of candidate resumes with instant suggestion fixes and downloadable styled PDF export.
- **🔍 OCR & Multi-Format Parsing**: Supports native text extraction and Tesseract OCR fallback for scanned image PDFs, DOCX, and TXT files.

---

## 🏗️ System Architecture

```
                               ┌───────────────────────────┐
                               │ React + Vite Frontend UI  │
                               │  (Lucent Glassmorphism)   │
                               └─────────────┬─────────────┘
                                             │ HTTP / REST (JWT Auth)
                                             ▼
                               ┌───────────────────────────┐
                               │  Node.js / Express API    │
                               └──────┬─────────────┬──────┘
                                      │             │
                    ┌─────────────────┘             └─────────────────┐
                    ▼                                                 ▼
     ┌────────────────────────────┐                    ┌────────────────────────────┐
     │   MongoDB Atlas Database   │                    │  Google Gemini LLM Engine  │
     │  (User-Scoped Collections) │                    │  (Multi-Key Rotation Pool) │
     ├────────────────────────────┤                    ├────────────────────────────┤
     │ • users                    │                    │ • Extraction Prompt        │
     │ • resumes  (userId scoped) │                    │ • Scoring Prompt           │
     │ • jobs     (userId scoped) │                    │ • Intelligence Prompt      │
     │ • screenings               │                    └────────────────────────────┘
     └────────────────────────────┘
```

---

## 🧠 How the LLM Engine Works

### No GPU Required — Hosted Gemini API
This project leverages Google's Gemini API for zero-latency structured text parsing, candidate scoring, and intelligence generation.

Three distinct LLM prompts power the pipeline:

### 1. Text Extraction & JSON Formatting
**Whisperer LLM API** extracts raw plain text from the uploaded resume file (PDF/DOCX/TXT). That raw text is then passed to **Google Gemini**, which formats it into a structured JSON object for use in the downstream scoring and analysis prompts.

### 2. Candidate Match & Scoring Prompt
Compares parsed resume structured data against the employer's Job Description:
```
You are an expert technical recruiter. Rate the candidate's fit for the job description on a 1–10 scale.
Return ONLY valid JSON:
{
  "score": <1-10>,
  "justification": "<2-3 concise sentences>",
  "matching_skills": [...],
  "missing_skills": [...]
}

Job Description: {jobDescription}
Candidate Resume: {parsedData}
```

### 3. Deep Intelligence Analysis Prompt
Powers the interactive resume studio on the frontend:
```
Perform a detailed intelligence analysis comparing the resume and job description.
Identify matched keywords, missing keywords, experience alignment, project relevance, and actionable bullet-point fixes.
Return ONLY valid JSON formatted for the Lucent Resume Studio UI.
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or MongoDB Atlas Connection URI)
- **Google Gemini API Key(s)** (from [Google AI Studio](https://aistudio.google.com/))

### 2. Clone the Repository
```bash
git clone https://github.com/priyanshuu-02/Smart-Resume-Screener.git
cd Smart-Resume-Screener
```

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
```
Fill out `backend/.env` with your credentials:
```env
# Gemini API Key Pool (Supports multiple keys for auto-fallback)
GEMINI_API_KEY_1=your_primary_gemini_api_key
GEMINI_API_KEY_2=your_secondary_gemini_api_key

# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/lucent_resumer_screener?retryWrites=true&w=majority

# App & Authentication Config
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key_that_is_long_and_random
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
UNSTRACT_API_KEY=your_unstract_api_key
```

Install backend dependencies and run the dev server:
```bash
npm install
npm run dev
# Server running on http://localhost:5000
```

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
# Application running on http://localhost:5173
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new email/password account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue JWT |
| `POST` | `/api/v1/auth/google` | Public | Google OAuth 2.0 credential sign-in |
| `POST` | `/api/resumes/upload` | Bearer Token | Upload & parse single/multiple resumes |
| `GET` | `/api/resumes` | Bearer Token | List all user-owned resumes |
| `GET` | `/api/resumes/:id` | Bearer Token | Get specific user resume details |
| `DELETE` | `/api/resumes/:id` | Bearer Token | Delete candidate resume |
| `POST` | `/api/jobs` | Bearer Token | Create job description |
| `GET` | `/api/jobs` | Bearer Token | List user-owned job descriptions |
| `POST` | `/api/screen` | Bearer Token | Run AI candidate screening |
| `GET` | `/api/screen/results/:jobId` | Bearer Token | Fetch ranked candidate screenings |
| `POST` | `/api/analyze/upload` | Bearer Token | Full upload + instant AI intelligence analysis |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
