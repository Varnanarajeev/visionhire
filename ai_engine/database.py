import sqlite3
import json
import logging
import os
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Use absolute path so it always resolves correctly regardless of where uvicorn is launched
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "interview_sessions.db")

def init_db():
    """Initialize the SQLite database with required tables."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'candidate',
                is_banned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id INTEGER,
                history TEXT DEFAULT '',
                context TEXT DEFAULT '',
                job_description TEXT DEFAULT '',
                round_type TEXT DEFAULT 'technical',
                question_count INTEGER DEFAULT 0,
                max_questions INTEGER DEFAULT 15,
                final_score INTEGER DEFAULT NULL,
                verdict TEXT DEFAULT NULL,
                report_json TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event TEXT NOT NULL,
                email TEXT,
                detail TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interview_invites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invite_code TEXT UNIQUE NOT NULL,
                recruiter_id INTEGER NOT NULL,
                candidate_email TEXT DEFAULT '',
                job_description TEXT DEFAULT '',
                round_type TEXT DEFAULT 'technical',
                duration_secs INTEGER DEFAULT 300,
                difficulty TEXT DEFAULT 'mid',
                focus_areas TEXT DEFAULT '',
                custom_instructions TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                session_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                FOREIGN KEY(recruiter_id) REFERENCES users(id),
                FOREIGN KEY(session_id) REFERENCES sessions(session_id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS saved_jds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recruiter_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(recruiter_id) REFERENCES users(id)
            )
        """)

        # Insert default settings if not present
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('max_questions', '15')")
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('announcement', '')")
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('admin_emails', 'admin@visionhire.com')")

        # Migrate existing users table columns if missing
        for col, typedef in [
            ("is_banned", "INTEGER DEFAULT 0"),
            ("role", "TEXT DEFAULT 'candidate'"),
        ]:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
            except Exception:
                pass

        # Migrate sessions table columns if missing
        for col, typedef in [
            ("final_score", "INTEGER DEFAULT NULL"),
            ("verdict", "TEXT DEFAULT NULL"),
            ("report_json", "TEXT DEFAULT NULL"),
            ("job_description", "TEXT DEFAULT ''"),
            ("round_type", "TEXT DEFAULT 'technical'"),
        ]:
            try:
                cursor.execute(f"ALTER TABLE sessions ADD COLUMN {col} {typedef}")
            except Exception:
                pass

        conn.commit()
        conn.close()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

# --- Session CRUD ---

def get_score_percentile(score: int) -> float:
    """Returns what percentage of completed sessions scored below the given score."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sessions WHERE final_score IS NOT NULL")
        total = cursor.fetchone()[0]
        if total == 0:
            conn.close()
            return 50.0
        cursor.execute("SELECT COUNT(*) FROM sessions WHERE final_score IS NOT NULL AND final_score < ?", (score,))
        below = cursor.fetchone()[0]
        conn.close()
        return round((below / total) * 100, 1)
    except Exception:
        return 50.0

def get_session(session_id: str) -> Optional[Dict]:
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {e}")
        return None

def create_session(session_id: str, max_questions: int = 3, user_id: int = None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Use setting if available
        setting = get_setting("max_questions")
        if setting:
            max_questions = int(setting)
        # Use REPLACE so stale sessions with same ID get reset
        cursor.execute(
            "INSERT OR REPLACE INTO sessions (session_id, max_questions, user_id, history, context, question_count) VALUES (?, ?, ?, '', '', 0)",
            (session_id, max_questions, user_id)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to create session {session_id}: {e}")


def update_session(session_id: str, updates: Dict):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        fields = []
        values = []
        for key, value in updates.items():
            fields.append(f"{key} = ?")
            values.append(value)
        if not fields:
            return
        values.append(session_id)
        query = f"UPDATE sessions SET {', '.join(fields)} WHERE session_id = ?"
        cursor.execute(query, tuple(values))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to update session {session_id}: {e}")

def reset_session(session_id: str):
    """Clear a session's history and reset question count."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE sessions SET history='', question_count=0, final_score=NULL, verdict=NULL, report_json=NULL WHERE session_id=?",
            (session_id,)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to reset session {session_id}: {e}")

# --- User CRUD ---

def create_user(email, password_hash, full_name, role='candidate'):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
            (email, password_hash, full_name, role)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        return None
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        return None

def get_user_by_email(email):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to get user: {e}")
        return None

def delete_user(user_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {e}")
        return False

def set_user_banned(user_id: int, banned: bool):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET is_banned = ? WHERE id = ?", (1 if banned else 0, user_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Failed to ban/unban user {user_id}: {e}")
        return False

def update_session_user(session_id, user_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE sessions SET user_id = ? WHERE session_id = ?", (user_id, session_id))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to link session to user: {e}")

# --- Settings ---

def get_setting(key: str) -> Optional[str]:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        row = cursor.execute("SELECT value FROM app_settings WHERE key = ?", (key,)).fetchone()
        conn.close()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to get setting {key}: {e}")
        return None

