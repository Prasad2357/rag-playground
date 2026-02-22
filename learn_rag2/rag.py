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
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import RetrievalQA


INDEX_PATH = "faiss_index"


def build_index(embedding_model):
    print("🔹 Building index (first run)...")

    loader = TextLoader(r"D:\Projects\RAG\learn_rag2\sample_doc.txt")
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(documents)

    vectorstore = FAISS.from_documents(chunks, embedding_model)

    vectorstore.save_local(INDEX_PATH)

    print("✅ Index built and saved")


def load_or_create_index(embedding_model):
    if os.path.exists(INDEX_PATH):
        print("✅ Existing index found — loading...")
        return FAISS.load_local(
            INDEX_PATH,
            embedding_model,
            allow_dangerous_deserialization=True
        )
    else:
        build_index(embedding_model)
        return FAISS.load_local(
            INDEX_PATH,
            embedding_model,
            allow_dangerous_deserialization=True
        )


def main():
    load_dotenv()

    google_api_key = os.getenv("GOOGLE_API_KEY")

    print("🔹 Loading embedding model...")
    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # 🔥 Auto index handling
    vectorstore = load_or_create_index(embedding_model)

    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    print("🔹 Initializing Gemini LLM...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        google_api_key=google_api_key
    )

    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever
    )

    query = input("\nEnter your question: ")

    response = rag_chain.invoke({"query": query})

    print("\n✅ Answer:")
    print(response["result"])


if __name__ == "__main__":
    main()