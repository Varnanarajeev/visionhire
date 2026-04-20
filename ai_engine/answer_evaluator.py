from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate


def evaluate_answers(questions: str, answers: dict) -> str:
    """
    Evaluates a candidate's answer to an interview question.
    Returns structured feedback.
    """

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.3
    )

    prompt = ChatPromptTemplate.from_template("""
You are an AI technical interviewer.

Evaluate the candidate's answer based on:
- Technical correctness
- Clarity of explanation
- Relevance to the question

Question:
{question}

Candidate Answer:
{answer}

Provide:
1. Score out of 10
2. One-line justification
3. Strengths (1–2 points)
4. Weaknesses (1–2 points)
""")

    chain = prompt | llm

    result = chain.invoke({
        "question": questions,
        "answer": answers["answer"]
    })

    return result.content
