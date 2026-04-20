from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough


def generate_interview_questions():
    # 1. Load embeddings
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    # 2. Load FAISS index
    db = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = db.as_retriever(search_kwargs={"k": 4})

    # 3. LLM
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0.4
    )

    # 4. Prompt
    prompt = ChatPromptTemplate.from_template("""
You are an AI technical interviewer.

Based ONLY on the candidate's resume context below,
generate:
- 3 technical interview questions
- 2 project-based interview questions

Resume context:
{context}
""")

    # 5. Chain (modern LangChain)
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
    )

    # 6. Run
    result = chain.invoke("Generate interview questions")

    return result.content
