# 🔍 RAG Learning Repository

> A hands-on, progressive exploration of **Retrieval-Augmented Generation (RAG)** — from raw vector search to full LangChain pipelines powered by Google Gemini.

---

## 📖 What is RAG?

**Retrieval-Augmented Generation (RAG)** is an AI architecture that enhances Large Language Models (LLMs) by grounding their responses in external, domain-specific knowledge. Instead of relying solely on what the LLM was trained on, RAG:

1. **Retrieves** the most relevant document chunks from a vector store based on the user's query.
2. **Augments** the LLM prompt with that retrieved context.
3. **Generates** a factually grounded, accurate response.

```
User Query
    │
    ▼
[Embedding Model] ──► Query Vector
                              │
                              ▼
                    [FAISS Vector Store]  ◄── Document Embeddings
                              │
                    Top-K Relevant Chunks
                              │
                              ▼
               [LLM Prompt = Context + Query]
                              │
                              ▼
                      ✅ Grounded Answer
```

---

## 🗂️ Project Structure

```
RAG/
├── learn_rag1/                  # Phase 1 — Raw RAG from scratch
│   ├── rag.py                   # Manual embedding, FAISS search, Gemini generation
│   └── embeddings/              # Cached embedding artifacts
│
├── learn_rag2/                  # Phase 2 — LangChain-powered RAG pipeline
│   ├── rag.py                   # Full LangChain RetrievalQA chain
│   ├── sample_doc.txt           # Sample domain document (company policy, etc.)
│   ├── steps.txt                # RAG pipeline step reference table
│   └── test.py                  # OpenAI API connectivity test
│
├── .env                         # API keys (never commit this!)
├── .env.example                 # Template for required environment variables
├── .gitignore                   # Comprehensive Python + secrets ignore rules
└── README.md                    # You are here
```

---

## 🧪 Implementations

### Phase 1 — `learn_rag1/rag.py` · *RAG from Scratch*

A minimal, dependency-light RAG pipeline built without any high-level framework. Great for understanding the core mechanics.

| Step | What Happens |
|------|-------------|
| 1 | Hard-coded documents are loaded in-memory |
| 2 | `sentence-transformers/all-MiniLM-L6-v2` encodes them into vectors |
| 3 | Vectors are L2-normalized and indexed using **FAISS `IndexFlatIP`** (cosine similarity via inner product) |
| 4 | The user query is embedded and searched against the index |
| 5 | Top-K retrieved documents are injected into a prompt |
| 6 | **Google Gemini** (`gemini-2.5-flash`) generates the final answer |

**Key libraries:** `sentence-transformers`, `faiss-cpu`, `numpy`, `google-genai`, `python-dotenv`

---

### Phase 2 — `learn_rag2/rag.py` · *LangChain Pipeline*

A production-style RAG chain using the **LangChain** ecosystem, with real document loading, chunking, and a reusable `RetrievalQA` chain.

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | `TextLoader` | Load a `.txt` file as a LangChain `Document` |
| 2 | `RecursiveCharacterTextSplitter` | Chunk into 200-char segments with 50-char overlap |
| 3 | `HuggingFaceEmbeddings` (`all-MiniLM-L6-v2`) | Convert chunks to semantic vectors |
| 4 | `FAISS.from_documents` | Build searchable vector store |
| 5 | `ChatGoogleGenerativeAI` (Gemini) | LLM for answer generation |
| 6 | `RetrievalQA.from_chain_type` | Assemble the full RAG chain |
| 7 | `rag_chain.invoke({"query": ...})` | Run end-to-end retrieval + generation |

**Key libraries:** `langchain`, `langchain-community`, `langchain-huggingface`, `langchain-google-genai`, `langchain-classic`, `faiss-cpu`, `python-dotenv`

---

## ⚙️ Setup & Installation

### Prerequisites

