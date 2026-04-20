# VisionHire 🧠⚡

> AI-powered interview platform — built by vibing with AI tools, not fighting them.

---

## What is this?

VisionHire is a full-stack AI interview platform where candidates get interviewed by an AI, receive a detailed performance report, and recruiters can send interview links to candidates and track results — all in one place.

Built with **React + FastAPI + Groq LLM** and a lot of late-night energy.

---

## Features

### 👤 Candidate
- Upload your resume → AI reads it
- Get interviewed by an AI voice (asks real contextual questions)
- Receive a full performance report with scores, strengths, and skill recommendations
- Track your progress over multiple sessions

### 🏢 Recruiter
- Create interview links with custom JD, duration, round type
- Save & reuse job descriptions
- Send links to candidates and track who attended
- View detailed AI-generated reports per candidate

### 🛡️ Admin
- View all users, ban/unban accounts
- Manage platform settings
- View audit logs of all actions

---

## Tech Stack

| Layer | Tech |
|:---|:---|
| Frontend | React + TypeScript + Vite |
| Styling | Vanilla CSS (dark glassmorphism design) |
| Backend | FastAPI (Python) |
| AI | Groq LLM (Llama 3) |
| Database | SQLite |
| Auth | JWT (python-jose) |
| Speech | Web Speech API (browser-native) |

---

## Setup

### Backend
```bash
cd ai_engine
pip install -r requirements.txt
python -m uvicorn ai_engine.server:app --port 8000
```

### Frontend
```bash
cd frontend/visionhire-main
npm install
npm run dev
```

### Environment Variables
Create a `.env` file in the root:
```
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_here
```

---

## Demo Credentials

| Role | Email | Password |
|:---|:---|:---|
| Admin | admin@visionhire.com | admin123 |

Register your own candidate/recruiter account on the platform.

---

## Project Structure

```
vision/
├── ai_engine/          # FastAPI backend
│   ├── server.py       # All API routes
│   ├── database.py     # SQLite schema + queries
│   ├── engine.py       # AI interview logic
│   ├── auth.py         # JWT authentication
│   └── prompts.py      # LLM prompt templates
└── frontend/
    └── visionhire-main/
        └── src/
            ├── pages/   # All UI pages
            ├── components/
            └── lib/     # Auth helpers
```

---

## Vibecoded with ❤️

> This project was built using AI-assisted development tools.  
> Every feature was prompted, iterated, and debugged through conversation.  
> That's the future of building — and it works.
