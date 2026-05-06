import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "@/api/client";
import { useModal } from "@/context/ModalContext";
import { useParams, useNavigate } from "react-router-dom";
import endpoints from "../api/api";
import {
    ArrowLeft, Users, FileText, Copy, Check, Link2, Upload,
    UserCheck, UserX, Trash2, BarChart3, Clock, Trophy, RefreshCw,
    ChevronRight, AlertCircle, BookOpen, Download, ListChecks, Plus
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
    id: number;
    username: string;
    email: string;
    avatarUrl?: string;
}
interface ClassroomMember {
    id: number;
    role: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    joinDate: string;
    user: User;
}
interface ExpectedStudent {
    id: number;
    name: string;
    studentCode?: string;
    email?: string;
    matchedUser?: User;
}
interface AssignmentParticipant {
    userId: number | null;
    status: string;
    answers: { isCorrect: boolean; score: number; timeTaken?: number }[];
}
interface ClassroomAssignment {
    id: number;
    mode: string;
    deadline?: string;
    quiz: { id: number; title: string; image?: string; category?: { name: string } };
    participants: AssignmentParticipant[];
    _count: { participants: number };
}
interface ClassroomDetails {
    id: number;
    name: string;
    description: string;
    joinCode: string;
    inviteLink: string;
    teacher: User;
    members: ClassroomMember[];
    expectedStudents: ExpectedStudent[];
    assignments: ClassroomAssignment[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#6366f1", "#e2e8f0"];

const getCompletionRate = (a: ClassroomAssignment, approved: number) => {
    const done = a.participants.filter(p => ["SUBMITTED", "LATE"].includes(p.status)).length;
    return Math.round((done / (approved || 1)) * 100);
};
const getAvgScore = (a: ClassroomAssignment) => {
    const done = a.participants.filter(p => ["SUBMITTED", "LATE"].includes(p.status));
    if (!done.length) return 0;
    return Math.round(
        done.map(p => Math.round((p.answers.filter(x => x.isCorrect).length / (p.answers.length || 1)) * 100))
            .reduce((s, v) => s + v, 0) / done.length
    );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-foreground/5 animate-pulse rounded-xl ${className}`} />
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClassroomDetails() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"overview" | "assignments" | "members" | "expected" | "analytics">("overview");
    const [memberSub, setMemberSub] = useState<"approved" | "pending">("approved");
    const [copied, setCopied] = useState<"code" | "link" | null>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [importingPdf, setImportingPdf] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const pdfRef = useRef<HTMLInputElement>(null);

    const currentUserId = (() => {
        try { return JSON.parse(atob(localStorage.getItem("token")!.split(".")[1])).id; }
        catch { return null; }
    })();

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            // API accepts both joinCode (6-char) and numeric id
            const res = await apiClient.get(`${endpoints.classrooms}/${code}`);
            setClassroom(res.data);
        } catch {
            showAlert({ title: "Lỗi", message: "Không thể tải lớp học.", type: "error" });
            navigate("/classrooms");
        } finally { setLoading(false); }
    }, [code]);

    useEffect(() => { fetch(); }, [fetch]);

    if (loading) return (
        <div className="min-h-[calc(100vh-64px)] p-4 md:p-10 max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
        </div>
    );
    if (!classroom) return null;

    const isTeacher = currentUserId === classroom.teacher.id;
    const approved = classroom.members.filter(m => m.status === "APPROVED" && m.role === "STUDENT");
    const pending = classroom.members.filter(m => m.status === "PENDING");
    const teachers = classroom.members.filter(m => m.role === "TEACHER");
    const approvedCount = approved.length;

    // ── Analytics ─────────────────────────────────────────────────────────────
    const chartData = classroom.assignments.map(a => ({
        name: a.quiz.title.length > 14 ? a.quiz.title.slice(0, 14) + "…" : a.quiz.title,
        "Hoàn thành": getCompletionRate(a, approvedCount),
        "Điểm TB": getAvgScore(a),
    }));
    const totalSubmitted = classroom.assignments.reduce(
        (acc, a) => acc + a.participants.filter(p => ["SUBMITTED", "LATE"].includes(p.status)).length, 0
    );
    const totalExpected = classroom.assignments.length * approvedCount;
    const pieData = [
        { name: "Đã nộp", value: totalSubmitted },
        { name: "Chưa nộp", value: Math.max(0, totalExpected - totalSubmitted) },
    ];

    const studentScores: Record<number, { name: string; total: number; count: number }> = {};
    classroom.assignments.forEach(a => {
        a.participants.forEach(p => {
            if (!p.userId) return;
            const pct = Math.round((p.answers.filter(x => x.isCorrect).length / (p.answers.length || 1)) * 100);
            if (!studentScores[p.userId]) {
                const m = approved.find(m => m.user.id === p.userId);
                studentScores[p.userId] = { name: m?.user.username ?? `#${p.userId}`, total: 0, count: 0 };
            }
            studentScores[p.userId].total += pct;
            studentScores[p.userId].count += 1;
        });
    });
    const topPerformers = Object.values(studentScores)
        .map(s => ({ ...s, avg: Math.round(s.total / s.count) }))
        .sort((a, b) => b.avg - a.avg).slice(0, 5);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const copy = (type: "code" | "link") => {
        navigator.clipboard.writeText(
            type === "code" ? classroom.joinCode : `${window.location.origin}/join/${classroom.inviteLink}`
        );
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const downloadReport = async (aId: number) => {
        setDownloadingId(aId);
        try {
            const res = await apiClient.get(endpoints.report_excel(aId), { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url; a.download = `report_${aId}.xlsx`;
            document.body.appendChild(a); a.click();
            a.remove(); URL.revokeObjectURL(url);
        } catch { showAlert({ title: "Lỗi", message: "Không thể tải báo cáo.", type: "error" }); }
        finally { setDownloadingId(null); }
    };

    const cId = classroom?.id ?? 0;

    const approveMember = async (mId: number) => {
        setProcessingId(mId);
        try {
            await apiClient.post(endpoints.classroom_approve(cId, mId));
            await fetch();
            showAlert({ title: "Đã duyệt", message: "Học sinh được thêm vào lớp.", type: "success" });
        } catch { showAlert({ title: "Lỗi", message: "Không thể duyệt.", type: "error" }); }
        finally { setProcessingId(null); }
    };

    const rejectMember = async (mId: number) => {
        setProcessingId(mId);
        try {
            await apiClient.post(endpoints.classroom_reject(cId, mId));
            await fetch();
            showAlert({ title: "Đã từ chối", message: "Yêu cầu bị từ chối.", type: "success" });
        } catch { showAlert({ title: "Lỗi", message: "Không thể từ chối.", type: "error" }); }
        finally { setProcessingId(null); }
    };

    const removeMember = (uid: number, name: string) =>
        showAlert({
            title: "Xóa học sinh",
            message: `Xóa ${name} khỏi lớp?`,
            type: "warning",
            onConfirm: async () => {
                await apiClient.delete(endpoints.classroom_remove_member(cId, uid));
                await fetch();
                showAlert({ title: "Đã xóa", message: `Đã xóa ${name}.`, type: "success" });
            }
        });

    const SUPPORTED_TYPES = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
        "image/jpeg", "image/png", "image/webp", "image/gif"
    ];

    const importStudentFile = async (file: File) => {
        if (!SUPPORTED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
            showAlert({ title: "Lỗi", message: "Định dạng file không được hỗ trợ. Vui lòng dùng PDF, Word, Excel hoặc ảnh.", type: "error" });
            return;
        }
        setImportingPdf(true);
        try {
            const fd = new FormData(); fd.append("file", file);
            const res = await apiClient.post(endpoints.classroom_import_students(cId), fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            await fetch();
            showAlert({ title: "Import thành công!", message: res.data.message, type: "success" });
        } catch (e: any) {
            showAlert({ title: "Lỗi OCR", message: e?.response?.data?.message ?? "Không thể đọc file.", type: "error" });
        } finally { setImportingPdf(false); }
    };

    const regenerateInvite = () =>
        showAlert({
            title: "Tạo link mới?",
            message: "Link cũ sẽ vô hiệu hoá.",
            type: "warning",
            onConfirm: async () => {
                const res = await apiClient.post(endpoints.classroom_regenerate_invite(cId));
                setClassroom(prev => prev ? { ...prev, inviteLink: res.data.inviteLink } : prev);
                showAlert({ title: "Xong", message: "Đã tạo link mời mới.", type: "success" });
            }
        });

    const clearExpected = () =>
        showAlert({
            title: "Xóa danh sách dự kiến?",
            message: "Toàn bộ danh sách sẽ bị xóa.",
            type: "warning",
            onConfirm: async () => {
                await apiClient.delete(endpoints.classroom_clear_expected(cId));
                await fetch();
            }
        });

    const matchExpected = async (expectedId: number, userId: number) => {
        try {
            await apiClient.post(endpoints.classroom_expected_match(cId, expectedId, userId));
            await fetch();
        } catch (e: any) {
            showAlert({
                title: "Lỗi",
                message: e?.response?.data?.message ?? "Không thể ghép học sinh.",
                type: "error"
            });
        }
    };

    const unmatchExpected = async (expectedId: number) => {
        try {
            await apiClient.delete(endpoints.classroom_expected_unmatch(cId, expectedId));
            await fetch();
        } catch (e: any) {
            showAlert({
                title: "Lỗi",
                message: e?.response?.data?.message ?? "Không thể bỏ ghép.",
                type: "error"
            });
        }
    };

    // ── Tabs config ───────────────────────────────────────────────────────────
    type TabId = "overview" | "assignments" | "members" | "expected" | "analytics";
    const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: "overview", label: "Tổng quan", icon: BarChart3 },
        { id: "assignments", label: "Bài tập", icon: FileText, badge: classroom.assignments.length },
        { id: "members", label: "Học sinh", icon: Users, badge: pending.length || undefined },
        ...(isTeacher ? [
            { id: "expected" as TabId, label: "DS dự kiến", icon: ListChecks, badge: classroom.expectedStudents.length || undefined },
            { id: "analytics" as TabId, label: "Phân tích", icon: BarChart3 },
        ] : []),
    ];

    // ── Stat card ─────────────────────────────────────────────────────────────
    const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) => (
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-foreground">{value}</p>
            </div>
        </div>
    );

    // ── Avatar initials ────────────────────────────────────────────────────────
    const Avatar = ({ name, size = "md" }: { name: string; size?: "sm" | "md" }) => (
        <div className={`rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary shrink-0 ${size === "sm" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base"}`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">

            {/* ── Back ──────────────────────────────────────────────────────── */}
            <button
                onClick={() => navigate("/classrooms")}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary font-black transition-all hover:-translate-x-1 uppercase tracking-widest text-[10px] md:text-xs"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách lớp
            </button>

            {/* ── Header card ───────────────────────────────────────────────── */}
            <div className="bg-card/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
                {/* Top strip */}
                <div className="h-1.5 bg-primary w-full" />

                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                <Users className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground truncate">{classroom.name}</h1>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base font-medium pl-12">{classroom.description || "Không có mô tả."}</p>
                        <div className="flex flex-wrap gap-2 mt-3 pl-12">
                            <span className="text-xs font-bold text-muted-foreground bg-foreground/5 px-3 py-1 rounded-full border border-white/5">
                                GV: {classroom.teacher.username}
                            </span>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                {approvedCount} học sinh
                            </span>
                            {pending.length > 0 && (
                                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                                    {pending.length} chờ duyệt
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Join code + invite link */}
                    <div className="flex flex-col gap-2 min-w-0 md:min-w-[240px]">
                        {/* Join code */}
                        <div className="flex items-center bg-foreground/5 border border-white/5 rounded-xl overflow-hidden">
                            <span className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap border-r border-white/5">
                                Mã lớp
                            </span>
                            <span className="flex-1 px-4 py-2.5 font-mono font-black tracking-[0.2em] text-lg text-primary">
                                {classroom.joinCode}
                            </span>
                            <button
                                onClick={() => copy("code")}
                                className={`px-3 py-2.5 transition-all ${copied === "code" ? "text-emerald-500" : "text-muted-foreground hover:text-primary"}`}
                            >
                                {copied === "code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Invite link (teacher only) */}
                        {isTeacher && (
                            <div className="flex items-center bg-foreground/5 border border-white/5 rounded-xl overflow-hidden">
                                <span className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap border-r border-white/5">
                                    Link mời
                                </span>
                                <span className="flex-1 px-3 py-2.5 font-mono text-xs text-muted-foreground truncate">
                                    {classroom.inviteLink.slice(0, 14)}…
                                </span>
                                <button onClick={() => copy("link")} className={`px-2.5 py-2.5 transition-all ${copied === "link" ? "text-emerald-500" : "text-muted-foreground hover:text-primary"}`}>
                                    {copied === "link" ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                                </button>
                                <button onClick={regenerateInvite} className="px-2.5 py-2.5 text-muted-foreground hover:text-primary transition-all border-l border-white/5" title="Tạo link mới">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab bar */}
                <div className="px-6 md:px-8 border-t border-white/5 flex gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-3.5 font-black text-sm whitespace-nowrap transition-all border-b-2 ${
                                tab === t.id
                                    ? "text-primary border-primary"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                            }`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                            {t.badge !== undefined && t.badge > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                    t.id === "members" ? "bg-amber-500/20 text-amber-500" : "bg-primary/15 text-primary"
                                }`}>{t.badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB: OVERVIEW                                                    */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <StatCard label="Học sinh" value={approvedCount} icon={Users} />
                        <StatCard label="Bài tập" value={classroom.assignments.length} icon={FileText} />
                        <StatCard label="Chờ duyệt" value={pending.length} icon={AlertCircle} />
                        <StatCard label="DS dự kiến" value={classroom.expectedStudents.length} icon={ListChecks} />
                    </div>

                    {/* Quick actions — teacher only */}
                    {isTeacher && (
                        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5">
                            <h3 className="font-black text-base mb-4 text-foreground">Hành động nhanh</h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: `Duyệt ${pending.length} yêu cầu`, onClick: () => { setTab("members"); setMemberSub("pending"); }, show: pending.length > 0, color: "text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" },
                                    { label: "Import danh sách học sinh", onClick: () => setTab("expected"), show: true, color: "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20" },
                                    { label: "Giao bài tập mới", onClick: () => navigate("/"), show: true, color: "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20" },
                                    { label: "Xem phân tích", onClick: () => setTab("analytics"), show: classroom.assignments.length > 0, color: "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20" },
                                ].filter(a => a.show).map((a, i) => (
                                    <button key={i} onClick={a.onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${a.color}`}>
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent assignments */}
                    {classroom.assignments.length > 0 && (
                        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Bài tập gần đây
                                </h3>
                                <button onClick={() => setTab("assignments")} className="text-xs font-black text-primary hover:text-primary/70 flex items-center gap-1">
                                    Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {classroom.assignments.slice(0, 3).map(a => {
                                    const rate = getCompletionRate(a, approvedCount);
                                    return (
                                        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 transition-all">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{a.quiz.title}</p>
                                                <p className="text-xs text-muted-foreground">{a.deadline ? `Hạn: ${new Date(a.deadline).toLocaleDateString("vi-VN")}` : "Không có hạn"}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                                                </div>
                                                <span className="text-xs font-black text-primary w-10 text-right">{rate}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB: ASSIGNMENTS                                                 */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tab === "assignments" && (
                <div className="space-y-4">
                    {isTeacher && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => navigate("/")}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-black text-sm shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                <Plus className="w-4 h-4" /> Giao bài mới
                            </button>
                        </div>
                    )}

                    {classroom.assignments.length === 0 ? (
                        <div className="text-center py-20 bg-card/40 rounded-2xl border-2 border-dashed border-white/10">
                            <FileText className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                            <p className="font-bold text-muted-foreground">Chưa có bài tập nào.</p>
                        </div>
                    ) : classroom.assignments.map(a => {
                        const rate = getCompletionRate(a, approvedCount);
                        const avg = getAvgScore(a);
                        const submitted = a.participants.filter(p => ["SUBMITTED", "LATE"].includes(p.status)).length;
                        return (
                            <div key={a.id} className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-primary/20 transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            {a.quiz.image
                                                ? <img src={a.quiz.image} className="w-full h-full object-cover rounded-xl" />
                                                : <FileText className="w-6 h-6 text-primary" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-black text-base group-hover:text-primary transition-colors">{a.quiz.title}</h3>
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary rounded-md">{a.mode}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {a.deadline ? `Hạn: ${new Date(a.deadline).toLocaleString("vi-VN")}` : "Không có thời hạn"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="text-center bg-foreground/5 rounded-xl px-4 py-2">
                                            <p className="text-xl font-black text-primary">{submitted}/{approvedCount}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Đã nộp</p>
                                        </div>
                                        <div className="text-center bg-foreground/5 rounded-xl px-4 py-2">
                                            <p className="text-xl font-black text-primary">{avg}%</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Điểm TB</p>
                                        </div>
                                        {isTeacher ? (
                                            <button
                                                onClick={() => downloadReport(a.id)}
                                                disabled={downloadingId === a.id}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary/20 transition-all"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                {downloadingId === a.id ? "Đang tải..." : "Báo cáo"}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/homework/${a.id}/start`)}
                                                className="px-6 py-2 bg-primary text-primary-foreground font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                            >
                                                Làm bài
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-primary shrink-0">{rate}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB: MEMBERS                                                     */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tab === "members" && (
                <div className="space-y-4">
                    {isTeacher && (
                        <div className="flex gap-2 p-1 bg-card/60 rounded-xl border border-white/5 w-fit">
                            {(["approved", "pending"] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setMemberSub(s)}
                                    className={`px-4 py-2 rounded-lg font-black text-sm transition-all flex items-center gap-2 ${
                                        memberSub === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {s === "approved" ? `Thành viên (${approvedCount})` : "Chờ duyệt"}
                                    {s === "pending" && pending.length > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${memberSub === "pending" ? "bg-white/20" : "bg-amber-500/20 text-amber-500"}`}>{pending.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pending list */}
                    {isTeacher && memberSub === "pending" && (
                        <>
                            {pending.length === 0 ? (
                                <div className="text-center py-14 bg-card/40 rounded-2xl border-2 border-dashed border-white/10">
                                    <UserCheck className="w-10 h-10 mx-auto text-muted-foreground/20 mb-2" />
                                    <p className="font-bold text-muted-foreground">Không có yêu cầu nào đang chờ.</p>
                                </div>
                            ) : pending.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={m.user.username} />
                                        <div>
                                            <p className="font-black text-foreground">{m.user.username}</p>
                                            <p className="text-xs text-muted-foreground">{m.user.email}</p>
                                            <p className="text-[10px] text-amber-500 font-bold mt-0.5">
                                                {new Date(m.joinDate).toLocaleDateString("vi-VN")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => approveMember(m.id)}
                                            disabled={processingId === m.id}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-black rounded-xl text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                                        >
                                            <UserCheck className="w-4 h-4" /> Duyệt
                                        </button>
                                        <button
                                            onClick={() => rejectMember(m.id)}
                                            disabled={processingId === m.id}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-foreground/5 text-muted-foreground border border-white/5 font-black rounded-xl text-sm hover:bg-foreground/10 transition-all disabled:opacity-50"
                                        >
                                            <UserX className="w-4 h-4" /> Từ chối
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Approved list */}
                    {(!isTeacher || memberSub === "approved") && (
                        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 divide-y divide-white/5">
                            {teachers.map(m => (
                                <div key={m.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-foreground/5 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={m.user.username} size="sm" />
                                        <div>
                                            <p className="font-black text-sm text-foreground">{m.user.username}</p>
                                            <p className="text-xs text-muted-foreground">{m.user.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 uppercase tracking-widest">GV</span>
                                </div>
                            ))}
                            {approved.length === 0 && (
                                <div className="text-center py-10 text-sm text-muted-foreground">Chưa có học sinh nào.</div>
                            )}
                            {approved.map(m => {
                                const done = classroom.assignments.filter(a =>
                                    a.participants.some(p => p.userId === m.user.id && ["SUBMITTED", "LATE"].includes(p.status))
                                ).length;
                                const pct = classroom.assignments.length > 0 ? Math.round((done / classroom.assignments.length) * 100) : 0;
                                return (
                                    <div key={m.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-foreground/5 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={m.user.username} size="sm" />
                                            <div>
                                                <p className="font-black text-sm text-foreground">{m.user.username}</p>
                                                <p className="text-xs text-muted-foreground">{m.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {classroom.assignments.length > 0 && (
                                                <div className="hidden sm:flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-xs font-black text-primary w-8">{pct}%</span>
                                                </div>
                                            )}
                                            {isTeacher && (
                                                <button
                                                    onClick={() => removeMember(m.user.id, m.user.username)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB: EXPECTED STUDENTS                                           */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tab === "expected" && isTeacher && (
                <div className="space-y-5">
                    {/* Upload zone */}
                    <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                        <h3 className="font-black text-base text-foreground mb-1 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-primary" /> Import danh sách học sinh
                        </h3>
                        <p className="text-sm text-muted-foreground mb-5">Upload file danh sách từ nhà trường. Hệ thống dùng AI (Gemini) để nhận dạng và trích xuất tên học sinh chính xác.</p>
                        <div
                            className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                            onClick={() => pdfRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) importStudentFile(f); }}
                        >
                            <input ref={pdfRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importStudentFile(f); e.target.value = ""; }} />
                            {importingPdf ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-primary font-bold text-sm">Đang xử lý OCR…</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-9 h-9 mx-auto text-primary/50 mb-2" />
                                    <p className="font-black text-foreground mb-1">Kéo thả file vào đây</p>
                                    <p className="text-sm text-muted-foreground">hoặc <span className="text-primary font-bold">click để chọn</span></p>
                                    <p className="text-xs text-muted-foreground mt-2 opacity-60">Hỗ trợ: PDF · Word (.docx) · Excel (.xlsx) · Ảnh (JPG, PNG…)</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Expected list */}
                    {classroom.expectedStudents.length > 0 && (
                        <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                <div>
                                    <h3 className="font-black text-base text-foreground flex items-center gap-2">
                                        <ListChecks className="w-4 h-4 text-primary" /> Danh sách dự kiến
                                        <span className="text-sm text-muted-foreground font-normal">({classroom.expectedStudents.length})</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {classroom.expectedStudents.filter(e => e.matchedUser).length} / {classroom.expectedStudents.length} đã khớp tài khoản
                                    </p>
                                </div>
                                <button onClick={clearExpected} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 font-bold transition-all">
                                    <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                                </button>
                            </div>
                            <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                                {classroom.expectedStudents.map((s, i) => (
                                    <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground font-black w-5 text-right shrink-0">{i + 1}</span>
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{s.name}</p>
                                                <div className="flex items-center gap-2">
                                                    {s.studentCode && <span className="text-[10px] font-mono text-muted-foreground">{s.studentCode}</span>}
                                                    {s.email && <span className="text-[10px] text-muted-foreground">{s.email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {s.matchedUser ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-primary font-bold">{s.matchedUser.username}</span>
                                                <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-primary-foreground" />
                                                </span>
                                                <button
                                                    onClick={() => unmatchExpected(s.id)}
                                                    className="ml-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-amber-400 border border-white/10 hover:border-amber-400/30 px-2 py-1 rounded-lg transition-all"
                                                >
                                                    Bỏ ghép
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Chưa tham gia
                                                </span>
                                                <select
                                                    className="h-9 px-3 rounded-xl border border-white/10 bg-card/40 text-xs font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        const v = Number(e.target.value);
                                                        if (v) matchExpected(s.id, v);
                                                        e.currentTarget.value = "";
                                                    }}
                                                >
                                                    <option value="" disabled>Ghép với...</option>
                                                    {approved.map(m => (
                                                        <option key={m.user.id} value={m.user.id}>
                                                            {m.user.username}{m.user.email ? ` (${m.user.email})` : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* TAB: ANALYTICS                                                   */}
            {/* ════════════════════════════════════════════════════════════════ */}
            {tab === "analytics" && isTeacher && (
                <div className="space-y-5">
                    {classroom.assignments.length === 0 ? (
                        <div className="text-center py-20 bg-card/40 rounded-2xl border-2 border-dashed border-white/10">
                            <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
                            <p className="font-bold text-muted-foreground">Giao bài và chờ học sinh nộp để xem phân tích.</p>
                        </div>
                    ) : (
                        <>
                            {/* Bar chart */}
                            <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                                <h3 className="font-black text-base text-foreground mb-5 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-primary" /> Hoàn thành & Điểm TB theo bài
                                </h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "var(--foreground)", fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
                                        <Legend iconType="circle" iconSize={8} />
                                        <Bar dataKey="Hoàn thành" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="Điểm TB" fill="hsl(var(--primary) / 0.35)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Pie chart */}
                                <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                                    <h3 className="font-black text-base text-foreground mb-4 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-primary" /> Tổng quan nộp bài
                                    </h3>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                                            <Legend iconType="circle" iconSize={8} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Top performers */}
                                <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                                    <h3 className="font-black text-base text-foreground mb-4 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-primary" /> Top học sinh
                                    </h3>
                                    {topPerformers.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {topPerformers.map((s, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-primary/50 text-primary-foreground" : "bg-foreground/10 text-muted-foreground"}`}>
                                                        {i + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{s.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary rounded-full" style={{ width: `${s.avg}%` }} />
                                                            </div>
                                                            <span className="text-xs font-black text-primary shrink-0">{s.avg}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Line chart — only if >1 assignment */}
                            {chartData.length > 1 && (
                                <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                                    <h3 className="font-black text-base text-foreground mb-5 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-primary" /> Xu hướng điểm theo thời gian
                                    </h3>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`${v}%`]} />
                                            <Legend iconType="circle" iconSize={8} />
                                            <Line type="monotone" dataKey="Điểm TB" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                                            <Line type="monotone" dataKey="Hoàn thành" stroke="hsl(var(--primary) / 0.4)" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
