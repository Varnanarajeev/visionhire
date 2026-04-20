import os
import time
import base64
import json
import logging
from groq import Groq
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv

# Import our new prompts module
from .prompts import prompts
# Import database module
from . import database

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class InterviewEngine:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Initialize Database
        database.init_db()
        
        # Load Vector DB
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            # Assuming faiss_index is in the parent directory or relative path
            # We will try absolute path relative to this file's location
            base_dir = os.path.dirname(os.path.abspath(__file__))
            index_path = os.path.join(base_dir, "..", "faiss_index") 
            self.vector_db = FAISS.load_local(index_path, self.embeddings, allow_dangerous_deserialization=True)
            logger.info("FAISS Index loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
            self.vector_db = None

        # self.sessions = {} # REMOVED: Using database now

    def start_session(self, session_id: str):
        """Initializes a new session state — only if it doesn't already exist."""
        existing = database.get_session(session_id)
        if not existing:
            database.create_session(session_id, max_questions=3)
        else:
            # Session already exists (created during resume upload).
            # Just reset question_count and history so it's a fresh interview,
            # but KEEP the context (resume text).
            database.update_session(session_id, {
                "question_count": 0,
                "history": "",
                "final_score": None,
                "verdict": None,
                "report_json": None,
            })
        return {"message": "Session started", "status": "ready"}

    def load_resume_text(self, session_id: str, text: str):
        # Ensure session exists
        if not database.get_session(session_id):
            self.start_session(session_id)
        
        # Get current max_questions from settings
        max_q = int(database.get_setting("max_questions") or 15)
        
        # Always reset history and count when a NEW resume is loaded
        database.update_session(session_id, {
            "context": text,
            "history": "",
            "question_count": 0,
            "max_questions": max_q,
            "final_score": None,
            "verdict": None,
            "report_json": None
        })
        return {"message": "Resume loaded & session reset", "chars": len(text)}
        
    def _get_resume_context(self):
        if not self.vector_db:
            return "No resume context available."
        try:
            # Query relevant to general technical experience to start
            docs = self.vector_db.similarity_search("Technical experience and skills", k=3)
            return "\n".join([d.page_content for d in docs])
        except Exception as e:
            logger.error(f"Error searching vector db: {e}")
            return ""

    def process_turn(self, session_id: str, user_audio_bytes: bytes = None, user_text: str = None):
        """
        1. Transcribe audio (if provided)
        2. Update history
        3. Generate AI response
        4. Synthesize audio
        5. Return response
        """
        session = database.get_session(session_id)
        if not session:
            # Auto-create if missing (resilience)
            self.start_session(session_id)
            session = database.get_session(session_id)

        # 1. Get User Input
        user_input = ""
        if user_audio_bytes:
            user_input = self._transcribe_audio(user_audio_bytes)
        elif user_text:
            user_input = user_text
        else:
            # First turn logic: if no input, assume it's the start
            if session["question_count"] == 0:
                user_input = "Hello, I am ready for the interview."
            else:
                return {"error": "No input provided"}

        logger.info(f"User Input: {user_input}")

        # 2. Add to history
        # (We append the user's input to history, but we also modify the 'current_user_input' for formatting)
        
        # 3. Generate Response
        prompt = prompts.get_interview_prompt()
        round_type = session.get("round_type", "technical") or "technical"
        final_prompt = prompt.format(
            context=session["context"],
            job_description=session.get("job_description", "") or "Not provided",
            history=session["history"],
            question=user_input,
            round_type=round_type
        )

        response_text = self._query_llm(final_prompt)
        logger.info(f"AI Response: {response_text}")

        # Follow-up detection: if AI marked response with [FOLLOW-UP], don't count as new question
        is_followup = response_text.strip().startswith("[FOLLOW-UP]")
        clean_response = response_text.replace("[FOLLOW-UP]", "").strip()

        # Update History
        new_history = session["history"] + f"\nCandidate: {user_input}\nInterviewer: {clean_response}"
        new_count = session["question_count"] if is_followup else session["question_count"] + 1
        
        database.update_session(session_id, {
            "history": new_history,
            "question_count": new_count
        })

        # 4. Synthesize Audio
        # Since pyttsx3 is offline and blocking server, we should ideally use an API (ElevenLabs or OpenAI)
        # However, for now, to keep it simple and free, we can try using a non-blocking approach or just text if TTS is too slow/problematic on server.
        # But user wants "Production Ready". 
        # Let's stick to returning text first, and optionally audio URL if we can.
        # Ideally, the frontend can do TTS (browser built-in) for zero latency!
        # Let's return the text, and let the frontend handle TTS using Web Speech API or a library. 
        # Making the server do TTS with pyttsx3 is bad for concurrency.
        
        is_complete = new_count >= session["max_questions"]
        has_api_error = clean_response.startswith("[API_ERROR]")
        if has_api_error:
            clean_response = clean_response.replace("[API_ERROR]", "").strip()

        return {
            "text": clean_response,
            "session_over": is_complete,
            "question_count": new_count,
            "api_error": has_api_error
        }

    def _transcribe_audio(self, audio_bytes):
        # We need to save to a temp file for Groq Whisper
        try:
            filename = f"temp_{int(time.time())}.wav" # or .webm depending on input
            with open(filename, "wb") as f:
                f.write(audio_bytes)
            
            with open(filename, "rb") as file:
                transcription = self.groq_client.audio.transcriptions.create(
                    file=(filename, file.read()),
                    model="whisper-large-v3",
                    response_format="text",
                )
            os.remove(filename) # cleanup
            return transcription
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return "I could not hear that clearly."

    def _query_llm(self, prompt_text, system_instruction="You are Alex, a professional interviewer from VisionHire. Keep responses short and professional.", retries=3):
        for attempt in range(retries):
            try:
                completion = self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt_text}
                    ],
                    temperature=0.6
                )
                return completion.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"LLM attempt {attempt + 1}/{retries} failed: {e}")
                if "rate_limit" in str(e).lower() or "429" in str(e):
                    wait_time = 2 ** attempt  # 1s, 2s, 4s
                    logger.info(f"Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    break  # Non-rate-limit error, don't retry
        return "[API_ERROR] I'm experiencing a technical issue and cannot continue right now. Please try again shortly."

    def generate_report(self, session_id: str):
        session = database.get_session(session_id)
        if not session: return "No session data"
        
        prompt = prompts.get_feedback_prompt().format(
            history=session["history"],
            job_description=session.get("job_description", "") or "Not provided",
            context=session.get("context", "") or "Not provided",
            round_type=session.get("round_type", "technical") or "technical",
        )
        # Use a strict system prompt for report generation to ensure JSON
        return self._query_llm(prompt, system_instruction="You are a precise data analyst. Output only valid JSON. Do not converse.")

