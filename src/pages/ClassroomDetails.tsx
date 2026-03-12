import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { useParams, useNavigate } from "react-router-dom";
import { usePopup } from "@/context/PopupContext";
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
    const { showPopup } = usePopup();
    const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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
            showPopup("Lỗi", "Không thể tải thông tin lớp học", "destructive");
            navigate('/classrooms');
        } finally {
            setLoading(false);
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header Section */}
            <button
                onClick={() => navigate('/classrooms')}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary font-black mb-8 transition-all hover:-translate-x-1 uppercase tracking-widest text-xs"
            >
                <ArrowLeft size={16} /> Quay lại danh sách lớp
            </button>

            <div className="bg-card/80 backdrop-blur-xl rounded-4xl shadow-2xl border border-white/10 overflow-hidden mb-12">
                <div className="bg-linear-to-br from-primary/90 to-indigo-600/90 p-12 text-primary-foreground relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="relative z-10">
                        <h1 className="text-5xl font-black mb-4 tracking-tighter drop-shadow-md">{classroom.name}</h1>
                        <p className="text-primary-foreground/80 font-bold max-w-2xl leading-relaxed">{classroom.description || "Không có mô tả."}</p>
                    </div>

                    {/* Floating teacher badge */}
                    <div className="absolute top-10 right-10 bg-white/20 backdrop-blur-xl px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-3 border border-white/20 shadow-lg">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Users size={16} />
                        </div>
                        <span>GIÁO VIÊN: {classroom.teacher.username}</span>
                    </div>
                </div>

                <div className="px-10 py-6 bg-card/40 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-white/5">
                    <div className="flex bg-foreground/5 border-2 border-white/5 rounded-2xl overflow-hidden shadow-inner w-full md:w-auto">
                        <div className="px-6 py-3 bg-foreground/10 text-muted-foreground font-black text-xs uppercase tracking-widest flex items-center">
                            Mã Lớp Học
                        </div>
                        <div className="px-8 py-3 font-mono font-black tracking-[0.3em] text-2xl text-primary bg-primary/10 flex items-center">
                            {classroom.joinCode}
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className={`px-6 py-3 flex items-center gap-2 transition-all font-black text-sm ${copied ? "bg-emerald-500 text-white" : "bg-foreground/5 text-muted-foreground hover:bg-primary hover:text-primary-foreground"}`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? "ĐÃ CHÉP!" : "SAO CHÉP"}
                        </button>
                    </div>

                    {isTeacher && (
                        <button className="text-muted-foreground hover:text-foreground p-3 rounded-2xl hover:bg-foreground/5 transition-all border border-transparent hover:border-white/10">
                            <Settings size={24} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Assignments */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card/60 backdrop-blur-xl rounded-4xl shadow-xl border border-white/5 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 text-primary rounded-2xl shadow-inner">
                                    <FileText size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Bài tập</h2>
                            </div>
                            {isTeacher && (
                                <button onClick={() => navigate('/')} className="text-xs font-black text-primary hover:text-primary/80 transition-all uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                                    + Giao Bài
                                </button>
                            )}
                        </div>

                        {classroom.assignments.length === 0 ? (
                            <div className="text-center py-16 bg-foreground/5 rounded-3xl border-2 border-dashed border-foreground/10">
                                <p className="text-muted-foreground font-bold">Chưa có bài tập nào được giao.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {classroom.assignments.map(assignment => (
                                    <div key={assignment.id} className="border-2 border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:shadow-2xl hover:border-primary/20 transition-all bg-card/40 group">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-black text-foreground text-xl tracking-tight group-hover:text-primary transition-colors">{assignment.quiz.title}</h3>
                                                <span className="text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 bg-primary/20 text-primary rounded-lg border border-primary/20">
                                                    {assignment.mode}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                                Hạn chót: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'KHÔNG CÓ THỜI HẠN'}
                                            </div>
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            {isTeacher ? (
                                                <button
                                                    onClick={() => window.location.href = `${endpoints.report_excel(assignment.id)}`}
                                                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500/10 text-emerald-500 font-black rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-xs uppercase tracking-widest border border-emerald-500/20"
                                                >
                                                    BÁO CÁO EXCEL
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/homework/${assignment.id}/start`)}
                                                    className="flex-1 sm:flex-none px-8 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                                                >
                                                    LÀM BÀI NGAY
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
                <div className="space-y-8">
                    <div className="bg-card/60 backdrop-blur-xl rounded-4xl shadow-xl border border-white/5 p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/20 text-indigo-500 rounded-2xl shadow-inner">
                                <Users size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight">Thành viên <span className="text-muted-foreground/40 text-sm font-black ml-2 tabular-nums">({classroom.members.length})</span></h2>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {classroom.members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-foreground/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-foreground/5 to-foreground/10 border-2 border-foreground/10 flex items-center justify-center font-black text-foreground group-hover:scale-110 transition-transform shadow-inner text-xl">
                                            {member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground text-lg tracking-tight">{member.user.username}</p>
                                            <p className="text-xs text-muted-foreground font-medium opacity-60 lowercase">{member.user.email}</p>
                                        </div>
                                    </div>
                                    {member.role === 'TEACHER' && (
                                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 uppercase tracking-[0.2em]">GIÁO VIÊN</span>
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
