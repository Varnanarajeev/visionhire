from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


def generate_interview_report(session_data: dict) -> str:
    """
    Generates a final interview report based on Q&A evaluations.
    """

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.3
    )

    prompt = ChatPromptTemplate.from_template("""
You are an AI interviewer generating a final interview report.

Candidate Interview Data:
Questions Asked:
{questions}

Candidate Answers:
{answers}

Evaluations:
{evaluations}

Generate a professional interview report including:
1. Overall performance summary
2. Key strengths
3. Key weaknesses
4. Final verdict (Pass / Average / Needs Improvement)
""")

    chain = prompt | llm

    result = chain.invoke({
        "questions": session_data["questions"],
        "answers": session_data["answers"],
        "evaluations": session_data["evaluations"]
    })

    return result.content
