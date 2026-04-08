import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { useModal } from "@/context/ModalContext";
import { useParams, useNavigate } from "react-router-dom";
import endpoints from "../api/api";
import { ArrowLeft, Users, FileText, Settings, Copy, Check } from "lucide-react";

interface User {
    id: number;
    username: string;
    email: string;
}

interface ClassroomMember {
    id: number;
    role: string;
    joinDate: string;
    user: User;
}

interface ClassroomAssignment {
    id: number;
    mode: string;
    deadline?: string;
    quiz: {
        id: number;
        title: string;
    };
}

interface ClassroomDetails {
    id: number;
    name: string;
    description: string;
    joinCode: string;
    teacher: User;
    members: ClassroomMember[];
    assignments: ClassroomAssignment[];
}

export default function ClassroomDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [downloadingAssignmentId, setDownloadingAssignmentId] = useState<number | null>(null);

    // Check if the current user is the teacher
    const currentUserId = (() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch { return null; }
    })();

    useEffect(() => {
        fetchClassroom();
    }, [id]);

    const fetchClassroom = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(endpoints.classroom(Number(id)));
            setClassroom(res.data);
        } catch (error: any) {
            console.error("Failed to fetch classroom", error);
            showAlert({
                title: "Lỗi",
                message: "Lỗi tải thông tin lớp học",
                type: "error"
            });
            navigate('/classrooms');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (assignmentId: number) => {
        try {
            setDownloadingAssignmentId(assignmentId);
            const res = await apiClient.get(endpoints.report_excel(Number(assignmentId)), {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `classroom_assignment_${assignmentId}.xlsx`);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error("Failed to download Excel report", error);
            showAlert({
                title: "Lỗi",
                message: error?.response?.data?.message || "Không thể tải báo cáo Excel.",
                type: "error",
            });
        } finally {
            setDownloadingAssignmentId(null);
        }
    };

    const handleCopyCode = () => {
        if (classroom?.joinCode) {
            navigator.clipboard.writeText(classroom.joinCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Đang tải thông tin...</div>;
    }

    if (!classroom) return null;

    const isTeacher = currentUserId === classroom.teacher.id;

    return (
        <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
            {/* Header Section */}
            <button
                onClick={() => navigate('/classrooms')}
                className="flex items-center gap-1.5 md:gap-2 text-muted-foreground hover:text-primary font-black mb-4 md:mb-8 transition-all hover:-translate-x-1 uppercase tracking-widest text-[10px] md:text-xs"
            >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Quay lại danh sách lớp
            </button>

            <div className="bg-card/80 backdrop-blur-xl rounded-3xl md:rounded-4xl shadow-2xl border border-white/10 overflow-hidden mb-6 md:mb-12">
                <div className="bg-linear-to-br from-primary/90 to-indigo-600/90 p-6 md:p-12 text-primary-foreground relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-black mb-2 md:mb-4 tracking-tighter drop-shadow-md pr-0 md:pr-40">{classroom.name}</h1>
                        <p className="text-primary-foreground/80 font-bold text-sm md:text-base max-w-2xl leading-relaxed">{classroom.description || "Không có mô tả."}</p>
                    </div>

                    {/* Floating teacher badge */}
                    <div className="absolute right-4 bottom-4 md:top-10 md:right-10 md:bottom-auto bg-white/20 backdrop-blur-xl px-3 py-1.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-sm font-black flex items-center gap-2 md:gap-3 border border-white/20 shadow-lg z-20">
                        <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Users className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                        <span>GIÁO VIÊN: {classroom.teacher.username}</span>
                    </div>
                </div>

                <div className="px-4 py-4 md:px-10 md:py-6 bg-card/40 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 border-b border-white/5">
                    <div className="flex bg-foreground/5 border-2 border-white/5 rounded-xl md:rounded-2xl overflow-hidden shadow-inner w-full md:w-auto text-center md:text-left">
                        <div className="px-3 py-2 md:px-6 md:py-3 bg-foreground/10 text-muted-foreground font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center md:justify-start">
                            Mã Lớp Học
                        </div>
                        <div className="px-4 py-2 md:px-8 md:py-3 font-mono font-black tracking-[0.2em] md:tracking-[0.3em] text-lg md:text-2xl text-primary bg-primary/10 flex items-center justify-center w-full md:w-auto">
                            {classroom.joinCode}
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className={`px-3 py-2 md:px-6 md:py-3 flex items-center justify-center gap-1 md:gap-2 transition-all font-black text-[10px] md:text-sm whitespace-nowrap ${copied ? "bg-emerald-500 text-white" : "bg-foreground/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground"}`}
                        >
                            {copied ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
                            <span className="hidden sm:inline">{copied ? "ĐÃ CHÉP!" : "SAO CHÉP"}</span>
                        </button>
                    </div>

                    {isTeacher && (
                        <button className="text-muted-foreground hover:text-foreground p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-foreground/5 transition-all border border-transparent hover:border-white/10 hidden md:block">
                            <Settings className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Assignments */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <div className="bg-card/60 backdrop-blur-xl rounded-3xl md:rounded-4xl shadow-xl border border-white/5 p-5 md:p-8">
                        <div className="flex justify-between items-center mb-6 md:mb-8">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 md:p-3 bg-primary/20 text-primary rounded-xl md:rounded-2xl shadow-inner">
                                    <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Bài tập</h2>
                            </div>
                            {isTeacher && (
                                <button onClick={() => navigate('/')} className="text-[10px] md:text-xs font-black text-primary hover:text-primary/80 transition-all uppercase tracking-widest bg-primary/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-primary/20">
                                    + Giao Bài
                                </button>
                            )}
                        </div>

                        {classroom.assignments.length === 0 ? (
                            <div className="text-center py-10 md:py-16 bg-foreground/5 rounded-2xl md:rounded-3xl border-2 border-dashed border-foreground/10">
                                <p className="text-sm md:text-base text-muted-foreground font-bold">Chưa có bài tập nào được giao.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 md:space-y-4">
                                {classroom.assignments.map(assignment => (
                                    <div key={assignment.id} className="border-2 border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6 hover:shadow-2xl hover:border-primary/20 transition-all bg-card/40 group">
                                        <div>
                                            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                                                <h3 className="font-black text-foreground text-base md:text-xl tracking-tight group-hover:text-primary transition-colors">{assignment.quiz.title}</h3>
                                                <span className="text-[9px] md:text-[10px] uppercase font-black tracking-[0.2em] px-2 md:px-3 py-0.5 md:py-1 bg-primary/20 text-primary rounded-md md:rounded-lg border border-primary/20">
                                                    {assignment.mode}
                                                </span>
                                            </div>
                                            <div className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                                Hạn chót: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'KHÔNG CÓ THỜI HẠN'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            {isTeacher ? (
                                                <button
                                                    onClick={() => handleDownloadReport(assignment.id)}
                                                    className="w-full sm:w-auto sm:flex-none px-4 py-2.5 md:px-6 md:py-3 bg-emerald-500/10 text-emerald-500 font-black rounded-lg md:rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-[10px] md:text-xs uppercase tracking-widest border border-emerald-500/20"
                                                    disabled={downloadingAssignmentId === assignment.id}
                                                >
                                                    {downloadingAssignmentId === assignment.id ? "ĐANG TẢI..." : "BÁO CÁO EXCEL"}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/homework/${assignment.id}/start`)}
                                                    className="w-full sm:w-auto sm:flex-none px-6 py-2.5 md:px-8 md:py-3 bg-primary text-primary-foreground font-black rounded-lg md:rounded-xl hover:scale-105 transition-all text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-primary/20 text-center"
                                                >
                                                    LÀM BÀI DẦN
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: People */}
                <div className="space-y-6 md:space-y-8">
                    <div className="bg-card/60 backdrop-blur-xl rounded-3xl md:rounded-4xl shadow-xl border border-white/5 p-5 md:p-8">
                        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                            <div className="p-2 md:p-3 bg-indigo-500/20 text-indigo-500 rounded-xl md:rounded-2xl shadow-inner">
                                <Users className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Thành viên <span className="text-muted-foreground/40 text-xs md:text-sm font-black ml-1 md:ml-2 tabular-nums">({classroom.members.length})</span></h2>
                        </div>

                        <div className="space-y-2 md:space-y-3 max-h-[600px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                            {classroom.members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-foreground/5 rounded-xl md:rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-linear-to-br from-foreground/5 to-foreground/10 border-2 border-foreground/10 flex items-center justify-center font-black text-foreground group-hover:scale-110 transition-transform shadow-inner text-lg md:text-xl">
                                            {member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground text-sm md:text-lg tracking-tight truncate max-w-[120px] sm:max-w-none">{member.user.username}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground font-medium opacity-60 lowercase truncate max-w-[120px] sm:max-w-none">{member.user.email}</p>
                                        </div>
                                    </div>
                                    {member.role === 'TEACHER' && (
                                        <span className="text-[8px] md:text-[10px] font-black text-primary bg-primary/10 px-2 py-1 md:px-3 md:py-1 rounded-md md:rounded-lg border border-primary/20 uppercase tracking-[0.2em]">GV</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
