import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Check,
    X,
    RotateCcw,
    Pencil,
    Trash2,
    Loader2,
    Sparkles,
    Save,
    Plus,
    ChevronLeft,
    AlertCircle,
    PartyPopper,
} from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type {
    AIGenerationJob,
    AIGeneratedQuestion,
    AIQuestionStatus,
    Category,
} from "@/types";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    PENDING: {
        label: "Chờ duyệt",
        color: "text-amber-500",
        bg: "bg-amber-500/10 border-amber-500/20",
    },
    APPROVED: {
        label: "Đã duyệt",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    REJECTED: {
        label: "Từ chối",
        color: "text-red-500",
        bg: "bg-red-500/10 border-red-500/20",
    },
    REGENERATING: {
        label: "Đang tạo lại",
        color: "text-blue-500",
        bg: "bg-blue-500/10 border-blue-500/20",
    },
};

const TYPE_LABELS: Record<string, string> = {
    BUTTONS: "Trắc nghiệm",
    CHECKBOXES: "Nhiều đáp án",
    TYPEANSWER: "Tự nhập",
    REORDER: "Sắp xếp",
    RANGE: "Khoảng giá trị",
    LOCATION: "Vị trí",
};

function RecenterMap({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] !== 0) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

function LocationPickerHelper({ setLocation }: { setLocation: (lat: number, lon: number) => void }) {
    const map = useMapEvents({
        click(e) {
            setLocation(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });
    return null;
}

const AIQuizReview = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();

    const [job, setJob] = useState<AIGenerationJob | null>(null);
    const [questions, setQuestions] = useState<AIGeneratedQuestion[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const pollTimerRef = useRef<any>(null);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [editOptions, setEditOptions] = useState<
        Array<{ text: string; isCorrect?: boolean; order?: number }>
    >([]);
    const [editCorrectAnswer, setEditCorrectAnswer] = useState("");
    const [editRange, setEditRange] = useState({ min: 0, max: 100, val: 50 });
    const [editLocation, setEditLocation] = useState({ 
        lat: 0, 
        lon: 0, 
        radius1000: 5000, 
        radius750: 15000, 
        radius500: 30000,
        mapType: 'SIMPLE' as 'SIMPLE' | 'SATELLITE'
    });

    // Regenerate dialog
    const [regenDialogOpen, setRegenDialogOpen] = useState(false);
    const [regenQuestionId, setRegenQuestionId] = useState<number | null>(null);
    const [regenFeedback, setRegenFeedback] = useState("");

    // Create quiz dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const [quizCategoryId, setQuizCategoryId] = useState<string>("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [creating, setCreating] = useState(false);

    useUnsavedChanges(editing);

    const fetchJob = useCallback(async () => {
        try {
            const res = await apiClient.get(endpoints.ai_job(Number(jobId)));
            setJob(res.data);
            setQuestions(res.data.generatedQuestions || []);
            
            // Set suggestions as initial defaults
            if (res.data.suggestedTitle) {
                setQuizTitle(prev => prev || res.data.suggestedTitle);
            }
            if (res.data.suggestedDescription) {
                setQuizDescription(prev => prev || res.data.suggestedDescription);
            }
            if (res.data.suggestedCategoryId) {
                setQuizCategoryId(prev => prev || String(res.data.suggestedCategoryId));
            }
        } catch {
            console.error("Failed to fetch job");
        } finally {
            setLoading(false);
        }
    }, [jobId, token]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    // Polling logic for PROCESSING jobs
    useEffect(() => {
        if (job?.status === "PROCESSING" || job?.status === "PENDING") {
            pollTimerRef.current = setTimeout(() => {
                fetchJob();
            }, 3000); // Poll every 3 seconds
        }

        return () => {
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, [job?.status, fetchJob]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiClient.get(endpoints.category);
                setCategories(res.data);
            } catch {
                console.error("Failed to fetch categories");
            }
        };
        fetchCategories();
    }, []);

    const selectedQuestion = questions[selectedIdx] || null;

    // Start editing
    const startEdit = (q: AIGeneratedQuestion) => {
        setEditing(true);
        setEditText(q.questionText);
        if (q.questionType === "TYPEANSWER") {
            setEditCorrectAnswer(q.optionsData?.correctAnswer || "");
        } else if (q.questionType === "RANGE") {
            setEditRange({
                min: q.optionsData?.minValue ?? 0,
                max: q.optionsData?.maxValue ?? 100,
                val: q.optionsData?.correctValue ?? 50
            });
        } else if (q.questionType === "LOCATION") {
            setEditLocation({
                lat: q.optionsData?.correctLatitude ?? 0,
                lon: q.optionsData?.correctLongitude ?? 0,
                radius1000: q.optionsData?.radius1000 ?? 5000,
                radius750: q.optionsData?.radius750 ?? 15000,
                radius500: q.optionsData?.radius500 ?? 30000,
                mapType: q.optionsData?.mapType ?? 'SIMPLE'
            });
        } else {
            setEditOptions(
                (q.optionsData?.options || []).map((o) => ({ ...o }))
            );
        }
    };

    const cancelEdit = () => {
        setEditing(false);
        setEditText("");
        setEditOptions([]);
        setEditCorrectAnswer("");
        setEditRange({ min: 0, max: 100, val: 50 });
        setEditLocation({ 
            lat: 0, 
            lon: 0, 
            radius1000: 5000, 
            radius750: 15000, 
            radius500: 30000,
            mapType: 'SIMPLE'
        });
    };

    // Save edit
    const saveEdit = async () => {
        if (!selectedQuestion) return;
        setActionLoading(selectedQuestion.id);
        try {
            let optionsData: Record<string, unknown>;
            if (selectedQuestion.questionType === "TYPEANSWER") {
                optionsData = { correctAnswer: editCorrectAnswer };
            } else if (selectedQuestion.questionType === "RANGE") {
                optionsData = {
                    minValue: editRange.min,
                    maxValue: editRange.max,
                    correctValue: editRange.val
                };
            } else if (selectedQuestion.questionType === "LOCATION") {
                optionsData = {
                    correctLatitude: editLocation.lat,
                    correctLongitude: editLocation.lon,
                    radius1000: editLocation.radius1000,
                    radius750: editLocation.radius750,
                    radius500: editLocation.radius500,
                    mapType: editLocation.mapType
                };
            } else {
                optionsData = { options: editOptions };
            }

            await apiClient.put(
                endpoints.ai_job_question_content(Number(jobId), selectedQuestion.id),
                { questionText: editText, optionsData }
            );
            await fetchJob();
            setEditing(false);
        } catch {
            showAlert({
                title: "Lỗi",
                message: "Lỗi khi lưu chỉnh sửa",
                type: "error"
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Approve/Reject
    const updateStatus = async (
        questionId: number,
        status: AIQuestionStatus
    ) => {
        setActionLoading(questionId);
        try {
            await apiClient.put(
                endpoints.ai_job_question(Number(jobId), questionId),
                { status }
            );
            await fetchJob();
        } catch {
            showAlert({
                title: "Lỗi",
                message: "Lỗi khi cập nhật trạng thái",
                type: "error"
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Regenerate
    const handleRegenerate = async () => {
        if (!regenQuestionId) return;
        setActionLoading(regenQuestionId);
        setRegenDialogOpen(false);
        try {
            await apiClient.post(
                endpoints.ai_job_question_regenerate(Number(jobId), regenQuestionId),
                { userFeedback: regenFeedback || undefined }
            );
            await fetchJob();
            setRegenFeedback("");
        } catch {
            showAlert({
                title: "Lỗi",
                message: "Lỗi khi tạo lại câu hỏi",
                type: "error"
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Delete question
    const deleteQuestion = async (questionId: number) => {
        const confirmed = await showConfirm({
            title: "Xác nhận xóa",
            message: "Bạn có chắc muốn xoá câu hỏi này?",
            type: "confirm"
        });
        if (!confirmed) return;
        
        setActionLoading(questionId);
        try {
            await apiClient.delete(
                endpoints.ai_job_question_delete(Number(jobId), questionId)
            );
            await fetchJob();
            if (selectedIdx >= questions.length - 1) {
                setSelectedIdx(Math.max(0, questions.length - 2));
            }
        } catch {
            showAlert({
                title: "Lỗi",
                message: "Lỗi khi xoá câu hỏi",
                type: "error"
            });
        } finally {
            setActionLoading(null);
        }
    };

    // Approve all
    const approveAll = async () => {
        for (const q of questions) {
            if (q.status === "PENDING") {
                await updateStatus(q.id, "APPROVED");
            }
        }
    };

    // Create quiz
    const handleCreateQuiz = async () => {
        if (!quizTitle || !quizCategoryId) return;
        setCreating(true);
        try {
            const res = await apiClient.post(
                endpoints.ai_job_approve_all(Number(jobId)),
                {
                    title: quizTitle,
                    description: quizDescription || quizTitle,
                    categoryId: Number(quizCategoryId),
                }
            );
            setCreateDialogOpen(false);
            setEditing(false);
            requestAnimationFrame(() => {
                navigate(`/quiz/${res.data.id}/editor`);
            });
        } catch (err: any) {
            showAlert({
                title: "Lỗi",
                message: err.response?.data?.message || "Lỗi tạo quiz",
                type: "error"
            });
        } finally {
            setCreating(false);
        }
    };

    if (loading || job?.status === "PROCESSING" || job?.status === "PENDING") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-64 h-64 mb-4">
                    <DotLottieReact
                        src="https://lottie.host/d4ac19c1-a6a1-462d-a523-d14912c1663e/BcdTi4vEb3.lottie"
                        loop
                        autoplay
                    />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-foreground mb-2 animate-pulse">AI Đang Tạo Câu Hỏi...</h2>
                    <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center bg-card/60 backdrop-blur-xl p-12 rounded-3xl border border-white/5 shadow-2xl">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <p className="text-foreground text-xl font-black mb-8">Không tìm thấy job</p>
                    <Button
                        variant="default"
                        className="px-8 h-12 rounded-2xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        onClick={() => navigate("/ai/generate")}
                    >
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    const approvedCount = questions.filter((q) => q.status === "APPROVED").length;
    const pendingCount = questions.filter((q) => q.status === "PENDING").length;

    return (
        <div className="flex flex-col lg:flex-row gap-4 px-4 py-6 max-w-7xl mx-auto h-[calc(100vh-100px)]">
            {/* Left Sidebar — Question list */}
            <div className="lg:w-96 shrink-0 bg-card/60 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-foreground/5">
                    <button
                        onClick={() => navigate("/ai/generate")}
                        className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary mb-5 uppercase tracking-widest transition-all hover:-translate-x-1"
                    >
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <h2 className="font-black text-2xl flex items-center gap-3 text-foreground tracking-tight">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Duyệt Câu Hỏi
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 opacity-60">
                        {approvedCount}/{questions.length} đã duyệt • {pendingCount} chờ duyệt
                    </p>
                    {/* Progress bar */}
                    <div className="w-full bg-foreground/5 rounded-full h-2 mt-4 overflow-hidden border border-foreground/5">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            style={{
                                width: `${questions.length > 0 ? (approvedCount / questions.length) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Question list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {questions.map((q, i) => {
                        const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.PENDING;
                        return (
                            <div
                                key={q.id}
                                onClick={() => {
                                    setSelectedIdx(i);
                                    cancelEdit();
                                }}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedIdx === i
                                    ? "bg-primary/10 border-primary shadow-lg scale-[1.02]"
                                    : "hover:bg-foreground/5 border-transparent hover:border-foreground/10"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <span className="text-xs font-black text-muted-foreground opacity-40 tabular-nums mt-1">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${selectedIdx === i ? "text-primary" : "text-foreground"}`}>
                                            {q.questionText}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border shadow-sm ${cfg.bg} ${cfg.color}`}
                                            >
                                                {cfg.label}
                                            </Badge>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                                {TYPE_LABELS[q.questionType] || q.questionType}
                                            </span>
                                        </div>
                                    </div>
                                    {actionLoading === q.id && (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bulk Actions */}
                <div className="p-6 border-t border-foreground/5 space-y-3 bg-foreground/3 backdrop-blur-md">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full text-xs font-black uppercase tracking-[0.2em] h-12 rounded-2xl shadow-sm hover:scale-[1.02] transition-all"
                        onClick={approveAll}
                        disabled={pendingCount === 0}
                    >
                        <Check className="w-4 h-4 mr-2" /> Duyệt tất cả ({pendingCount})
                    </Button>
                    <Button
                        size="lg"
                        className="w-full text-xs font-black uppercase tracking-[0.2em] h-12 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                        onClick={() => setCreateDialogOpen(true)}
                        disabled={approvedCount === 0 && pendingCount === 0}
                    >
                        <PartyPopper className="w-4 h-4 mr-2" /> Tạo Quiz ({approvedCount + pendingCount} câu)
                    </Button>
                </div>
            </div>

            {/* Right Panel — Question detail */}
            <div className="flex-1 bg-card/60 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-y-auto custom-scrollbar">
                {selectedQuestion ? (
                    <div className="p-8 lg:p-12">
                        {/* Question header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg text-xl font-black tabular-nums">
                                    {selectedIdx + 1}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border shadow-sm ${STATUS_CONFIG[selectedQuestion.status]?.bg} ${STATUS_CONFIG[selectedQuestion.status]?.color}`}
                                        >
                                            {STATUS_CONFIG[selectedQuestion.status]?.label}
                                        </Badge>
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                            {TYPE_LABELS[selectedQuestion.questionType] ||
                                                selectedQuestion.questionType}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 bg-foreground/5 p-1.5 rounded-2xl border border-white/5">
                                {!editing && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                            onClick={() =>
                                                updateStatus(selectedQuestion.id, "APPROVED")
                                            }
                                            disabled={
                                                actionLoading === selectedQuestion.id ||
                                                selectedQuestion.status === "APPROVED"
                                            }
                                            title="Duyệt"
                                        >
                                            <Check className="w-5 h-5 font-black" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            onClick={() =>
                                                updateStatus(selectedQuestion.id, "REJECTED")
                                            }
                                            disabled={
                                                actionLoading === selectedQuestion.id ||
                                                selectedQuestion.status === "REJECTED"
                                            }
                                            title="Từ chối"
                                        >
                                            <X className="w-5 h-5 font-black" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                                            onClick={() => {
                                                setRegenQuestionId(selectedQuestion.id);
                                                setRegenDialogOpen(true);
                                            }}
                                            disabled={actionLoading === selectedQuestion.id}
                                            title="Tạo lại"
                                        >
                                            <RotateCcw className="w-5 h-5 font-black" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                                            onClick={() => startEdit(selectedQuestion)}
                                            disabled={actionLoading === selectedQuestion.id}
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil className="w-5 h-5 font-black" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-muted-foreground hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                            onClick={() => deleteQuestion(selectedQuestion.id)}
                                            disabled={actionLoading === selectedQuestion.id}
                                            title="Xoá"
                                        >
                                            <Trash2 className="w-5 h-5 font-black" />
                                        </Button>
                                    </>
                                )}
                                {editing && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-emerald-500 hover:bg-emerald-500/10 font-black uppercase tracking-widest text-xs h-10 px-6 rounded-xl"
                                            onClick={saveEdit}
                                            disabled={actionLoading === selectedQuestion.id}
                                        >
                                            <Save className="w-4 h-4 mr-2" /> Lưu Thay Đổi
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:bg-foreground/5 font-black uppercase tracking-widest text-xs h-10 px-6 rounded-xl"
                                            onClick={cancelEdit}
                                        >
                                            Huỷ
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Question text */}
                        <div className="mb-10">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mb-4 block">
                                Câu hỏi
                            </label>
                            {editing ? (
                                <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="mt-4 min-h-[120px] bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-2xl text-lg font-bold p-6 shadow-inner"
                                />
                            ) : (
                                <p className="mt-4 text-3xl font-black leading-tight text-foreground tracking-tight drop-shadow-sm">
                                    {selectedQuestion.questionText}
                                </p>
                            )}
                        </div>

                        {/* Options */}
                        <div>
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mb-4 block">
                                {selectedQuestion.questionType === "TYPEANSWER"
                                    ? "Đáp án đúng"
                                    : selectedQuestion.questionType === "REORDER"
                                        ? "Thứ tự đúng"
                                        : "Các đáp án"}
                            </label>

                            {/* TYPEANSWER */}
                            {selectedQuestion.questionType === "TYPEANSWER" && (
                                <div className="mt-3">
                                    {editing ? (
                                        <Input
                                            value={editCorrectAnswer}
                                            onChange={(e) => setEditCorrectAnswer(e.target.value)}
                                            className="h-14 bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-xl font-bold px-6 shadow-inner"
                                        />
                                    ) : (
                                        <div className="bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl p-6 shadow-sm">
                                            <p className="font-black text-emerald-500 text-lg tracking-tight">
                                                {selectedQuestion.optionsData?.correctAnswer || "—"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BUTTONS / CHECKBOXES */}
                            {(selectedQuestion.questionType === "BUTTONS" ||
                                selectedQuestion.questionType === "CHECKBOXES") && (
                                    <div className="mt-3 space-y-2">
                                        {editing
                                            ? editOptions.map((opt, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-4 bg-foreground/5 p-2 rounded-2xl border border-white/5"
                                                >
                                                    <input
                                                        type={
                                                            selectedQuestion.questionType === "BUTTONS"
                                                                ? "radio"
                                                                : "checkbox"
                                                        }
                                                        checked={opt.isCorrect || false}
                                                        onChange={() => {
                                                            if (
                                                                selectedQuestion.questionType === "BUTTONS"
                                                            ) {
                                                                setEditOptions(
                                                                    editOptions.map((o, j) => ({
                                                                        ...o,
                                                                        isCorrect: j === i,
                                                                    }))
                                                                );
                                                            } else {
                                                                setEditOptions(
                                                                    editOptions.map((o, j) =>
                                                                        j === i
                                                                            ? { ...o, isCorrect: !o.isCorrect }
                                                                            : o
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                        className="w-5 h-5 accent-primary cursor-pointer ml-2"
                                                    />
                                                    <Input
                                                        value={opt.text}
                                                        onChange={(e) =>
                                                            setEditOptions(
                                                                editOptions.map((o, j) =>
                                                                    j === i
                                                                        ? { ...o, text: e.target.value }
                                                                        : o
                                                                )
                                                            )
                                                        }
                                                        className="flex-1 h-12 bg-transparent border-none focus-visible:ring-0 font-bold text-foreground p-0"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                        onClick={() =>
                                                            setEditOptions(
                                                                editOptions.filter((_, j) => j !== i)
                                                            )
                                                        }
                                                        disabled={editOptions.length <= 2}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))
                                            : (selectedQuestion.optionsData?.options || []).map(
                                                (opt, i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all shadow-sm ${opt.isCorrect
                                                            ? "bg-emerald-500/10 border-emerald-500 shadow-emerald-500/10"
                                                            : "bg-foreground/5 border-white/5"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${opt.isCorrect
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-foreground/10 text-muted-foreground"
                                                                }`}
                                                        >
                                                            {String.fromCharCode(65 + i)}
                                                        </div>
                                                        <span
                                                            className={`flex-1 text-lg ${opt.isCorrect ? "font-black text-emerald-500 tracking-tight" : "font-bold text-foreground opacity-80"}`}
                                                        >
                                                            {opt.text}
                                                        </span>
                                                        {opt.isCorrect && (
                                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                                <Check className="w-5 h-5 font-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        {editing && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4 w-full h-12 rounded-xl border-dashed border-2 bg-foreground/3 text-muted-foreground hover:bg-foreground/5 font-black uppercase tracking-widest text-xs"
                                                onClick={() =>
                                                    setEditOptions([
                                                        ...editOptions,
                                                        { text: "", isCorrect: false },
                                                    ])
                                                }
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Thêm đáp án
                                            </Button>
                                        )}
                                    </div>
                                )}

                            {/* REORDER */}
                            {selectedQuestion.questionType === "REORDER" && (
                                <div className="mt-3 space-y-2">
                                    {editing
                                        ? editOptions
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((opt, i) => (
                                                <div key={i} className="flex items-center gap-4 bg-foreground/5 p-2 rounded-2xl border border-white/5">
                                                    <span className="text-xs font-black text-muted-foreground opacity-40 w-8 text-right underline underline-offset-4">
                                                        {i + 1}.
                                                    </span>
                                                    <Input
                                                        value={opt.text}
                                                        onChange={(e) =>
                                                            setEditOptions(
                                                                editOptions.map((o, j) =>
                                                                    j === i
                                                                        ? { ...o, text: e.target.value }
                                                                        : o
                                                                )
                                                            )
                                                        }
                                                        className="flex-1 h-12 bg-transparent border-none focus-visible:ring-0 font-bold text-foreground p-0 text-lg"
                                                    />
                                                </div>
                                            ))
                                        : (selectedQuestion.optionsData?.options || [])
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((opt, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-4 p-5 rounded-2xl bg-foreground/5 border-2 border-white/5 shadow-sm group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-black shadow-lg transform group-hover:rotate-6 transition-transform">
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-xl font-black text-foreground opacity-80 tracking-tight">{opt.text}</span>
                                                </div>
                                            ))}
                                </div>
                            )}

                            {/* LOCATION */}
                            {selectedQuestion.questionType === "LOCATION" && (
                                <div className="mt-4">
                                    {editing ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-3 bg-card p-2 rounded-xl border border-white/5">
                                                <MapContainer
                                                    className="w-full relative z-0"
                                                    center={editLocation.lat ? [editLocation.lat, editLocation.lon] : [10.7904, 106.69285]}
                                                    zoom={10}
                                                    style={{ height: "300px", borderRadius: "8px" }}
                                                >
                                                    <RecenterMap center={editLocation.lat ? [editLocation.lat, editLocation.lon] : null} />
                                                    <TileLayer
                                                        attribution={editLocation.mapType === 'SATELLITE' ? "Tiles &copy; Esri" : "&copy; OpenStreetMap &copy; CARTO"}
                                                        url={editLocation.mapType === 'SATELLITE'
                                                            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                                        }
                                                    />
                                                    <LocationPickerHelper setLocation={(lat, lon) => setEditLocation(prev => ({ ...prev, lat, lon }))} />
                                                    {editLocation.lat !== 0 && (
                                                        <>
                                                            <Marker position={[editLocation.lat, editLocation.lon]} />
                                                            <Circle
                                                                center={[editLocation.lat, editLocation.lon]}
                                                                radius={editLocation.radius500}
                                                                pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.1, weight: 1 }}
                                                            />
                                                            <Circle
                                                                center={[editLocation.lat, editLocation.lon]}
                                                                radius={editLocation.radius750}
                                                                pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.15, weight: 1 }}
                                                            />
                                                            <Circle
                                                                center={[editLocation.lat, editLocation.lon]}
                                                                radius={editLocation.radius1000}
                                                                pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2, weight: 1 }}
                                                            />
                                                        </>
                                                    )}
                                                </MapContainer>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Loại Bản Đồ</label>
                                                    <Select
                                                        value={editLocation.mapType}
                                                        onValueChange={(val: any) => setEditLocation(prev => ({ ...prev, mapType: val }))}
                                                    >
                                                        <SelectTrigger className="h-12 bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-xl font-bold px-4 shadow-inner">
                                                            <SelectValue placeholder="Chọn loại bản đồ" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SIMPLE">Bản đồ tiêu chuẩn</SelectItem>
                                                            <SelectItem value="SATELLITE">Bản đồ vệ tinh</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2 block">1000đ (m)</label>
                                                    <Input
                                                        type="number"
                                                        value={editLocation.radius1000}
                                                        onChange={(e) => setEditLocation(prev => ({ ...prev, radius1000: Number(e.target.value) }))}
                                                        className="h-12 bg-foreground/5 border-2 border-white/5 focus:border-green-500 rounded-xl font-bold px-4 shadow-inner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block">750đ (m)</label>
                                                    <Input
                                                        type="number"
                                                        value={editLocation.radius750}
                                                        onChange={(e) => setEditLocation(prev => ({ ...prev, radius750: Number(e.target.value) }))}
                                                        className="h-12 bg-foreground/5 border-2 border-white/5 focus:border-orange-500 rounded-xl font-bold px-4 shadow-inner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 block">500đ (m)</label>
                                                    <Input
                                                        type="number"
                                                        value={editLocation.radius500}
                                                        onChange={(e) => setEditLocation(prev => ({ ...prev, radius500: Number(e.target.value) }))}
                                                        className="h-12 bg-foreground/5 border-2 border-white/5 focus:border-red-500 rounded-xl font-bold px-4 shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-col gap-3 bg-card p-2 rounded-xl border border-white/5">
                                                <MapContainer
                                                    className="w-full relative z-0"
                                                    center={selectedQuestion.optionsData?.correctLatitude ? [selectedQuestion.optionsData.correctLatitude, selectedQuestion.optionsData.correctLongitude] : [10.7904, 106.69285]}
                                                    zoom={10}
                                                    style={{ height: "300px", borderRadius: "8px" }}
                                                >
                                                    <RecenterMap center={selectedQuestion.optionsData?.correctLatitude ? [selectedQuestion.optionsData.correctLatitude, selectedQuestion.optionsData.correctLongitude] : null} />
                                                    <TileLayer
                                                        attribution={selectedQuestion.optionsData?.mapType === 'SATELLITE' ? "Tiles &copy; Esri" : "&copy; OpenStreetMap &copy; CARTO"}
                                                        url={selectedQuestion.optionsData?.mapType === 'SATELLITE'
                                                            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                                        }
                                                    />
                                                    {selectedQuestion.optionsData?.correctLatitude && (
                                                        <>
                                                            <Marker position={[selectedQuestion.optionsData.correctLatitude, selectedQuestion.optionsData.correctLongitude]} />
                                                            <Circle
                                                                center={[selectedQuestion.optionsData.correctLatitude, selectedQuestion.optionsData.correctLongitude]}
                                                                radius={selectedQuestion.optionsData.radius500 || 30000}
                                                                pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.1, weight: 1 }}
                                                            />
                                                            <Circle
                                                                center={[selectedQuestion.optionsData.correctLatitude, selectedQuestion.optionsData.correctLongitude]}
                                                                radius={selectedQuestion.optionsData.radius750 || 15000}
                                                                pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.15, weight: 1 }}
                                                            />
                                                            <Circle
                                                                center={[selectedQuestion.optionsData.correctLatitude, selectedQuestion.optionsData.correctLongitude]}
                                                                radius={selectedQuestion.optionsData.radius1000 || 5000}
                                                                pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2, weight: 1 }}
                                                            />
                                                        </>
                                                    )}
                                                </MapContainer>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                 <Badge variant="outline" className="text-muted-foreground border-white/10 uppercase tracking-widest text-[9px] font-black">
                                                     Map: {selectedQuestion.optionsData?.mapType === 'SATELLITE' ? 'Vệ tinh' : 'Tiêu chuẩn'}
                                                 </Badge>
                                                 <Badge variant="outline" className="text-green-500 border-green-500/20 uppercase tracking-widest text-[9px] font-black">
                                                     1000đ: {selectedQuestion.optionsData?.radius1000 || 5000}m
                                                 </Badge>
                                                 <Badge variant="outline" className="text-orange-500 border-orange-500/20 uppercase tracking-widest text-[9px] font-black">
                                                     750đ: {selectedQuestion.optionsData?.radius750 || 15000}m
                                                 </Badge>
                                                 <Badge variant="outline" className="text-red-500 border-red-500/20 uppercase tracking-widest text-[9px] font-black">
                                                     500đ: {selectedQuestion.optionsData?.radius500 || 30000}m
                                                 </Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Regeneration info */}
                        {selectedQuestion.regenerationCount > 0 && (
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-8 opacity-40">
                                Đã tạo lại {selectedQuestion.regenerationCount} lần
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-40 space-y-4">
                        <Sparkles className="w-16 h-16 animate-pulse" />
                        <p className="font-black uppercase tracking-widest text-xs">Phần xem chi tiết câu hỏi</p>
                    </div>
                )}
            </div>

            {/* Regenerate Dialog */}
            <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-foreground">Tạo lại câu hỏi</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mb-3 block">
                            Yêu cầu cho AI (tuỳ chọn)
                        </label>
                        <Textarea
                            value={regenFeedback}
                            onChange={(e) => setRegenFeedback(e.target.value)}
                            placeholder="Ví dụ: Làm câu hỏi khó hơn, thêm đáp án gây nhầm lẫn..."
                            className="mt-2 min-h-[120px] bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-2xl font-bold p-4 shadow-inner"
                        />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            className="h-12 rounded-2xl font-black uppercase tracking-widest text-xs px-8 text-muted-foreground hover:bg-foreground/5"
                            onClick={() => setRegenDialogOpen(false)}
                        >
                            Huỷ
                        </Button>
                        <Button
                            className="h-12 rounded-2xl font-black uppercase tracking-widest text-xs px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                            onClick={handleRegenerate}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Tạo lại
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Quiz Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-foreground flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <PartyPopper className="w-6 h-6 text-primary" />
                            </div>
                            Tạo Quiz Mới
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-8">
                        <div>
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mb-3 block">Tên Quiz *</label>
                            <Input
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="Nhập tên quiz..."
                                className="h-14 bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-2xl font-bold px-6 shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mb-3 block">Mô tả</label>
                            <Textarea
                                value={quizDescription}
                                onChange={(e) => setQuizDescription(e.target.value)}
                                placeholder="Mô tả quiz..."
                                className="min-h-[100px] bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-2xl font-bold p-6 shadow-inner"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 mb-3 block">Danh mục *</label>
                            <Select
                                value={quizCategoryId}
                                onValueChange={setQuizCategoryId}
                            >
                                <SelectTrigger className="h-14 bg-foreground/5 border-2 border-white/5 focus:border-primary rounded-2xl font-bold px-6">
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10 rounded-2xl shadow-2xl">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)} className="font-bold hover:bg-primary/10 rounded-xl m-1 cursor-pointer transition-colors focus:bg-primary/20">
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-xs font-bold text-primary tracking-tight">
                                Sẽ tạo quiz với <span className="underline decoration-2 underline-offset-4">{approvedCount + pendingCount}</span> câu hỏi được AI tạo ra.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            className="h-12 rounded-2xl font-black uppercase tracking-widest text-xs px-8 text-muted-foreground hover:bg-foreground/5"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            Huỷ
                        </Button>
                        <Button
                            onClick={handleCreateQuiz}
                            disabled={!quizTitle || !quizCategoryId || creating}
                            className="h-12 rounded-2xl font-black uppercase tracking-widest text-xs px-10 bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {creating ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5 mr-3" />
                            )}
                            Xác Nhận Tạo Quiz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AIQuizReview;