def set_setting(key: str, value: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to set setting {key}: {e}")

# --- Audit Log ---

def log_event(event: str, email: str = None, detail: str = None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO audit_log (event, email, detail) VALUES (?, ?, ?)",
            (event, email, detail)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to log event: {e}")

def get_audit_log(limit: int = 50):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to get audit log: {e}")
        return []

# --- Admin Queries ---

def get_all_users():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.full_name, u.is_banned, u.created_at,
                   COUNT(s.session_id) as session_count
            FROM users u
            LEFT JOIN sessions s ON s.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to get all users: {e}")
        return []

def get_all_sessions():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.session_id, s.question_count, s.max_questions,
                   s.created_at, s.final_score, s.verdict,
                   u.email as user_email, u.full_name
            FROM sessions s
            LEFT JOIN users u ON u.id = s.user_id
            ORDER BY s.created_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to get all sessions: {e}")
        return []

def get_session_report(session_id: str) -> Optional[str]:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        row = cursor.execute("SELECT report_json FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
        conn.close()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to get session report: {e}")
        return None

def get_admin_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        total_users = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        total_sessions = cursor.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        completed_sessions = cursor.execute(
            "SELECT COUNT(*) FROM sessions WHERE question_count >= max_questions"
        ).fetchone()[0]
        banned_users = cursor.execute("SELECT COUNT(*) FROM users WHERE is_banned=1").fetchone()[0]
        avg_score = cursor.execute("SELECT AVG(final_score) FROM sessions WHERE final_score IS NOT NULL").fetchone()[0]

        # Verdict breakdown
        verdict_rows = cursor.execute(
            "SELECT verdict, COUNT(*) as cnt FROM sessions WHERE verdict IS NOT NULL GROUP BY verdict"
        ).fetchall()
        verdict_breakdown = {r[0]: r[1] for r in verdict_rows}

        # Score distribution (buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
        score_dist = {}
        for low, high in [(0,20),(21,40),(41,60),(61,80),(81,100)]:
            cnt = cursor.execute(
                "SELECT COUNT(*) FROM sessions WHERE final_score >= ? AND final_score <= ?", (low, high)
            ).fetchone()[0]
            score_dist[f"{low}-{high}"] = cnt

        # Daily signups (last 7 days)
        daily_signups = cursor.execute("""
            SELECT DATE(created_at) as day, COUNT(*) as cnt
            FROM users
            WHERE created_at >= DATE('now', '-7 days')
            GROUP BY day ORDER BY day
        """).fetchall()

        conn.close()
        return {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "banned_users": banned_users,
            "avg_score": round(avg_score, 1) if avg_score else None,
            "verdict_breakdown": verdict_breakdown,
            "score_distribution": score_dist,
            "daily_signups": [{"day": r[0], "count": r[1]} for r in daily_signups],
        }
    except Exception as e:
        logger.error(f"Failed to get admin stats: {e}")
        return {}

# --- Recruiter: Interview Invites ---

def create_invite(recruiter_id, invite_code, job_description='', round_type='technical',
                  duration_secs=300, difficulty='mid', focus_areas='',
                  custom_instructions='', candidate_email='', expires_at=None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO interview_invites
            (invite_code, recruiter_id, candidate_email, job_description, round_type,
             duration_secs, difficulty, focus_areas, custom_instructions, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (invite_code, recruiter_id, candidate_email, job_description, round_type,
              duration_secs, difficulty, focus_areas, custom_instructions, expires_at))
        conn.commit()
        invite_id = cursor.lastrowid
        conn.close()
        return invite_id
    except Exception as e:
        logger.error(f"Failed to create invite: {e}")
        return None

def get_invite_by_code(invite_code: str) -> Optional[Dict]:
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM interview_invites WHERE invite_code = ?", (invite_code,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to get invite: {e}")
        return None

def get_invite_by_session_id(session_id: str) -> Optional[Dict]:
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM interview_invites WHERE session_id = ?", (session_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Failed to get invite by session: {e}")
        return None

def update_invite(invite_code: str, updates: Dict):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        fields = [f"{k} = ?" for k in updates.keys()]
        values = list(updates.values()) + [invite_code]
        cursor.execute(f"UPDATE interview_invites SET {', '.join(fields)} WHERE invite_code = ?", values)
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to update invite: {e}")

def get_recruiter_invites(recruiter_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT i.*, s.final_score, s.verdict, s.report_json
            FROM interview_invites i
            LEFT JOIN sessions s ON s.session_id = i.session_id
            WHERE i.recruiter_id = ?
            ORDER BY i.created_at DESC
        """, (recruiter_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to get recruiter invites: {e}")
        return []

def get_recruiter_stats(recruiter_id: int):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        total = cursor.execute("SELECT COUNT(*) FROM interview_invites WHERE recruiter_id = ?", (recruiter_id,)).fetchone()[0]
        completed = cursor.execute("SELECT COUNT(*) FROM interview_invites WHERE recruiter_id = ? AND status = 'completed'", (recruiter_id,)).fetchone()[0]
        pending = cursor.execute("SELECT COUNT(*) FROM interview_invites WHERE recruiter_id = ? AND status = 'pending'", (recruiter_id,)).fetchone()[0]
        avg = cursor.execute("""
            SELECT AVG(s.final_score) FROM interview_invites i
            JOIN sessions s ON s.session_id = i.session_id
            WHERE i.recruiter_id = ? AND s.final_score IS NOT NULL
        """, (recruiter_id,)).fetchone()[0]
        conn.close()
        return {
            "total_invites": total,
            "completed": completed,
            "pending": pending,
            "avg_score": round(avg, 1) if avg else None
        }
    except Exception as e:
        logger.error(f"Failed to get recruiter stats: {e}")
        return {}

# --- Recruiter: Saved JDs ---

def create_saved_jd(recruiter_id, title, content):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO saved_jds (recruiter_id, title, content) VALUES (?, ?, ?)",
                       (recruiter_id, title, content))
        conn.commit()
        jd_id = cursor.lastrowid
        conn.close()
        return jd_id
    except Exception as e:
        logger.error(f"Failed to save JD: {e}")
        return None

def get_saved_jds(recruiter_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM saved_jds WHERE recruiter_id = ? ORDER BY created_at DESC", (recruiter_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to get saved JDs: {e}")
        return []

def delete_saved_jd(jd_id, recruiter_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_jds WHERE id = ? AND recruiter_id = ?", (jd_id, recruiter_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Failed to delete JD: {e}")
        return False
