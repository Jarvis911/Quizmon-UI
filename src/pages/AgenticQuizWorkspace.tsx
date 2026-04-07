import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, Loader2, Save } from "lucide-react";
import AgentChat, { Message as AgentMessage } from "@/components/agent/AgentChat";
import LiveCanvas from "@/components/agent/LiveCanvas";
import { io, Socket } from "socket.io-client";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type QuizQuestion = {
    id?: string;
    questionText: string;
    questionType: string;
    optionsData: any;
};

type QuizData = {
    title: string;
    description?: string;
    suggestedCategory?: string;
    questions: QuizQuestion[];
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
        title: "Quiz Mới Tuyệt Vời",
        description: "Quiz Mới Tuyệt Vời",
        questions: []
    });
    const [messages, setMessages] = useState<AgentMessage[]>([
        { role: "agent", text: "Chào bạn! Mình là Quizmon Agent. Bạn muốn tạo quiz về chủ đề gì?" }
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

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
    }, []);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
            auth: { token },
            transports: ["websocket"]
        });

        newSocket.on("connect", () => {
            console.log("Connected to Agentic AI Socket");
        });

        newSocket.on("agentUpdate", (data: AgentUpdatePayload) => {
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
            showAlert({ title: "Lỗi", message: err.message, type: "error" });
            setMessages((prev) => [
                ...prev,
                { role: "agent", text: `Mình gặp lỗi khi xử lý: ${err?.message || "Không rõ nguyên nhân"}. Bạn thử lại giúp mình nhé.` }
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
        socket.emit("agentChat", { message });
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
                message: err.response?.data?.message || "Không thể lưu quiz. Vui lòng thử lại.", 
                type: "error" 
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/10 backdrop-blur-xl shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(-1)}
                        className="rounded-xl hover:bg-white/5"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                            Không gian làm việc Agent
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                            Bản vẽ Trực tiếp & Cố vấn AI
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl bg-white/5 border-white/10 text-xs font-bold">
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
                        className="bg-primary text-primary-foreground font-black px-6 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all gap-2"
                        onClick={handleSave}
                        disabled={isSaving || isGenerating || !selectedCategoryId}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu Quiz
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Pane: Chat */}
                <aside className="w-[400px] border-r border-white/5 bg-white/5 backdrop-blur-3xl flex flex-col relative z-10 shadow-2xl">
                    <AgentChat messages={messages} onSend={handleSendMessage} isGenerating={isGenerating} />
                </aside>

                {/* Right Pane: Live Canvas */}
                <section className="flex-1 overflow-y-auto bg-transparent relative custom-scrollbar p-8">
                    <div className="max-w-4xl mx-auto">
                        <LiveCanvas quizData={quizData} isGenerating={isGenerating} />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AgenticQuizWorkspace;
