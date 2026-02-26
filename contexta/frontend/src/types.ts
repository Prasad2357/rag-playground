export type Role = 'user' | 'assistant';

export interface Source {
    path: string;
    filename: string;
}

export interface Message {
    id: string;
    role: Role;
    content: string;
    sources?: Source[];
    timestamp: Date;
    isStreaming?: boolean;
}

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    uploadedAt: Date;
    status: 'uploading' | 'ready' | 'error';
    selected: boolean;
}

export interface QueryResponse {
    answer: string;
    sources: string[];
}
