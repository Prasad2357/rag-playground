import os
from dotenv import load_dotenv

# Prevent tokenizer parallel deadlocks
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# ✅ Gemini import
from langchain_google_genai import ChatGoogleGenerativeAI

from langchain_classic.chains import RetrievalQA


def main():
    print("🔹 Loading environment variables...")
    load_dotenv()

    google_api_key = os.getenv("GOOGLE_API_KEY")
    print("GOOGLE_API_KEY loaded:", "YES" if google_api_key else "NO")

    # --- 1. Load document ---
    print("🔹 Loading document...")
    loader = TextLoader(r"D:\Projects\RAG\learn_rag2\sample_doc.txt")
    documents = loader.load()
    print(f"✅ Loaded {len(documents)} document(s)")

    # --- 2. Split into chunks ---
    print("🔹 Splitting document into chunks...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=50)
    chunks = splitter.split_documents(documents)
    print(f"✅ Created {len(chunks)} chunks")

    # --- 3. Load embedding model ---
    print("🔹 Loading embedding model...")
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    print("✅ Embedding model loaded")

    # --- 4. Build FAISS vector store ---
    print("🔹 Generating embeddings and building vector store...")
    vectorstore = FAISS.from_documents(
        documents=chunks,
        embedding=embedding_model
    )
    print("✅ Vector store created")

    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    print("✅ Retriever ready")

    # --- 5. Setup Gemini LLM ---
    print("🔹 Initializing Gemini LLM...")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        google_api_key=google_api_key
    )

    print("✅ Gemini LLM initialized")

    # --- 6. Build RAG chain ---
    print("🔹 Building RAG chain...")
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True
    )
    print("✅ RAG chain ready")

    # --- 7. Ask question ---
    query = "What is the company refund policy?"
    print(f"🔹 Sending query: {query}")

    try:
        response = rag_chain.invoke({"query": query})
        print("✅ Response received")
        print("\nAnswer:", response["result"])
    except Exception as e:
        print("❌ ERROR during query:", e)


if __name__ == "__main__":
    main()
