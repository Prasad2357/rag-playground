# backend/rag.py
# upload a file -> split into chunks -> embed -> store in vector store -> query -> return answer

import os
from dotenv import load_dotenv

from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    UnstructuredWordDocumentLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import RetrievalQA

from fastapi import APIRouter, UploadFile, File

# ---------- ENV ----------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ---------- ROUTER ----------
router = APIRouter()

# ---------- GLOBALS ----------
INDEX_PATH = "faiss_index"
UPLOAD_PATH = "uploads"
ALLOWED_TYPES = {".txt", ".pdf", ".docx"}

vectorstore = None

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ============================================================
# Upload Endpoint
# ============================================================

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_PATH, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_TYPES:
        return {"error": "Unsupported file type"}

    file_path = f"{UPLOAD_PATH}/{file.filename}"

    # Save file in chunks (1 MB)
    with open(file_path, "wb") as f:
        while chunk := file.file.read(1024 * 1024):
            f.write(chunk)

    # Select loader AFTER saving file
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".docx":
        loader = UnstructuredWordDocumentLoader(file_path)
    else:
        loader = TextLoader(file_path)

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

    chunks = splitter.split_documents(documents)

    # Add metadata
    for c in chunks:
        c.metadata["source"] = file_path

    # Create or append index
    if os.path.exists(INDEX_PATH):
        db = FAISS.load_local(
            INDEX_PATH,
            embedding_model,
            allow_dangerous_deserialization=True
        )
        db.add_documents(chunks)
    else:
        db = FAISS.from_documents(chunks, embedding_model)

    db.save_local(INDEX_PATH)

    # Reset cache so new docs are used
    global vectorstore
    vectorstore = None

    return {"message": "File uploaded and indexed successfully"}


# ============================================================
# Load Vector Store (cached)
# ============================================================

def get_vectorstore():
    global vectorstore

    if vectorstore is None:
        if not os.path.exists(INDEX_PATH):
            raise Exception("No index found. Upload documents first.")

        vectorstore = FAISS.load_local(
            INDEX_PATH,
            embedding_model,
            allow_dangerous_deserialization=True
        )

    return vectorstore


# ============================================================
# Query Endpoint
# ============================================================

@router.post("/query")
def query_rag(question: str):

    db = get_vectorstore()

    retriever = db.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        google_api_key=GOOGLE_API_KEY
    )

    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True
    )

    response = rag_chain.invoke({"query": question})

    return {
        "answer": response["result"],
        "sources": [
            doc.metadata.get("source", "unknown")
            for doc in response["source_documents"]
        ]
    }