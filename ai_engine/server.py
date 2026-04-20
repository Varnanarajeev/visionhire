from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
import csv
import io
import json
import uuid
import re

from .engine import InterviewEngine
from . import database
from . import auth

import uvicorn
import fitz
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = InterviewEngine()

# --- Models ---
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = 'candidate'

class Token(BaseModel):
    access_token: str
    token_type: str

class StartRequest(BaseModel):
    session_id: str

class SettingsRequest(BaseModel):
    max_questions: Optional[int] = None
    announcement: Optional[str] = None
    admin_emails: Optional[str] = None

class CreateInviteRequest(BaseModel):
    job_description: str = ''
    round_type: str = 'technical'
    duration_secs: int = 300
    focus_areas: str = ''
    custom_instructions: str = ''
    candidate_email: str = ''

class SaveJDRequest(BaseModel):
    title: str
    content: str

# --- Admin email check (dynamic from DB) ---
def get_admin_emails():
    raw = database.get_setting("admin_emails") or "admin@visionhire.com"
    return {e.strip() for e in raw.split(",")}

def require_admin(current_user: str = Depends(auth.get_current_user)):
    if current_user not in get_admin_emails():
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_recruiter(current_user: str = Depends(auth.get_current_user)):
    user = database.get_user_by_email(current_user)
    if not user or user.get('role') not in ('recruiter', 'admin'):
        raise HTTPException(status_code=403, detail="Recruiter access required")
    return current_user

# --- Auth Endpoints ---

@app.post("/auth/register")
async def register(req: RegisterRequest):
    existing = database.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    role = req.role if req.role in ('candidate', 'recruiter', 'admin') else 'candidate'
    pwd_hash = auth.get_password_hash(req.password)
    user_id = database.create_user(req.email, pwd_hash, req.full_name, role=role)
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    database.log_event("register", req.email, f"New {role}: {req.full_name}")
    return {"message": "User created successfully", "user_id": user_id, "role": role}

@app.post("/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = database.get_user_by_email(form_data.username)
    if not user or not auth.verify_password(form_data.password, user['password_hash']):
        database.log_event("login_failed", form_data.username, "Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.get("is_banned"):
        database.log_event("login_blocked", form_data.username, "Banned user attempted login")
        raise HTTPException(status_code=403, detail="Account has been suspended. Contact admin.")

    database.log_event("login", form_data.username)
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.get('role', 'candidate')}

# --- Public settings (for banner) ---
@app.get("/settings/public")
async def public_settings():
    return {
        "announcement": database.get_setting("announcement") or "",
        "max_questions": int(database.get_setting("max_questions") or 3),
    }

# --- Interview Endpoints ---

@app.post("/resume/upload")
async def upload_resume(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    job_description: str = Form(""),
    round_type: str = Form("technical"),
    current_user: str = Depends(auth.get_current_user)
):
    try:
        user = database.get_user_by_email(current_user)
        user_id = user['id'] if user else None
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        if not text.strip():
            return {"error": "Could not extract text from PDF"}
        existing_session = database.get_session(session_id)
        if not existing_session:
            database.create_session(session_id, user_id=user_id)
        else:
            database.update_session_user(session_id, user_id)
        result = engine.load_resume_text(session_id, text)
        # Always update job description (clears old JD if current is empty)
        database.update_session(session_id, {"job_description": job_description.strip()})
        if round_type in ("technical", "hr", "behavioral"):
            database.update_session(session_id, {"round_type": round_type})
        return result
    except Exception as e:
        logger.error(f"Resume upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/interview/start")
async def start_interview(
    req: StartRequest,
    current_user: str = Depends(auth.get_current_user)
):
    user = database.get_user_by_email(current_user)
    user_id = user['id'] if user else None
    existing = database.get_session(req.session_id)
    if not existing:
        database.create_session(req.session_id, user_id=user_id)
    return engine.start_session(req.session_id)

@app.post("/interview/process")
async def process_turn(
    session_id: str = Form(...),
    audio: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    current_user: str = Depends(auth.get_current_user)
):
    audio_bytes = None
    if audio:
        audio_bytes = await audio.read()
    result = engine.process_turn(session_id, user_audio_bytes=audio_bytes, user_text=text)
    return result

@app.post("/interview/end")
async def end_interview(
    req: StartRequest,
    current_user: str = Depends(auth.get_current_user)
):
    report_json = engine.generate_report(req.session_id)
    # Parse & persist score+verdict to DB
    try:
        clean = report_json.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        final_score = data.get("resume_score") or data.get("technical_score") or 0
        verdict = data.get("verdict", "Unknown")
        database.update_session(req.session_id, {
            "final_score": final_score,
            "verdict": verdict,
            "report_json": clean,
        })
        
        # If this session belongs to an invite, mark the invite as completed
        invite = database.get_invite_by_session_id(req.session_id)
        if invite:
            database.update_invite(invite['invite_code'], {
                "status": "completed"
            })
    except Exception as e:
        logger.warning(f"Could not persist report to DB: {e}")
    return {"report": report_json}

@app.get("/interview/percentile")
async def get_percentile(score: int, current_user: str = Depends(auth.get_current_user)):
    pct = database.get_score_percentile(score)
    return {"percentile": pct, "score": score}

# ───────────────────────────────────────────
# ADMIN ENDPOINTS
# ───────────────────────────────────────────

@app.get("/admin/stats")
async def admin_stats(admin: str = Depends(require_admin)):
    return database.get_admin_stats()

@app.get("/admin/users")
async def admin_users(admin: str = Depends(require_admin)):
    return database.get_all_users()

@app.get("/admin/sessions")
async def admin_sessions(admin: str = Depends(require_admin)):
    return database.get_all_sessions()

@app.get("/admin/audit-log")
async def admin_audit_log(admin: str = Depends(require_admin)):
    return database.get_audit_log(limit=100)

@app.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: int, admin: str = Depends(require_admin)):
    success = database.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    database.log_event("admin_delete_user", admin, f"Deleted user_id={user_id}")
    return {"message": "User deleted"}

