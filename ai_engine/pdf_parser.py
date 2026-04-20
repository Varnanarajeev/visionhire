import fitz  # This is PyMuPDF
import os

def extract_text_from_pdf(pdf_path):
    print(f"Reading file: {pdf_path}...")
    
    # 1. Check if file exists
    if not os.path.exists(pdf_path):
        return "Error: File not found!"

    # 2. Open the PDF
    doc = fitz.open(pdf_path)
    text = ""

    # 3. Loop through pages and extract text
    for page in doc:
        text += page.get_text()

    doc.close()
    return text

# --- Test the Parser ---
if __name__ == "__main__":
    resume_path = "my_resume.pdf" # Make sure this file is in your folder!
    extracted_data = extract_text_from_pdf(resume_path)
    
    print("-" * 30)
    print("EXTRACTED TEXT PREVIEW:")
    print(extracted_data[:500]) # Print first 500 characters
    print("-" * 30)
    
    if len(extracted_data) > 10:
        print("SUCCESS: PDF parsed successfully!")
    else:
        print("FAILED: Could not extract text.")