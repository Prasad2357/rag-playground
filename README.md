# 🔍 RAG Learning Repository

> A hands-on, progressive exploration of **Retrieval-Augmented Generation (RAG)** — from raw vector search to a full-stack production-ready app powered by Google Gemini.

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
├── contexta/                    # Phase 3 — Full-stack RAG application
│   ├── backend/                 # FastAPI backend
│   │   ├── main.py              # App entrypoint, CORS, router registration
│   │   ├── rag.py               # Upload, indexing, querying logic
│   │   └── __init__.py
│   ├── frontend/                # React + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── App.tsx          # Root layout with sidebar + chat panel
│   │   │   ├── api.ts           # API client (upload, query, list documents)
│   │   │   ├── types.ts         # Shared TypeScript interfaces
│   │   │   ├── index.css        # Global styles & design tokens
│   │   │   └── components/
│   │   │       ├── Sidebar.tsx      # Document upload & selection panel
│   │   │       ├── ChatPanel.tsx    # Chat interface with message history
│   │   │       └── ChatMessage.tsx  # Individual message bubble component
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── faiss_index/             # Persisted FAISS vector index (auto-generated)
│   └── uploads/                 # Uploaded documents (auto-generated)
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

### Phase 3 — `contexta/` · *Full-Stack RAG Application*

**Contexta** is a complete, production-ready RAG application with a FastAPI backend and a React + Vite frontend. It supports multi-document upload, persistent vector indexing, per-document query filtering, and a polished chat interface.

#### Architecture

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  Sidebar (upload + select docs)     │
│  ChatPanel (chat history + query)   │
└────────────────┬────────────────────┘
                 │ HTTP (localhost:5173 → :8000)
┌────────────────▼────────────────────┐
│          FastAPI Backend            │
│  POST /upload  → embed & index      │
│  GET  /documents → list uploads     │
│  POST /query   → retrieve + answer  │
└────────────────┬────────────────────┘
                 │
     ┌───────────▼───────────┐
     │   FAISS Vector Index  │   (persisted on disk)
     │   HuggingFace Embeds  │
     │   Google Gemini LLM   │
     └───────────────────────┘
```

#### Backend — `contexta/backend/`

| File | Role |
|------|------|
| `main.py` | FastAPI app entrypoint; registers the RAG router, sets up CORS |
| `rag.py` | All RAG logic: file upload, chunking, embedding, FAISS indexing, querying |

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/upload` | Upload a `.txt`, `.pdf`, or `.docx` file; chunk, embed, and add to FAISS index |
| `GET` | `/documents` | List all indexed documents with name, size, and upload timestamp |
| `POST` | `/query` | Query the RAG pipeline; optional `file_names` param filters retrieval to selected docs |

**RAG Pipeline Details (`rag.py`):**

| Step | Detail |
|------|--------|
| Supported formats | `.txt`, `.pdf`, `.docx` |
| Chunk size | 800 characters with 150-character overlap |
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` (via `langchain-huggingface`) |
| Vector store | FAISS (persisted to `faiss_index/`; new uploads are merged in) |
| LLM | `gemini-2.5-flash` via `langchain-google-genai` |
| Query filtering | When specific files are selected, retrieves top-20 candidates then filters by `source` metadata |

#### Frontend — `contexta/frontend/`

Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**.

| Component | Description |
|-----------|-------------|
| `Sidebar.tsx` | File upload panel with drag-and-drop; shows all indexed documents (persisted across sessions); supports per-document selection for scoped queries |
| `ChatPanel.tsx` | Full chat interface with message history, streaming-style response display, and source citation |
| `ChatMessage.tsx` | Individual message bubble with role-based styling (user vs. assistant) and source file display |
| `api.ts` | Typed API client — `uploadFile()`, `listDocuments()`, `queryRAG()` |
| `types.ts` | Shared TypeScript interfaces: `Message`, `UploadedFile`, `QueryResponse`, `DocumentMeta` |

**Key frontend libraries:** `react`, `tailwindcss`, `lucide-react`, `radix-ui`, `shadcn`, `vite`

---

## ⚙️ Setup & Installation

### Prerequisites

- Python **3.9+** and `pip`
- Node.js **18+** and `npm`
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

**For Phase 3 — Contexta backend:**

```bash
pip install fastapi uvicorn python-dotenv \
            langchain langchain-community langchain-huggingface \
            langchain-google-genai langchain-classic \
            langchain-text-splitters faiss-cpu \
            pypdf unstructured
```

**For Phase 3 — Contexta frontend:**

```bash
cd contexta/frontend
npm install
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

### Phase 3 — Contexta (Full-Stack App)

**1. Start the backend** (from the `contexta/` folder):

```bash
cd contexta
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

**2. Start the frontend** (in a separate terminal):

```bash
cd contexta/frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

**3. Using the app:**

1. Click **Upload** in the sidebar and select one or more `.txt`, `.pdf`, or `.docx` files.
2. Files are chunked, embedded, and persisted to the FAISS index automatically.
3. Select specific documents in the sidebar to scope your query, or leave all unselected to search across everything.
4. Type your question in the chat panel and press Enter.
5. Contexta retrieves the most relevant chunks and streams back a grounded answer with source citations.

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
An open-source library for efficient similarity search over large collections of vectors. Used here with `IndexFlatIP` (inner product / cosine similarity). In Contexta, the index is **persisted to disk** so uploads survive server restarts.

### Chunking
Large documents are split into smaller pieces (`chunks`) before embedding. This improves retrieval precision — you retrieve the *relevant paragraph*, not the entire document.

### Chunk Overlap
Adjacent chunks share a small overlap (e.g., 150 characters in Contexta) to avoid losing context at split boundaries.

### Document Filtering
Contexta supports scoped retrieval: when the user selects specific documents in the sidebar, the backend fetches a larger candidate pool (top-20) from FAISS and then filters by the `source` metadata field to return only chunks from the selected files.

### RetrievalQA Chain (LangChain)
A pre-built LangChain chain that: retrieves top-K chunks → formats a prompt → calls the LLM → returns the answer along with source documents.

---

## 🗺️ Learning Roadmap

- [x] **Phase 1** — Manual RAG: embeddings, FAISS, Gemini
- [x] **Phase 2** — LangChain RAG: document loading, chunking, RetrievalQA
- [x] **Phase 3** — Contexta: full-stack app (FastAPI + React), persistent FAISS, multi-document filtering, chat UI
- [ ] **Phase 4** — Conversational RAG with chat history / memory
- [ ] **Phase 5** — RAG evaluation (faithfulness, relevance, answer correctness)
- [ ] **Phase 6** — Streaming responses from Gemini
- [ ] **Phase 7** — Authentication & multi-user support

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
  Built with ❤️ to learn RAG • Powered by <strong>Google Gemini</strong> + <strong>LangChain</strong> + <strong>FAISS</strong> + <strong>React</strong>
</p>
