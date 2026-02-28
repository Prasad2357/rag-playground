import { useRef, useEffect, useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChatMessage, EmptyState, TypingIndicator } from '@/components/ChatMessage';
import { queryRAG } from '@/api';
import type { Message, UploadedFile } from '@/types';

const STORAGE_KEY = 'contexta_chat_history';

/** Load messages from localStorage, reviving Date strings → Date objects. */
function loadMessages(): Message[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Message[];
        return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
}

/** Persist messages to localStorage. */
function saveMessages(messages: Message[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
        // Silently ignore storage quota errors.
    }
}

interface ChatPanelProps {
    files: UploadedFile[];
}

export function ChatPanel({ files }: ChatPanelProps) {
    // Initialise from localStorage so chat survives hard refreshes.
    const [messages, setMessages] = useState<Message[]>(loadMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const hasReadyFiles = files.some(f => f.status === 'ready');

    // Sync every messages change to localStorage.
    useEffect(() => {
        saveMessages(messages);
    }, [messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = useCallback(async () => {
        const question = input.trim();
        if (!question || isLoading) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: question,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Collect names of explicitly selected files (ready state).
            // If none are selected, send nothing → backend queries all docs.
            const selectedNames = files
                .filter(f => f.status === 'ready' && f.selected)
                .map(f => f.name);

            const result = await queryRAG(question, selectedNames.length > 0 ? selectedNames : undefined);

            const sources = result.sources.map(path => ({
                path,
                filename: path.split('/').pop()?.split('\\').pop() || path,
            }));

            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.answer,
                sources,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}. Make sure the backend is running and documents are indexed.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            textareaRef.current?.focus();
        }
    }, [input, isLoading]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestion = (text: string) => {
        setInput(text);
        textareaRef.current?.focus();
    };

    const clearChat = () => setMessages([]);

    return (
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Topbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 flex-shrink-0">
                <div>
                    <h1 className="text-sm font-semibold text-foreground">Chat</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {hasReadyFiles
                            ? `${files.filter(f => f.status === 'ready').length} document${files.filter(f => f.status === 'ready').length !== 1 ? 's' : ''} indexed`
                            : 'No documents indexed yet'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground gap-1.5"
                        >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                            Clear
                        </Button>
                    )}
                    <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${hasReadyFiles ? 'bg-emerald-400' : 'bg-muted-foreground/40'}`} />
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="px-6 py-6 h-full">
                    {messages.length === 0 && !isLoading ? (
                        <EmptyState hasFiles={hasReadyFiles} onSuggestionClick={handleSuggestion} />
                    ) : (
                        <div className="space-y-5 max-w-3xl mx-auto">
                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                            {isLoading && <TypingIndicator />}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Suggestion chips when empty and has files */}
            {messages.length === 0 && hasReadyFiles && (
                <div className="px-6 pb-2">
                    <div className="flex gap-2 flex-wrap max-w-3xl mx-auto">
                        {['Summarize the key points', 'What are the main conclusions?', 'List all action items'].map(s => (
                            <button
                                key={s}
                                onClick={() => handleSuggestion(s)}
                                className="text-xs px-3 py-1.5 rounded-full glass text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150 border border-transparent"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input bar */}
            <div className="px-6 pb-6 pt-3 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                    <div className={`relative glass rounded-2xl transition-all duration-200 ${isLoading ? 'opacity-60' : 'hover:border-primary/30 focus-within:border-primary/50 focus-within:glow-purple-sm'}`}>
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={hasReadyFiles ? 'Ask a question about your documents…' : 'Upload documents first to start chatting…'}
                            disabled={isLoading || !hasReadyFiles}
                            rows={1}
                            className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3.5 pr-14 pl-4 text-sm placeholder:text-muted-foreground/50 min-h-0 max-h-36 overflow-y-auto"
                            style={{ fieldSizing: 'content' } as React.CSSProperties}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading || !hasReadyFiles}
                            size="sm"
                            className="absolute right-2.5 bottom-2.5 h-8 w-8 p-0 rounded-xl glow-purple-sm disabled:opacity-30 disabled:glow-none"
                        >
                            {isLoading ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                        Press <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-mono">Enter</kbd> to send ·{' '}
                        <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-mono">Shift+Enter</kbd> for new line
                    </p>
                </div>
            </div>
        </div>
    );
}
