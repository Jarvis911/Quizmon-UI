import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import endpoints from "@/api/api";
import { useAuth } from "@/context/AuthContext";
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
import type {
    AIGenerationJob,
    AIGeneratedQuestion,
    AIQuestionStatus,
    Category,
} from "@/types";

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    PENDING: {
        label: "Chờ duyệt",
        color: "text-amber-700",
        bg: "bg-amber-100 border-amber-200",
    },
    APPROVED: {
        label: "Đã duyệt",
        color: "text-emerald-700",
        bg: "bg-emerald-100 border-emerald-200",
    },
    REJECTED: {
        label: "Từ chối",
        color: "text-red-700",
        bg: "bg-red-100 border-red-200",
    },
    REGENERATING: {
        label: "Đang tạo lại",
        color: "text-blue-700",
        bg: "bg-blue-100 border-blue-200",
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

const AIQuizReview = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [job, setJob] = useState<AIGenerationJob | null>(null);
    const [questions, setQuestions] = useState<AIGeneratedQuestion[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [editOptions, setEditOptions] = useState<
        Array<{ text: string; isCorrect?: boolean; order?: number }>
    >([]);
    const [editCorrectAnswer, setEditCorrectAnswer] = useState("");

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

    const fetchJob = useCallback(async () => {
        try {
            const res = await axios.get(endpoints.ai_job(Number(jobId)), {
                headers: { Authorization: token },
            });
            setJob(res.data);
            setQuestions(res.data.generatedQuestions || []);
        } catch {
            console.error("Failed to fetch job");
        } finally {
            setLoading(false);
        }
    }, [jobId, token]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(endpoints.category);
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
    };

    // Save edit
    const saveEdit = async () => {
        if (!selectedQuestion) return;
        setActionLoading(selectedQuestion.id);
        try {
            let optionsData: Record<string, unknown>;
            if (selectedQuestion.questionType === "TYPEANSWER") {
                optionsData = { correctAnswer: editCorrectAnswer };
            } else {
                optionsData = { options: editOptions };
            }

            await axios.put(
                endpoints.ai_job_question_content(Number(jobId), selectedQuestion.id),
                { questionText: editText, optionsData },
                { headers: { Authorization: token } }
            );
            await fetchJob();
            setEditing(false);
        } catch {
            alert("Lỗi khi lưu chỉnh sửa");
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
            await axios.put(
                endpoints.ai_job_question(Number(jobId), questionId),
                { status },
                { headers: { Authorization: token } }
            );
            await fetchJob();
        } catch {
            alert("Lỗi khi cập nhật trạng thái");
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
            await axios.post(
                endpoints.ai_job_question_regenerate(Number(jobId), regenQuestionId),
                { userFeedback: regenFeedback || undefined },
                { headers: { Authorization: token } }
            );
            await fetchJob();
            setRegenFeedback("");
        } catch {
            alert("Lỗi khi tạo lại câu hỏi");
        } finally {
            setActionLoading(null);
        }
    };

    // Delete question
    const deleteQuestion = async (questionId: number) => {
        if (!confirm("Bạn có chắc muốn xoá câu hỏi này?")) return;
        setActionLoading(questionId);
        try {
            await axios.delete(
                endpoints.ai_job_question_delete(Number(jobId), questionId),
                { headers: { Authorization: token } }
            );
            await fetchJob();
            if (selectedIdx >= questions.length - 1) {
                setSelectedIdx(Math.max(0, questions.length - 2));
            }
        } catch {
            alert("Lỗi khi xoá câu hỏi");
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
            const res = await axios.post(
                endpoints.ai_job_approve_all(Number(jobId)),
                {
                    title: quizTitle,
                    description: quizDescription || quizTitle,
                    categoryId: Number(quizCategoryId),
                },
                { headers: { Authorization: token } }
            );
            setCreateDialogOpen(false);
            navigate(`/quiz/${res.data.id}/editor`);
        } catch (err: any) {
            alert(err.response?.data?.message || "Lỗi tạo quiz");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto" />
                    <p className="text-gray-500 mt-3">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                    <p className="text-gray-600 mt-3">Không tìm thấy job</p>
                    <Button
                        variant="outline"
                        className="mt-4"
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
            <div className="lg:w-80 flex-shrink-0 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={() => navigate("/ai/generate")}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
                    >
                        <ChevronLeft className="w-4 h-4" /> Quay lại
                    </button>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        Review câu hỏi
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {approvedCount}/{questions.length} đã duyệt • {pendingCount} chờ duyệt
                    </p>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-1.5 rounded-full transition-all"
                            style={{
                                width: `${questions.length > 0 ? (approvedCount / questions.length) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Question list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {questions.map((q, i) => {
                        const cfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.PENDING;
                        return (
                            <div
                                key={q.id}
                                onClick={() => {
                                    setSelectedIdx(i);
                                    cancelEdit();
                                }}
                                className={`p-3 rounded-xl cursor-pointer transition-all ${selectedIdx === i
                                        ? "bg-violet-100 border-2 border-violet-300"
                                        : "hover:bg-gray-100 border-2 border-transparent"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-xs font-bold text-gray-400 mt-0.5">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {q.questionText}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 ${cfg.bg} ${cfg.color}`}
                                            >
                                                {cfg.label}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400">
                                                {TYPE_LABELS[q.questionType] || q.questionType}
                                            </span>
                                        </div>
                                    </div>
                                    {actionLoading === q.id && (
                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bulk Actions */}
                <div className="p-3 border-t border-gray-100 space-y-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={approveAll}
                        disabled={pendingCount === 0}
                    >
                        <Check className="w-3 h-3 mr-1" /> Duyệt tất cả ({pendingCount})
                    </Button>
                    <Button
                        size="sm"
                        className="w-full text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                        onClick={() => setCreateDialogOpen(true)}
                        disabled={approvedCount === 0 && pendingCount === 0}
                    >
                        <PartyPopper className="w-3 h-3 mr-1" /> Tạo Quiz (
                        {approvedCount + pendingCount} câu)
                    </Button>
                </div>
            </div>

            {/* Right Panel — Question detail */}
            <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg overflow-y-auto">
                {selectedQuestion ? (
                    <div className="p-6">
                        {/* Question header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                                    {selectedIdx + 1}
                                </div>
                                <div>
                                    <Badge
                                        variant="outline"
                                        className={`${STATUS_CONFIG[selectedQuestion.status]?.bg} ${STATUS_CONFIG[selectedQuestion.status]?.color}`}
                                    >
                                        {STATUS_CONFIG[selectedQuestion.status]?.label}
                                    </Badge>
                                    <span className="text-xs text-gray-400 ml-2">
                                        {TYPE_LABELS[selectedQuestion.questionType] ||
                                            selectedQuestion.questionType}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                                {!editing && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                            onClick={() =>
                                                updateStatus(selectedQuestion.id, "APPROVED")
                                            }
                                            disabled={
                                                actionLoading === selectedQuestion.id ||
                                                selectedQuestion.status === "APPROVED"
                                            }
                                            title="Duyệt"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                            onClick={() =>
                                                updateStatus(selectedQuestion.id, "REJECTED")
                                            }
                                            disabled={
                                                actionLoading === selectedQuestion.id ||
                                                selectedQuestion.status === "REJECTED"
                                            }
                                            title="Từ chối"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                setRegenQuestionId(selectedQuestion.id);
                                                setRegenDialogOpen(true);
                                            }}
                                            disabled={actionLoading === selectedQuestion.id}
                                            title="Tạo lại"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                            onClick={() => startEdit(selectedQuestion)}
                                            disabled={actionLoading === selectedQuestion.id}
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                                            onClick={() => deleteQuestion(selectedQuestion.id)}
                                            disabled={actionLoading === selectedQuestion.id}
                                            title="Xoá"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                                {editing && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-emerald-600 hover:bg-emerald-50"
                                            onClick={saveEdit}
                                            disabled={actionLoading === selectedQuestion.id}
                                        >
                                            <Save className="w-4 h-4 mr-1" /> Lưu
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-500"
                                            onClick={cancelEdit}
                                        >
                                            Huỷ
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Question text */}
                        <div className="mb-6">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Câu hỏi
                            </label>
                            {editing ? (
                                <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="mt-2 min-h-[80px] bg-white"
                                />
                            ) : (
                                <p className="mt-2 text-lg font-medium leading-relaxed">
                                    {selectedQuestion.questionText}
                                </p>
                            )}
                        </div>

                        {/* Options */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                                            className="bg-white"
                                        />
                                    ) : (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                            <p className="font-medium text-emerald-700">
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
                                                    className="flex items-center gap-2"
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
                                                        className="accent-violet-500"
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
                                                        className="flex-1 bg-white"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() =>
                                                            setEditOptions(
                                                                editOptions.filter((_, j) => j !== i)
                                                            )
                                                        }
                                                        disabled={editOptions.length <= 2}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))
                                            : (selectedQuestion.optionsData?.options || []).map(
                                                (opt, i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${opt.isCorrect
                                                                ? "bg-emerald-50 border-emerald-300"
                                                                : "bg-white/50 border-gray-200"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${opt.isCorrect
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "bg-gray-200 text-gray-500"
                                                                }`}
                                                        >
                                                            {String.fromCharCode(65 + i)}
                                                        </div>
                                                        <span
                                                            className={`flex-1 ${opt.isCorrect ? "font-medium text-emerald-700" : ""}`}
                                                        >
                                                            {opt.text}
                                                        </span>
                                                        {opt.isCorrect && (
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        {editing && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() =>
                                                    setEditOptions([
                                                        ...editOptions,
                                                        { text: "", isCorrect: false },
                                                    ])
                                                }
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> Thêm đáp án
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
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-400 w-5">
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
                                                        className="flex-1 bg-white"
                                                    />
                                                </div>
                                            ))
                                        : (selectedQuestion.optionsData?.options || [])
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((opt, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border-2 border-gray-200"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <span>{opt.text}</span>
                                                </div>
                                            ))}
                                </div>
                            )}
                        </div>

                        {/* Regeneration info */}
                        {selectedQuestion.regenerationCount > 0 && (
                            <p className="text-xs text-gray-400 mt-4">
                                Đã tạo lại {selectedQuestion.regenerationCount} lần
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Chọn câu hỏi để xem chi tiết</p>
                    </div>
                )}
            </div>

            {/* Regenerate Dialog */}
            <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo lại câu hỏi</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium">
                            Yêu cầu cho AI (tuỳ chọn)
                        </label>
                        <Textarea
                            value={regenFeedback}
                            onChange={(e) => setRegenFeedback(e.target.value)}
                            placeholder="Ví dụ: Làm câu hỏi khó hơn, thêm đáp án gây nhầm lẫn..."
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRegenDialogOpen(false)}
                        >
                            Huỷ
                        </Button>
                        <Button onClick={handleRegenerate}>
                            <RotateCcw className="w-4 h-4 mr-1" /> Tạo lại
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Quiz Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PartyPopper className="w-5 h-5 text-violet-500" />
                            Tạo Quiz từ câu hỏi AI
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium">Tên Quiz *</label>
                            <Input
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="Nhập tên quiz..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea
                                value={quizDescription}
                                onChange={(e) => setQuizDescription(e.target.value)}
                                placeholder="Mô tả quiz..."
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Danh mục *</label>
                            <Select
                                value={quizCategoryId}
                                onValueChange={setQuizCategoryId}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-gray-500">
                            Sẽ tạo quiz với {approvedCount + pendingCount} câu hỏi (đã duyệt + chờ duyệt)
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            Huỷ
                        </Button>
                        <Button
                            onClick={handleCreateQuiz}
                            disabled={!quizTitle || !quizCategoryId || creating}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
                        >
                            {creating ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4 mr-1" />
                            )}
                            Tạo Quiz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AIQuizReview;