@app.post("/admin/users/{user_id}/ban")
async def admin_ban_user(user_id: int, admin: str = Depends(require_admin)):
    database.set_user_banned(user_id, True)
    database.log_event("admin_ban", admin, f"Banned user_id={user_id}")
    return {"message": "User banned"}

@app.post("/admin/users/{user_id}/unban")
async def admin_unban_user(user_id: int, admin: str = Depends(require_admin)):
    database.set_user_banned(user_id, False)
    database.log_event("admin_unban", admin, f"Unbanned user_id={user_id}")
    return {"message": "User unbanned"}

@app.get("/admin/sessions/{session_id}/report")
async def admin_get_report(session_id: str, admin: str = Depends(require_admin)):
    report = database.get_session_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="No report found for this session")
    return {"report": report}

@app.post("/admin/sessions/{session_id}/reset")
async def admin_reset_session(session_id: str, admin: str = Depends(require_admin)):
    database.reset_session(session_id)
    database.log_event("admin_reset_session", admin, f"Reset session={session_id}")
    return {"message": "Session reset"}

@app.get("/admin/export/csv")
async def admin_export_csv(admin: str = Depends(require_admin)):
    users = database.get_all_users()
    sessions = database.get_all_sessions()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Type", "ID/SessionID", "Email", "Name", "Sessions/Score", "Verdict", "Created At", "Banned"])
    for u in users:
        writer.writerow(["user", u["id"], u["email"], u.get("full_name",""), u["session_count"], "", u["created_at"], u.get("is_banned",0)])
    for s in sessions:
        writer.writerow(["session", s["session_id"], s.get("user_email",""), s.get("full_name",""), s.get("final_score",""), s.get("verdict",""), s["created_at"], ""])
    database.log_event("admin_export_csv", admin)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=visionhire_export.csv"}
    )

@app.post("/admin/settings")
async def admin_update_settings(req: SettingsRequest, admin: str = Depends(require_admin)):
    if req.max_questions is not None:
        database.set_setting("max_questions", str(req.max_questions))
    if req.announcement is not None:
        database.set_setting("announcement", req.announcement)
    if req.admin_emails is not None:
        database.set_setting("admin_emails", req.admin_emails)
    database.log_event("admin_settings_update", admin, str(req.dict()))
    return {"message": "Settings updated"}

@app.get("/admin/settings")
async def admin_get_settings(admin: str = Depends(require_admin)):
    return {
        "max_questions": int(database.get_setting("max_questions") or 3),
        "announcement": database.get_setting("announcement") or "",
        "admin_emails": database.get_setting("admin_emails") or "admin@visionhire.com",
    }

# ── Recruiter Endpoints ──────────────────────

def _detect_difficulty(jd_text: str) -> str:
    """Auto-detect difficulty level from JD content."""
    jd_lower = jd_text.lower()
    senior_keywords = ['senior', 'lead', 'principal', 'architect', 'staff', 'director', 'manager', '5+ years', '7+ years', '10+ years']
    junior_keywords = ['junior', 'intern', 'entry', 'fresher', 'graduate', 'trainee', '0-1 year', '0-2 years']
    if any(k in jd_lower for k in senior_keywords):
        return 'senior'
    if any(k in jd_lower for k in junior_keywords):
        return 'junior'
    return 'mid'

