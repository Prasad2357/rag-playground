# backend/rag.py

# upload a file -> split into chunks -> embed -> store in vector store -> query -> return answer

import os
from dotenv import load_dotenv

# Prevent tokenizer parallel deadlocks
# os.environ["TOKENIZERS_PARALLELISM"] = "false"
# os.environ["OMP_NUM_THREADS"] = "1"
# os.environ["MKL_NUM_THREADS"] = "1"

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import RetrievalQA
from fastapi import APIRouter, UploadFile, File

router = APIRouter()

INDEX_PATH = "faiss_index"
UPLOAD_PATH = "uploads"

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...)
):
    """
    Upload a file and store it in the database.
    """
    os.makedirs(UPLOAD_PATH, exist_ok=True)
    file_path = f"{UPLOAD_PATH}/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    build_index(embedding_model, file_path)
    
    return {"message": "File uploaded successfully and index built"}


def build_index(embedding_model, file_path):

    print("🔹 Building index (first run)...")

    loader = TextLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(documents)

    vectorstore = FAISS.from_documents(chunks, embedding_model)

    vectorstore.save_local(INDEX_PATH)

    print("✅ Index built and saved. You can query now.")


@router.post("/query")
def query_rag(
    question: str
):
    """
    Query the RAG system.
    """
    load_dotenv()
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if google_api_key:
        print("Successfully loaded API Key")
    else:
        print("Failed to load API Key")

    #load embedding model
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    #load vector store
    vectorstore = FAISS.load_local(
        INDEX_PATH,
        embedding_model,
        allow_dangerous_deserialization=True
    )

    #create retriever
    retriever = vectorstore.as_retriever(search_kwargs={"k":3})

    #create LLM
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        google_api_key=google_api_key
    )

    #create RAG chain
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever
    )

    #invoke RAG chain
    response = rag_chain.invoke({"query": question})

    return {"answer": response["result"]}



    
