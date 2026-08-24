# Smart Resume Screener — Architecture & Plan

## Objective

Intelligently parse resumes, extract structured data, and match candidates against job descriptions using an LLM — then display shortlisted candidates with scores and justifications.

---

## Project Structure

```
smart-resume-screener/
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers (FastAPI routers)
│   │   ├── services/         # Business logic (parsing, scoring)
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── parsers/          # PDF / plain-text extraction
│   │   └── llm/              # LLM prompt templates & scoring logic
│   ├── database/             # SQLite (dev) → PostgreSQL (prod)
│   ├── alembic/              # DB migrations
│   ├── .env.example
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Upload, Dashboard, Resume Detail
│   │   └── api/              # Axios API client
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## Tech Stack

| Layer          | Choice                        | Reason                                              |
|----------------|-------------------------------|-----------------------------------------------------|
| Backend        | Python + FastAPI              | Best LLM ecosystem, async support, fast to build    |
| PDF Parsing    | `pdfplumber` + `python-docx`  | Reliable text extraction from PDF and DOCX files    |
| LLM            | OpenAI GPT-4o (via API)       | Strong semantic reasoning; easy to swap providers   |
| Database       | SQLite (dev) / PostgreSQL     | Simple dev setup, production-ready migration path   |
| ORM            | SQLAlchemy + Alembic          | Clean models, schema migration support              |
| Validation     | Pydantic v2                   | Request/response validation built into FastAPI      |
| Frontend       | React + Tailwind + shadcn/ui  | Clean dashboard UI, fast to build                   |
| File Uploads   | FastAPI `UploadFile`          | Native multipart handling, no extra dependencies    |

---

## Data Flow

```
User uploads Resume(s) [PDF/TXT] + Job Description [text]
        │
        ▼
[PDF Parser Service]
  └─ pdfplumber extracts raw text from each resume
        │
        ▼
[LLM Extraction Service]
  └─ GPT-4o parses raw text → structured JSON
     { name, email, skills[], experience[], education[] }
        │
        ▼
[Database — resumes table]
  └─ Store raw text + parsed JSON + metadata
        │
        ▼
[LLM Scoring Service]
  └─ GPT-4o compares resume JSON vs job description
     Returns: { score (1–10), justification, matching_skills[], missing_skills[] }
        │
        ▼
[Database — screenings table]
  └─ Persist score + justification per resume/job pair
        │
        ▼
[REST API Response]
  └─ Ranked candidate list sorted by score descending
        │
        ▼
[Frontend Dashboard]
  └─ Candidate cards with score badge, justification, skill match/gap tags
```

---

## Database Schema

### `resumes`
| Column       | Type      | Description                        |
|--------------|-----------|------------------------------------|
| id           | UUID / PK | Primary key                        |
| filename     | String    | Original uploaded filename         |
| raw_text     | Text      | Extracted plain text from file     |
| parsed_json  | JSON      | Structured data from LLM extractor |
| uploaded_at  | DateTime  | Timestamp of upload                |

### `jobs`
| Column      | Type      | Description                  |
|-------------|-----------|------------------------------|
| id          | UUID / PK | Primary key                  |
| title       | String    | Job title                    |
| description | Text      | Full job description text    |
| created_at  | DateTime  | Timestamp of creation        |

### `screenings`
| Column          | Type      | Description                          |
|-----------------|-----------|--------------------------------------|
| id              | UUID / PK | Primary key                          |
| resume_id       | FK        | References `resumes.id`              |
| job_id          | FK        | References `jobs.id`                 |
| score           | Integer   | LLM fit score (1–10)                 |
| justification   | Text      | LLM-generated explanation            |
| matching_skills | JSON      | Skills present in both resume & JD   |
| missing_skills  | JSON      | Skills in JD but absent in resume    |
| screened_at     | DateTime  | Timestamp of screening               |

---

## REST API Endpoints

| Method   | Endpoint                   | Description                                      |
|----------|----------------------------|--------------------------------------------------|
| `POST`   | `/api/resumes/upload`      | Upload one or more PDF/text resume files         |
| `GET`    | `/api/resumes`             | List all stored resumes                          |
| `DELETE` | `/api/resumes/{id}`        | Delete a resume by ID                            |
| `POST`   | `/api/jobs`                | Submit a new job description                     |
| `GET`    | `/api/jobs`                | List all jobs                                    |
| `POST`   | `/api/screen`              | Run LLM screening for a job against all resumes  |
| `GET`    | `/api/results/{job_id}`    | Get ranked candidate results for a job           |

---

## LLM Prompt Templates

### Prompt 1 — Structured Data Extraction

Used after raw text is extracted from the resume file.

```
You are a resume parsing assistant. Extract structured information from the resume below
and return ONLY a valid JSON object with the following shape:

