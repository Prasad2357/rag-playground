from sentence_transformers import SentenceTransformer, util
import faiss
import numpy as np
import os
from google import genai

from dotenv import load_dotenv
load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

documents = [
    "The capital of France is Paris.",
    "Python is a programming language for data science.",
    "The Himalayas are the highest mountain range in the world.",
    "Mount Everest, located in the Himalayas, is Earth's highest mountain."
]


# Load the embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Create embeddings for each doc

doc_embeddings = embedding_model.encode(documents, convert_to_numpy=True)
doc_embeddings = doc_embeddings / np.linalg.norm(doc_embeddings, axis=1, keepdims=True)

query = "Where is the highest mountain located?"
query_vector = embedding_model.encode([query], convert_to_numpy=True)
query_vector = query_vector / np.linalg.norm(query_vector, axis=1, keepdims=True)

# print("Document Embeddings:" , doc_embeddings)
# print("Shape of Document Embeddings:", doc_embeddings.shape)

# Dimensionality of embeddings
dim = doc_embeddings.shape[1]
print("Dimensionality of embeddings:", dim)

index = faiss.IndexFlatIP(dim)
print("index:", index)
index.add(doc_embeddings)
# print("Added document embeddings to the index.", index)
# print("Number of documents in the index:", index.ntotal)



k = 2  # Number of nearest neighbors to retrieve
distances, indices = index.search(query_vector, k)
# print("Distances:",distances)
# print("Indices:",indices)

for d,i in zip(distances[0], indices[0]) :
    print(f"Retrieved Document: {documents[i]}")
    print(f"Similarity Score: {d}")

context = "\n".join([documents[i] for i in indices[0]])

prompt = f"""
Use the following context to answer the question.

Context: {context}
Question: {query}
Answer:
"""


response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)

print(response.text)



