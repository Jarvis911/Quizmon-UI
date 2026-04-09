import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, Loader2, Save } from "lucide-react";
import AgentChat, { Message as AgentMessage } from "@/components/agent/AgentChat";
import LiveCanvas from "@/components/agent/LiveCanvas";
import { io, Socket } from "socket.io-client";
import apiClient, { BASE_URL } from "@/api/client";
import endpoints from "@/api/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Layout as LayoutIcon } from "lucide-react";
import { QuizData, Question as QuizQuestion } from "@/components/agent/LiveCanvas";
import { sanitizeError } from "@/lib/utils";
import { History, Plus, Trash2, MoreVertical, Search, Edit2, PanelLeftOpen, PanelLeftClose, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type Session = {
    id: number;
    title: string;
    updatedAt: string;
};

type AgentUpdatePayload = {
    suggestedTitle?: string;
    suggestedDescription?: string;
    suggestedCategory?: string;
    questions?: QuizQuestion[];
    // Sometimes backend might evolve; keep extra fields
    [k: string]: any;
};

const AgenticQuizWorkspace = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [quizData, setQuizData] = useState<QuizData>({
        title: "Tạo quiz cùng Quizmon Agent",
        description: "Tạo quiz cùng Quizmon Agent",
        questions: []
    });
    const [messages, setMessages] = useState<AgentMessage[]>([
        { role: "agent", text: "Chào bạn! Mình là Quizmon Agent. Bạn muốn tạo quiz về chủ đề gì?" }
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"chat" | "canvas">("chat");

    // History state
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiClient.get(endpoints.category);
                setCategories(res.data);
                if (res.data.length > 0) setSelectedCategoryId(String(res.data[0].id));
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await apiClient.get(endpoints.ai_agentic_sessions);
            setSessions(res.data);
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        const newSocket = io(BASE_URL, {
            auth: { token },
            transports: ["websocket"]
        });

        newSocket.on("connect", () => {
            console.log("Connected to Agentic AI Socket");
        });
        
        newSocket.on("connect_error", (err) => {
        });

        newSocket.on("agentUpdate", (data: AgentUpdatePayload) => {
            // Update Session ID if it's new
            if (data.sessionId && data.sessionId !== currentSessionId) {
                setCurrentSessionId(data.sessionId);
                fetchSessions(); // Refresh list to show new session
            }

            setQuizData((prev) => {
                const next: QuizData = {
                    title: data?.suggestedTitle || prev.title,
                    description:
                        data?.suggestedDescription ||
                        prev.description ||
                        data?.suggestedTitle ||
                        prev.title,
                    suggestedCategory: data?.suggestedCategory ?? prev.suggestedCategory,
                    questions: Array.isArray(data?.questions) ? data.questions : prev.questions,
                };

                setMessages((m) => [
                    ...m,
                    {
                        role: "agent",
                        text: `Mình đã cập nhật quiz: "${next.title}" (${next.questions.length} câu). Bạn muốn thêm/sửa/xoá gì tiếp?`,
                    },
                ]);

                return next;
            });

            setIsGenerating(false);
        });

        newSocket.on("error", (err) => {
            const displayError = sanitizeError(err, "Không thể kết nối với Agent. Vui lòng thử lại.");
            showAlert({ title: "Lỗi", message: displayError, type: "error" });
            setMessages((prev) => [
                ...prev,
                { role: "agent", text: `Mình gặp lỗi khi xử lý: ${displayError}. Bạn thử lại giúp mình nhé.` }
            ]);
            setIsGenerating(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, showAlert]);

    const handleSendMessage = (message: string) => {
        if (!socket || !message.trim()) return;
        setIsGenerating(true);
        setMessages((prev) => [...prev, { role: "user", text: message }]);
        socket.emit("agentChat", { message, sessionId: currentSessionId });
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([
            { role: "agent", text: "Chào bạn! Mình bắt đầu một phiên hội thoại mới nhé. Bạn muốn tạo quiz về chủ đề gì?" }
        ]);
        setQuizData({
            title: "Quiz Mới Tuyệt Vời",
            description: "Quiz Mới Tuyệt Vời",
            questions: []
        });
    };

    const selectSession = async (session: Session) => {
        if (session.id === currentSessionId) return;

        setIsGenerating(true);
        try {
            const res = await apiClient.get(endpoints.ai_agentic_session(session.id));
            const { messages: dbMessages } = res.data;

            // Map DB messages to UI format
            const uiMessages: AgentMessage[] = dbMessages.map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'agent',
                text: m.role === 'model' ? JSON.parse(m.text).suggestedTitle ? `Hệ thống đã nạp lại trạng thái: ${JSON.parse(m.text).suggestedTitle}` : 'Cập nhật từ Agent' : m.text
            }));

            // Find last model message to restore canvas
            const modelMessages = dbMessages.filter((m: any) => m.role === 'model');
            if (modelMessages.length > 0) {
                const lastModelMsg = modelMessages[modelMessages.length - 1];
                try {
                    const lastData = JSON.parse(lastModelMsg.text);
                    setQuizData({
                        title: lastData.suggestedTitle || "Quiz Mới",
                        description: lastData.suggestedDescription || "",
                        questions: lastData.questions || [],
                        suggestedCategory: lastData.suggestedCategory
                    });
                } catch (e) {
                    console.error("Failed to parse last model message", e);
                }
            } else {
                // Reset canvas if no model messages
                setQuizData({ title: "Cuộc hội thoại mới", description: "", questions: [] });
            }

            setMessages(uiMessages);
            setCurrentSessionId(session.id);
            if (window.innerWidth < 1024) {
                setActiveTab('chat');
                setShowHistory(false);
            }
        } catch (err) {
            showAlert({ title: "Lỗi", message: "Không thể tải hội thoại.", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteSession = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const confirmed = await showConfirm({
            title: "Xóa hội thoại",
            message: "Bạn có chắc muốn xóa cuộc hội thoại này không?",
            type: "confirm"
        });
        if (!confirmed) return;

        try {
            await apiClient.delete(endpoints.ai_agentic_session_delete(id));
            setSessions(prev => prev.filter(s => s.id !== id));
            if (currentSessionId === id) handleNewChat();
        } catch (err) {
            showAlert({ title: "Lỗi", message: "Không thể xóa hội thoại.", type: "error" });
        }
    };

    const handleSave = async () => {
        if (quizData.questions.length === 0) {
            showAlert({ title: "Nhắc nhở", message: "Bạn cần có ít nhất 1 câu hỏi để lưu quiz.", type: "warning" });
            return;
        }
        if (!selectedCategoryId) {
            showAlert({ title: "Nhắc nhở", message: "Vui lòng chọn danh mục trước khi lưu quiz.", type: "warning" });
            return;
        }

        const confirmed = await showConfirm({
            title: "Xác nhận lưu",
            message: "Bạn có chắc muốn lưu quiz này và chuyển sang bộ chỉnh sửa?",
            type: "confirm"
        });

        if (!confirmed) return;

        setIsSaving(true);
        try {
            const res = await apiClient.post(endpoints.ai_agentic_save, {
                title: quizData.title,
                description: quizData.description || quizData.title,
                categoryId: Number(selectedCategoryId),
                questions: quizData.questions
            });

            showAlert({ title: "Thành công", message: "Đã lưu quiz thành công!", type: "success" });
            navigate(`/quiz/${res.data.id}/editor`);
        } catch (err: any) {
            showAlert({
                title: "Lỗi",
                message: sanitizeError(err, "Không thể lưu quiz. Vui lòng thử lại."),
                type: "error"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Header */}
            <header className="h-auto lg:h-16 border-b border-white/10 flex flex-col lg:flex-row items-center justify-between px-4 lg:px-6 py-3 lg:py-0 bg-white/10 backdrop-blur-xl shrink-0 z-20 gap-3">
                <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-xl hover:bg-white/5 h-9 w-9"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHistory(!showHistory)}
                            className="rounded-xl hover:bg-white/5 h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                            title={showHistory ? "Ẩn lịch sử" : "Hiện lịch sử"}
                        >
                            {showHistory ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                        </Button>
                        <div>
                            <h1 className="text-sm lg:text-lg font-black tracking-tight flex items-center gap-2">
                                <span className="hidden sm:inline">Quizmon Agent</span>
                                <span className="sm:hidden">Agent</span>
                            </h1>
                            <p className="hidden xs:block text-[8px] lg:text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                Canvas & AI
                            </p>
                        </div>
                    </div>

                    {/* Mobile Save Button (Visible only on very small screens if needed, otherwise in the second row) */}
                    <div className="lg:hidden flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-primary text-primary-foreground font-black px-4 rounded-xl shadow-lg shadow-primary/20 text-xs gap-1.5 h-9"
                            onClick={handleSave}
                            disabled={isSaving || isGenerating || !selectedCategoryId}
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Lưu
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-3">
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="flex-1 lg:w-[180px] h-9 lg:h-10 rounded-xl bg-white/5 border-white/10 text-[11px] lg:text-xs font-bold">
                            <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-3xl shadow-2xl">
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)} className="text-xs font-bold focus:bg-primary/20">
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        className="hidden lg:flex bg-primary text-primary-foreground font-black px-6 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all gap-2"
                        onClick={handleSave}
                        disabled={isSaving || isGenerating || !selectedCategoryId}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu Quiz
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative pb-16 lg:pb-0">
                {/* Backdrop for mobile history */}
                {showHistory && (
                    <div 
                        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
                        onClick={() => setShowHistory(false)}
                    />
                )}

                {/* Left Pane: History Sidebar (Collapsible) */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-72 bg-card/60 backdrop-blur-3xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                    ${showHistory ? 'translate-x-0' : '-translate-x-full lg:hidden'}
                    flex flex-col shadow-2xl
                `}>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Lịch sử
                        </h2>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                onClick={handleNewChat}
                                title="Bắt đầu hội thoại mới"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary lg:hidden"
                                onClick={() => setShowHistory(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {isHistoryLoading ? (
                            <div className="flex flex-col items-center justify-center h-20 opacity-50">
                                <Loader2 className="w-4 h-4 animate-spin mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Đang tải...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-10 px-4 opacity-40">
                                <p className="text-[10px] font-black uppercase tracking-widest">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => selectSession(session)}
                                    className={`
                                        group relative p-3 rounded-xl cursor-pointer transition-all border border-transparent
                                        ${currentSessionId === session.id
                                            ? 'bg-primary/10 border-primary/20 shadow-lg'
                                            : 'hover:bg-white/5'}
                                    `}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <p className={`text-xs font-black truncate max-w-[180px] ${currentSessionId === session.id ? 'text-primary' : 'text-foreground'}`}>
                                            {session.title || "Cuộc hội thoại mới"}
                                        </p>
                                        <p className="text-[9px] font-bold text-muted-foreground opacity-60">
                                            {format(new Date(session.updatedAt), 'HH:mm, dd/MM', { locale: vi })}
                                        </p>
                                    </div>

                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                            onClick={(e) => deleteSession(e, session.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-white/5 bg-foreground/5 flex items-center justify-between lg:hidden">
                        <Button
                            variant="outline"
                            className="w-full text-xs font-black uppercase rounded-xl border-white/10"
                            onClick={() => setShowHistory(false)}
                        >
                            Đóng lịch sử
                        </Button>
                    </div>
                </aside>

                {/* Mobile History Toggle (Visible only when history is closed) */}
                {!showHistory && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden fixed top-20 left-4 z-30 bg-card border border-white/10 shadow-xl rounded-xl h-10 w-10 text-primary"
                        onClick={() => setShowHistory(true)}
                    >
                        <History className="w-5 h-5" />
                    </Button>
                )}

                {/* Middle Pane: Chat */}
                <aside className={`
                    ${activeTab === 'chat' ? 'flex' : 'hidden'} 
                    lg:flex lg:flex-1 lg:max-w-[450px] border-r border-white/5 bg-white/5 backdrop-blur-3xl flex-col relative z-10 shadow-2xl w-full
                `}>
                    <AgentChat messages={messages} onSend={handleSendMessage} isGenerating={isGenerating} />
                </aside>

                {/* Right Pane: Live Canvas */}
                <section className={`
                    ${activeTab === 'canvas' ? 'flex' : 'hidden'} 
                    lg:flex flex-1 overflow-y-auto bg-transparent relative custom-scrollbar p-4 lg:p-8 w-full
                `}>
                    <div className="max-w-4xl mx-auto w-full">
                        <LiveCanvas quizData={quizData} isGenerating={isGenerating} />
                    </div>
                </section>

                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-6 z-30">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
                    >
                        <MessageSquare className={`w-5 h-5 ${activeTab === 'chat' ? 'fill-primary/20' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Hội thoại</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('canvas')}
                        className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'canvas' ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
                    >
                        <LayoutIcon className={`w-5 h-5 ${activeTab === 'canvas' ? 'fill-primary/20' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Bản vẽ</span>
                    </button>
                    <button
                        onClick={() => setShowHistory(true)}
                        className="flex flex-col items-center gap-1 text-muted-foreground opacity-50"
                    >
                        <History className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Lịch sử</span>
                    </button>
                </nav>
            </main>
        </div>
    );
};

export default AgenticQuizWorkspace;