@app.post("/recruiter/invite")
async def create_interview_invite(req: CreateInviteRequest, current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    invite_code = uuid.uuid4().hex[:8]
    difficulty = _detect_difficulty(req.job_description)
    invite_id = database.create_invite(
        recruiter_id=user['id'],
        invite_code=invite_code,
        job_description=req.job_description,
        round_type=req.round_type,
        duration_secs=req.duration_secs,
        difficulty=difficulty,
        focus_areas=req.focus_areas,
        custom_instructions=req.custom_instructions,
        candidate_email=req.candidate_email,
    )
    if not invite_id:
        raise HTTPException(status_code=500, detail="Failed to create invite")
    database.log_event("invite_created", current_user, f"Invite {invite_code} created")
    return {
        "invite_code": invite_code,
        "invite_id": invite_id,
        "difficulty": difficulty,
        "link": f"/invite/{invite_code}"
    }

@app.get("/recruiter/invites")
async def list_recruiter_invites(current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    invites = database.get_recruiter_invites(user['id'])
    # Strip large fields for list view
    for inv in invites:
        inv.pop('report_json', None)
        inv.pop('job_description', None)
    return invites

@app.get("/recruiter/invite/{code}")
async def get_invite_details(code: str):
    """Public endpoint — candidate sees invite config."""
    invite = database.get_invite_by_code(code)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite['status'] == 'completed':
        raise HTTPException(status_code=400, detail="This interview has already been completed")
    return {
        "invite_code": invite['invite_code'],
        "round_type": invite['round_type'],
        "duration_secs": invite['duration_secs'],
        "difficulty": invite['difficulty'],
        "focus_areas": invite['focus_areas'],
        "has_jd": bool(invite['job_description'].strip()),
        "status": invite['status'],
    }

@app.get("/recruiter/invite/{code}/report")
async def get_invite_report(code: str, current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    invite = database.get_invite_by_code(code)
    if not invite or invite['recruiter_id'] != user['id']:
        raise HTTPException(status_code=404, detail="Invite not found")
    if not invite['session_id']:
        raise HTTPException(status_code=400, detail="Interview not yet taken")
    report = database.get_session_report(invite['session_id'])
    return {"report": report, "invite": invite}

@app.get("/recruiter/stats")
async def recruiter_stats(current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    return database.get_recruiter_stats(user['id'])

@app.post("/recruiter/jds")
async def save_jd(req: SaveJDRequest, current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    jd_id = database.create_saved_jd(user['id'], req.title, req.content)
    if not jd_id:
        raise HTTPException(status_code=500, detail="Failed to save JD")
    return {"id": jd_id, "message": "JD saved"}

@app.get("/recruiter/jds")
async def list_saved_jds(current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    return database.get_saved_jds(user['id'])

@app.delete("/recruiter/jds/{jd_id}")
async def delete_jd(jd_id: int, current_user: str = Depends(require_recruiter)):
    user = database.get_user_by_email(current_user)
    success = database.delete_saved_jd(jd_id, user['id'])
    if not success:
        raise HTTPException(status_code=404, detail="JD not found")
    return {"message": "JD deleted"}

# ── User Info ─────────────────────────────────
@app.get("/auth/me")
async def get_me(current_user: str = Depends(auth.get_current_user)):
    user = database.get_user_by_email(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user['id'],
        "email": user['email'],
        "full_name": user['full_name'],
        "role": user.get('role', 'candidate'),
    }

# ── Invite-based Resume Upload ────────────────
@app.post("/invite/{code}/upload")
async def invite_upload_resume(
    code: str,
    file: UploadFile = File(...),
    current_user: str = Depends(auth.get_current_user)
):
    """Candidate uploads resume for an invite-based interview."""
    invite = database.get_invite_by_code(code)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite['status'] == 'completed':
        raise HTTPException(status_code=400, detail="This interview has already been completed")

    user = database.get_user_by_email(current_user)
    user_id = user['id'] if user else None

    # Parse PDF
    content = await file.read()
    doc = fitz.open(stream=content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    if not text.strip():
        return {"error": "Could not extract text from PDF"}

    # Create session linked to invite
    session_id = f"invite_{code}_{uuid.uuid4().hex[:6]}"
    database.create_session(session_id, user_id=user_id)
    result = engine.load_resume_text(session_id, text)

    # Apply invite config to session
    database.update_session(session_id, {
        "job_description": invite['job_description'],
        "round_type": invite['round_type'],
    })

    # Link session to invite
    database.update_invite(code, {"session_id": session_id, "status": "in_progress"})

    return {
        **result,
        "session_id": session_id,
        "round_type": invite['round_type'],
        "duration_secs": invite['duration_secs'],
        "difficulty": invite['difficulty'],
        "focus_areas": invite['focus_areas'],
        "custom_instructions": invite['custom_instructions'],
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
