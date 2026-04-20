import os
from dotenv import load_dotenv
from groq import Groq
import fitz # PyMuPDF
from ai_engine.pdf_parser import extract_text_from_pdf


# 1. Setup
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_resume(pdf_path):
    # 2. Extract ALL text from the PDF
    doc = fitz.open(pdf_path)
    resume_text = ""
    for page in doc:
        resume_text += page.get_text()
    doc.close()

    print("Analyzing your resume with Groq... please wait...", flush=True)

    # 3. Send the FULL text to Groq
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert HR Manager for a top Tech company."},
            {"role": "user", "content": f"Analyze this resume and give me a professional summary of the candidate's strengths and one potential interview question based on their experience: \n\n{resume_text}"}
        ]
    )
    return completion.choices[0].message.content

# --- Run the Analysis ---
if __name__ == "__main__":
    result = analyze_resume("my_resume.pdf")
    print("\n" + "="*40)
    print("RECRUITER ANALYSIS OF VARNANA RAJEEV")
    print("="*40)
    print(result)