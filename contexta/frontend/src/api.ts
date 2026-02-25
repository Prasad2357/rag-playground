import type { QueryResponse } from './types';

const BASE_URL = 'http://localhost:8000';

export async function uploadFile(file: File): Promise<{ message: string } | { error: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
    }

    return response.json();
}

export async function queryRAG(question: string): Promise<QueryResponse> {
    const params = new URLSearchParams({ question });

    const response = await fetch(`${BASE_URL}/query?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Query failed' }));
        throw new Error(err.detail || 'Query failed');
    }

    return response.json();
}
