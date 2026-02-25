import React, { useRef, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { uploadFile } from '@/api';
import type { UploadedFile } from '@/types';

interface SidebarProps {
    files: UploadedFile[];
    onFilesChange: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ ext }: { ext: string }) {
    const colors: Record<string, string> = {
        pdf: 'text-red-400',
        txt: 'text-blue-400',
        docx: 'text-sky-400',
    };
    const color = colors[ext] || 'text-muted-foreground';

    return (
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase tracking-wide glass ${color}`}>
            {ext}
        </div>
    );
}

export function Sidebar({ files, onFilesChange }: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = useCallback(async (selected: FileList | null) => {
        if (!selected) return;
        const allowed = ['.pdf', '.txt', '.docx'];

        for (const file of Array.from(selected)) {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!allowed.includes(ext)) continue;

            const id = crypto.randomUUID();
            const newFile: UploadedFile = {
                id,
                name: file.name,
                size: file.size,
                uploadedAt: new Date(),
                status: 'uploading',
            };

            onFilesChange((prev: UploadedFile[]) => [...prev, newFile] as UploadedFile[]);

            try {
                await uploadFile(file);
                onFilesChange((prev: UploadedFile[]) =>
                    prev.map((f) => (f.id === id ? { ...f, status: 'ready' } : f)) as UploadedFile[]
                );
            } catch {
                onFilesChange((prev: UploadedFile[]) =>
                    prev.map((f) => (f.id === id ? { ...f, status: 'error' } : f)) as UploadedFile[]
                );
            }
        }
    }, [onFilesChange]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const statusBadge = (status: UploadedFile['status']) => {
        if (status === 'uploading') return (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-500/15 text-yellow-400 border-yellow-500/20">
                Indexing
            </Badge>
        );
        if (status === 'error') return (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-500/15 text-red-400 border-red-500/20">
                Error
            </Badge>
        );
        return (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                Ready
            </Badge>
        );
    };

    const readyCount = files.filter(f => f.status === 'ready').length;

    return (
        <aside className="w-72 flex-shrink-0 flex flex-col h-full border-r border-border/60">
            {/* Header */}
            <div className="p-5 border-b border-border/60">
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center glow-purple-sm">
                        <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="font-semibold text-sm tracking-wide text-foreground">Contexta</span>
                </div>
                <p className="text-[11px] text-muted-foreground">RAG-powered document intelligence</p>
            </div>

            {/* Upload zone */}
            <div className="p-4">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    className={`
            relative cursor-pointer rounded-xl border-2 border-dashed p-5 text-center
            transition-all duration-200 select-none
            ${isDragging
                            ? 'border-primary/70 bg-primary/10 glow-purple-sm'
                            : 'border-border hover:border-primary/40 hover:bg-primary/5'
                        }
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.txt,.docx"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <p className="text-xs font-medium text-foreground/80 mb-1">Drop files or click to upload</p>
                    <p className="text-[10px] text-muted-foreground">PDF · TXT · DOCX</p>
                </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {files.length > 0 && (
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                            Documents
                        </span>
                        <span className="text-[10px] text-muted-foreground">{readyCount} indexed</span>
                    </div>
                )}

                <div className="space-y-2">
                    {files.map((file) => {
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
                        const isUploading = file.status === 'uploading';

                        return (
                            <div
                                key={file.id}
                                className="rounded-lg p-2.5 glass transition-all duration-200 hover:bg-primary/5 group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <FileIcon ext={ext} />
                                    <div className="flex-1 min-w-0">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className="text-xs font-medium truncate text-foreground/90 cursor-default">
                                                    {file.name}
                                                </p>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <p className="text-xs">{file.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
                                    </div>
                                    {statusBadge(file.status)}
                                </div>
                                {isUploading && (
                                    <Progress value={undefined} className="mt-2 h-0.5 bg-border" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {files.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-[11px] text-muted-foreground">No documents uploaded yet</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/60">
                <p className="text-[10px] text-muted-foreground text-center">
                    Powered by Gemini 2.5 Flash & FAISS
                </p>
            </div>
        </aside>
    );
}
