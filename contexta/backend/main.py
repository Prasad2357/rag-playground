from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from .rag import router as rag_router

app = FastAPI(
    title="Contexta API",
    description="Contexta API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Contexta API is running"}

app.include_router(rag_router)

if __name__ == "__main__":
    uvicorn.run(app, host="[IP_ADDRESS]", port=8000)

