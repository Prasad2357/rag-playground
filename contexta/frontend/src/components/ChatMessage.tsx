import type { Message } from '@/types';

// Typing indicator
export function TypingIndicator() {
    return (
        <div className="flex items-start gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '160ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '320ms' }} />
                </div>
            </div>
        </div>
    );
}

// Source chips
function SourceChips({ sources }: { sources: { path: string; filename: string }[] }) {
    if (!sources || sources.length === 0) return null;

    const unique = Array.from(new Map(sources.map(s => [s.filename, s])).values());

    return (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
            {unique.map((src) => (
                <span
                    key={src.path}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/20"
                >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {src.filename}
                </span>
            ))}
        </div>
    );
}

// Format message content with basic markdown-ish rendering
function MessageContent({ content }: { content: string }) {
    // Split on double newlines for paragraphs, handle bold **text**
    const parts = content.split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
            return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
            return (
                <li key={i} className="ml-3 text-foreground/85">
                    {line.slice(2)}
                </li>
            );
        }
        if (line === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-foreground/85">{line}</p>;
    });

    return <div className="text-sm leading-relaxed space-y-0.5">{parts}</div>;
}

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    if (isUser) {
        return (
            <div className="flex justify-end animate-slide-up">
                <div className="max-w-[75%]">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 animate-slide-up">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 glow-purple-sm">
                <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <div className="max-w-[80%]">
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
                    <MessageContent content={message.content} />
                    {message.sources && message.sources.length > 0 && (
                        <SourceChips sources={message.sources} />
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

interface EmptyStateProps {
    hasFiles: boolean;
    onSuggestionClick?: (suggestion: string) => void;
}

export function EmptyState({ hasFiles, onSuggestionClick }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 select-none">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 glow-purple">
                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
                {hasFiles ? 'Ask anything' : 'Upload a document'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                {hasFiles
                    ? 'Your documents are indexed and ready. Ask me anything about their content.'
                    : 'Upload PDFs, text files, or Word documents from the sidebar to start chatting with your data.'}
            </p>

            {hasFiles && (
                <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
                    {[
                        'Summarize the key points',
                        'What are the main conclusions?',
                        'List all action items mentioned',
                    ].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => onSuggestionClick?.(suggestion)}
                            className="text-left px-4 py-2.5 rounded-xl glass text-sm text-muted-foreground hover:text-foreground hover:bg-primary/8 cursor-pointer transition-all duration-150 border border-transparent hover:border-primary/20 w-full"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
