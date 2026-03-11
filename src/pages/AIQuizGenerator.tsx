import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import endpoints from "@/api/api";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
    Sparkles, Upload, FileText, Loader2, Wand2, X, AlertCircle
} from "lucide-react";
import AIGenerationLimit from "@/components/AIGenerationLimit";
import { useEffect } from "react";

const QUESTION_TYPES = [
    { value: "BUTTONS", label: "Trắc nghiệm (1 đáp án)", description: "Chọn 1 đáp án đúng" },
    { value: "CHECKBOXES", label: "Nhiều đáp án", description: "Chọn nhiều đáp án đúng" },
    { value: "TYPEANSWER", label: "Tự nhập câu trả lời", description: "Người chơi gõ đáp án" },
    { value: "REORDER", label: "Sắp xếp thứ tự", description: "Sắp xếp các mục đúng thứ tự" },
];

const AIQuizGenerator = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [instruction, setInstruction] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [questionCount, setQuestionCount] = useState(10);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(["BUTTONS"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);
    const [usageMetrics, setUsageMetrics] = useState<any[]>([]);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await axios.get(endpoints.subscription_current, {
                headers: { Authorization: token }
            });
            setSubscription(res.data);
            setUsageMetrics(res.data.usageMetrics || []);
        } catch (err) {
            console.error("Failed to fetch subscription", err);
        }
    };

    const aiUsage = usageMetrics.find(u => u.key === 'ai_generations')?.value || 0;
    const aiLimit = subscription?.plan?.features?.find((f: any) => f.featureKey === 'AI_GENERATION')?.limit ?? null;
    const isAtLimit = aiLimit !== null && aiUsage >= aiLimit;

    const toggleType = (typeValue: string) => {
        setSelectedTypes((prev) =>
            prev.includes(typeValue)
                ? prev.filter((t) => t !== typeValue)
                : [...prev, typeValue]
        );
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPdfFile(file);
    };

    const handleGenerate = async () => {
        if (!instruction && !pdfFile) {
            setError("Vui lòng nhập yêu cầu hoặc tải lên file PDF");
            return;
        }
        if (selectedTypes.length === 0) {
            setError("Vui lòng chọn ít nhất một loại câu hỏi");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            if (instruction) formData.append("instruction", instruction);
            if (pdfFile) formData.append("pdfFile", pdfFile);
            formData.append("questionCount", String(questionCount));
            formData.append("questionTypes", JSON.stringify(selectedTypes));

            const res = await axios.post(endpoints.ai_create_job, formData, {
                headers: {
                    Authorization: token,
                    "Content-Type": "multipart/form-data",
                },
            });

            navigate(`/ai/review/${res.data.id}`);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Lỗi tạo quiz. Vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center px-4 py-4 min-h-[calc(100vh-80px)] items-center relative">
            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
                    <div className="w-80 h-80">
                        <DotLottieReact
                            src="https://lottie.host/d4ac19c1-a6a1-462d-a523-d14912c1663e/BcdTi4vEb3.lottie"
                            loop
                            autoplay
                        />
                    </div>
                    <div className="text-center mt-4">
                        <h2 className="text-3xl font-black text-foreground mb-2 animate-pulse">Đang Khởi Tạo AI...</h2>
                        <p className="text-muted-foreground font-bold tracking-widest uppercase text-sm">Hệ thống đang chuẩn bị môi trường tạo câu hỏi</p>
                    </div>
                </div>
            )}
            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3 border border-primary/20 shadow-sm">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        Powered by AI
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter mb-2 drop-shadow-md">
                        Tạo Quiz với AI
                    </h1>
                    <p className="text-muted-foreground font-bold max-w-lg mx-auto leading-relaxed text-sm">
                        Nhập yêu cầu hoặc tải lên tài liệu PDF để AI tự động tạo câu hỏi
                    </p>
                </div>

                {/* Subscription Info */}
                <div className="mb-6">
                    <AIGenerationLimit
                        used={aiUsage}
                        limit={aiLimit}
                        renewalDate={subscription?.currentPeriodEnd}
                    />
                </div>

                {/* Main Card */}
                <div className="bg-card/60 backdrop-blur-3xl rounded-4xl shadow-2xl border border-white/10 p-6 lg:p-8 relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                        {/* Left Column: Instruction & PDF */}
                        <div className="space-y-6">

                            {/* Text Instruction */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
                                    <Wand2 className="w-3.5 h-3.5 text-primary" />
                                    Yêu cầu / Chủ đề
                                </Label>
                                <Textarea
                                    placeholder="Ví dụ: Tạo quiz về lịch sử Việt Nam thời kỳ phong kiến, tập trung vào các triều đại Lý, Trần, Lê..."
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    className="min-h-[120px] bg-foreground/5 border-2 border-white/5 focus:border-primary/50 rounded-2xl resize-none text-foreground font-medium p-4 transition-all text-sm"
                                />
                            </div>

                            {/* PDF Upload */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                    File PDF (tuỳ chọn)
                                </Label>
                                {!pdfFile ? (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer shadow-inner
                          ${dragOver
                                                ? "border-primary bg-primary/10"
                                                : "border-foreground/10 hover:border-primary/40 hover:bg-foreground/5 bg-foreground/5"
                                            }`}
                                        onClick={() => document.getElementById("pdf-input")?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                                        <p className="text-xs text-foreground font-bold">
                                            Kéo thả file PDF hoặc <span className="text-primary font-black underline underline-offset-4 decoration-2">chọn file</span>
                                        </p>
                                        <input
                                            id="pdf-input"
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 bg-primary/10 rounded-2xl p-3 border border-primary/20 shadow-lg">
                                        <div className="p-2 bg-primary text-primary-foreground rounded-xl">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-0.5">Tài liệu</p>
                                            <p className="text-xs font-black text-foreground truncate">{pdfFile.name}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            onClick={() => setPdfFile(null)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="space-y-6">
                            {/* Question Count */}
                            <div className="space-y-3 bg-foreground/5 p-5 rounded-3xl border border-white/5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between items-center mb-1">
                                    Số câu hỏi
                                    <span className="text-xl font-black text-primary tabular-nums">{questionCount}</span>
                                </Label>
                                <Slider
                                    value={[questionCount]}
                                    onValueChange={(v) => setQuestionCount(v[0])}
                                    min={1}
                                    max={30}
                                    step={1}
                                    className="py-2"
                                />
                                <div className="flex justify-between text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                                    <span>Min: 1</span>
                                    <span>Max: 30</span>
                                </div>
                            </div>

                            {/* Question Types */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loại câu hỏi (chọn nhiều)</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {QUESTION_TYPES.map((type) => (
                                        <div
                                            key={type.value}
                                            onClick={() => toggleType(type.value)}
                                            className={`flex items-start gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all hover:translate-x-1
                            ${selectedTypes.includes(type.value)
                                                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/5"
                                                    : "border-white/5 bg-foreground/5 hover:border-white/10"
                                                }`}
                                        >
                                            <Checkbox
                                                checked={selectedTypes.includes(type.value)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className="text-xs font-black text-foreground tracking-tight">{type.label}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium opacity-60">{type.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4 relative z-10">
                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 text-red-500 bg-red-500/10 rounded-2xl p-4 text-xs font-bold border border-red-500/20 animate-shake">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={loading || (!instruction && !pdfFile) || isAtLimit}
                            className="w-full h-16 text-xl font-black bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8">
                                        <DotLottieReact
                                            src="https://lottie.host/d4ac19c1-a6a1-462d-a523-d14912c1663e/BcdTi4vEb3.lottie"
                                            loop
                                            autoplay
                                        />
                                    </div>
                                    Tạo Quiz ngay
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIQuizGenerator;
