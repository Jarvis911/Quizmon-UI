import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, User, Loader2, Bot } from "lucide-react";

export interface Message {
    role: "user" | "agent";
    text: string;
}

interface AgentChatProps {
    messages: Message[];
    onSend: (message: string) => void;
    isGenerating: boolean;
}

const AgentChat = ({ messages, onSend, isGenerating }: AgentChatProps) => {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isGenerating) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${msg.role === "user" ? "bg-primary/20 border-primary/20" : "bg-card border-white/10 shadow-lg"}`}>
                                {msg.role === "user" ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed tracking-tight shadow-sm
                                ${msg.role === "user" 
                                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                                    : "bg-white/40 border border-white/10 rounded-tl-none text-foreground/90 backdrop-blur-md"
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {isGenerating && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="max-w-[85%] flex gap-3">
                            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-card border border-white/10 shadow-lg">
                                <Bot className="w-4 h-4 text-primary animate-pulse" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/40 border border-white/10 rounded-tl-none backdrop-blur-md">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/10 backdrop-blur-2xl">
                <div className="relative group">
                    <Textarea 
                        placeholder="Nhập yêu cầu cho Agent... (e.g., 'Tạo quiz về lịch sử 12')"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="min-h-[100px] bg-foreground/5 border-2 border-white/5 focus:border-primary/50 rounded-2xl resize-none text-sm font-medium p-4 transition-all pr-12 group-hover:bg-foreground/[0.07]"
                    />
                    <Button 
                        size="icon"
                        onClick={handleSend}
                        disabled={isGenerating || !input.trim()}
                        className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2 justify-center">
                    <Sparkles className="w-3 h-3" />
                    Quizmon Intelligence Agent
                </div>
            </div>
        </div>
    );
};

export default AgentChat;
