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
                selected: false,
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

    const toggleFileSelection = useCallback((id: string) => {
        onFilesChange((prev: UploadedFile[]) =>
            prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)) as UploadedFile[]
        );
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
        return null; // ready files show selection state instead
    };

    const readyCount = files.filter(f => f.status === 'ready').length;
    const selectedCount = files.filter(f => f.selected).length;

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

                {readyCount > 1 && (
                    <p className="text-[10px] text-muted-foreground/70 mb-2.5 leading-relaxed">
                        Click a document to focus chat on it. Multiple can be selected.
                    </p>
                )}

                <div className="space-y-2">
                    {files.map((file) => {
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
                        const isUploading = file.status === 'uploading';
                        const isReady = file.status === 'ready';
                        const isSelected = file.selected;

                        return (
                            <div
                                key={file.id}
                                onClick={() => isReady && toggleFileSelection(file.id)}
                                className={`
                                    rounded-lg p-2.5 glass transition-all duration-200 group relative
                                    ${isReady ? 'cursor-pointer' : 'cursor-default'}
                                    ${isSelected
                                        ? 'ring-1 ring-primary/60 bg-primary/8 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                                        : isReady ? 'hover:bg-primary/5 hover:ring-1 hover:ring-primary/20' : ''
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2.5">
                                    <FileIcon ext={ext} />
                                    <div className="flex-1 min-w-0">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <p className={`text-xs font-medium truncate cursor-default ${isSelected ? 'text-primary' : 'text-foreground/90'}`}>
                                                    {file.name}
                                                </p>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <p className="text-xs">{file.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
                                    </div>

                                    {/* Status or selection indicator */}
                                    {isReady ? (
                                        <div className={`
                                            w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200
                                            ${isSelected
                                                ? 'bg-primary text-white'
                                                : 'bg-muted-foreground/20 group-hover:bg-primary/20'
                                            }
                                        `}>
                                            {isSelected && (
                                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    ) : (
                                        statusBadge(file.status)
                                    )}
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

            {/* Query scope indicator */}
            {readyCount > 0 && (
                <div className="px-4 pb-3">
                    <div className={`rounded-lg px-3 py-2 text-[10px] flex items-center gap-2 transition-all duration-300 ${selectedCount > 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted/40 text-muted-foreground border border-border/40'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedCount > 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        {selectedCount > 0
                            ? `Querying ${selectedCount} selected doc${selectedCount !== 1 ? 's' : ''}`
                            : 'Querying all documents'}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-border/60">
                <p className="text-[10px] text-muted-foreground text-center">
                    Powered by Gemini 2.5 Flash & FAISS
                </p>
            </div>
        </aside>
    );
}