- Python **3.9+**
- `pip`
- A terminal / command prompt

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/RAG.git
cd RAG
```

### 2. Create & Activate a Virtual Environment

```bash
# Create
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS / Linux)
source venv/bin/activate
```

### 3. Install Dependencies

**For Phase 1 (`learn_rag1`):**

```bash
pip install sentence-transformers faiss-cpu numpy google-genai python-dotenv
```

**For Phase 2 (`learn_rag2`):**

```bash
pip install langchain langchain-community langchain-huggingface \
            langchain-google-genai langchain-classic \
            faiss-cpu python-dotenv
```

### 4. Configure Environment Variables

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here       # Optional, for test.py
HF_TOKEN=your_huggingface_token_here           # Optional, for private HF models
```

> 🔑 Get your **Google Gemini API key** at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## 🚀 Running the Examples

### Phase 1 — Raw RAG

```bash
cd learn_rag1
python rag.py
```

**Expected output:**
```
Dimensionality of embeddings: 384
Retrieved Document: Mount Everest, located in the Himalayas, is Earth's highest mountain.
Similarity Score: 0.857
Retrieved Document: The Himalayas are the highest mountain range in the world.
Similarity Score: 0.823
Mount Everest, located in the Himalayas, is Earth's highest mountain above sea level.
```

---

### Phase 2 — LangChain RAG

```bash
cd learn_rag2
python rag.py
```

**Expected output:**
```
🔹 Loading environment variables...
🔹 Loading document...
✅ Loaded 1 document(s)
🔹 Splitting document into chunks...
✅ Created N chunks
🔹 Loading embedding model...
✅ Embedding model loaded
🔹 Generating embeddings and building vector store...
✅ Vector store created
✅ Retriever ready
🔹 Initializing Gemini LLM...
✅ Gemini LLM initialized
🔹 Building RAG chain...
✅ RAG chain ready
🔹 Sending query: What is the company refund policy?

Answer: [Gemini's grounded response based on sample_doc.txt]
```

---

### Test OpenAI Connectivity

```bash
cd learn_rag2
python test.py
```

Lists all available models from your OpenAI account.

---

## 🌐 API Keys Reference

| Variable | Provider | Purpose | Get it at |
|----------|----------|---------|-----------|
| `GOOGLE_API_KEY` | Google AI Studio | Gemini LLM generation | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | OpenAI | Model listing / GPT usage | [platform.openai.com](https://platform.openai.com/api-keys) |
| `HF_TOKEN` | Hugging Face | Private model access | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

---

## 🧠 Key Concepts Explained

### Embeddings
Dense numerical vectors that capture the *semantic meaning* of text. Two sentences with similar meanings will have vectors that are close together in high-dimensional space.

### FAISS (Facebook AI Similarity Search)
An open-source library for efficient similarity search over large collections of vectors. Used here with `IndexFlatIP` (inner product / cosine similarity).

### Chunking
Large documents are split into smaller pieces (`chunks`) before embedding. This improves retrieval precision — you retrieve the *relevant paragraph*, not the entire document.

### Chunk Overlap
Adjacent chunks share a small overlap (e.g., 50 characters) to avoid losing context at split boundaries.

### RetrievalQA Chain (LangChain)
A pre-built LangChain chain that: retrieves top-K chunks → formats a prompt → calls the LLM → returns the answer along with source documents.

---

## 🗺️ Learning Roadmap

- [x] **Phase 1** — Manual RAG: embeddings, FAISS, Gemini
- [x] **Phase 2** — LangChain RAG: document loading, chunking, RetrievalQA
- [ ] **Phase 3** — Persistent vector store (save/load FAISS index)
- [ ] **Phase 4** — Multi-document RAG with metadata filtering
- [ ] **Phase 5** — Conversational RAG with chat history
- [ ] **Phase 6** — RAG evaluation (faithfulness, relevance, answer correctness)
- [ ] **Phase 7** — Deploy as a FastAPI / Streamlit app

---

## 🤝 Contributing

This is a personal learning project, but suggestions and improvements are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-improvement`)
3. Commit your changes (`git commit -m 'Add my improvement'`)
4. Push and open a Pull Request

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ to learn RAG • Powered by <strong>Google Gemini</strong> + <strong>LangChain</strong> + <strong>FAISS</strong>
</p>