{
  "name": "<full name>",
  "email": "<email address>",
  "phone": "<phone number or null>",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    { "title": "<job title>", "company": "<company>", "duration": "<e.g. 2 years>" }
  ],
  "education": [
    { "degree": "<degree>", "institution": "<institution>", "year": "<graduation year>" }
  ],
  "summary": "<brief professional summary if present, else null>"
}

Resume Text:
{raw_text}
```

---

### Prompt 2 — Candidate Scoring & Matching

Used to compare the parsed resume against a job description.

```
You are an expert technical recruiter. Compare the candidate resume with the job description
below and evaluate how well the candidate fits the role.

Return ONLY a valid JSON object with this shape:
{
  "score": <integer 1–10>,
  "justification": "<2–3 sentence explanation of the score>",
  "matching_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill1", "skill2", ...]
}

Scoring guide:
  9–10 → Excellent fit, meets almost all requirements
  7–8  → Good fit, meets most requirements with minor gaps
  5–6  → Partial fit, relevant background but notable gaps
  3–4  → Weak fit, limited alignment with requirements
  1–2  → Poor fit, significant mismatch

Job Description:
{job_description}

Candidate Resume (structured):
{parsed_resume_json}
```

---

## Frontend Pages

### 1. Upload Page (`/`)
- Drag-and-drop zone for multiple PDF/text resumes
- Text area to paste the job description
- Submit button to trigger screening
- Upload progress indicators per file

### 2. Results Dashboard (`/results/:jobId`)
- Ranked list of candidate cards sorted by score (high → low)
- Each card shows:
  - Candidate name + score badge (color-coded: green/yellow/red)
  - Justification text
  - Matching skills (green tags)
  - Missing skills (red tags)
- Filter bar to set minimum score threshold
- Option to export results as CSV

### 3. Resume Detail (`/resume/:id`)
- Full parsed resume data (skills, experience, education)
- Raw extracted text (collapsible)
- All screening results for this candidate across jobs

---

## Build Phases

### Phase 1 — Backend Core
- [ ] FastAPI app scaffold with project structure
- [ ] SQLAlchemy models + Alembic migrations
- [ ] PDF/text parser service (`pdfplumber`, `python-docx`)
- [ ] LLM extraction service (Prompt 1)
- [ ] LLM scoring service (Prompt 2)

### Phase 2 — API Layer
- [ ] All REST endpoints wired up
- [ ] Pydantic schemas for request/response validation
- [ ] Error handling (invalid file type, LLM failures, DB errors)
- [ ] CORS configuration for frontend

### Phase 3 — Frontend
- [ ] React app scaffold with Tailwind + shadcn/ui
- [ ] Upload page with drag-and-drop
- [ ] Results dashboard with candidate cards
- [ ] Resume detail page

### Phase 4 — Polish & Deliverables
- [ ] `.env.example` with all required keys documented
- [ ] Full `README.md` with setup instructions, architecture summary, and LLM prompts
- [ ] Docker Compose for one-command local setup (optional)
- [ ] End-to-end test with sample resumes

---

## Environment Variables

```env
# Backend (.env)
OPENAI_API_KEY=sk-...
DATABASE_URL=sqlite:///./screener.db      # or postgresql://...
ALLOWED_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=10
```

---

## Key Design Decisions

- **LLM returns structured JSON** — both prompts enforce JSON-only output, making parsing deterministic and avoiding brittle regex.
- **Two-step LLM pipeline** — extraction and scoring are separate calls. This keeps prompts focused and makes each step independently debuggable.
- **Score stored in DB** — screening results are persisted so re-fetching the dashboard doesn't re-call the LLM.
- **Provider-agnostic LLM layer** — the LLM service is abstracted behind an interface, making it easy to swap OpenAI for Anthropic, Groq, or a local model.
