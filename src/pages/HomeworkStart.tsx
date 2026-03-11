import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import endpoints from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, AlertCircle, Sparkles, ChevronRight, ArrowLeft } from "lucide-react";
import { SiGoogleclassroom } from "react-icons/si";
import { Quiz } from "@/types";

const HomeworkStart = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const [homework, setHomework] = useState<any>(null);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(endpoints.homework_detail(Number(id)), {
                    headers: { Authorization: token }
                });
                setHomework(res.data);
                setQuiz(res.data.quiz);
            } catch (err: any) {
                setError(err.response?.data?.message || "Không thể tải thông tin bài tập.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, token]);

    const handleStart = () => {
        navigate(`/match/${homework.matchId}/play`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-muted-foreground font-black uppercase tracking-widest animate-pulse">Đang tải bài tập...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="bg-red-500/10 p-8 rounded-4xl border border-red-500/20 text-center max-w-md shadow-2xl">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">Đã xảy ra lỗi</h2>
                    <p className="text-muted-foreground font-bold mb-8">{error}</p>
                    <Button variant="default" className="w-full h-12 rounded-2xl font-black bg-primary text-primary-foreground shadow-lg" onClick={() => navigate(-1)}>
                        QUAY LẠI
                    </Button>
                </div>
            </div>
        );
    }

    const isPastDeadline = homework.deadline && new Date(homework.deadline) < new Date();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-xl w-full">
                <div className="bg-card/80 backdrop-blur-3xl rounded-4xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 group">

                    {/* Header Image Area */}
                    <div className="relative h-64 bg-linear-to-br from-primary to-indigo-600 p-10 flex flex-col justify-end overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                        {quiz.image && (
                            <img src={quiz.image} alt="Quiz Cover" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:scale-110 transition-transform duration-1000" />
                        )}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-primary-foreground/60 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                                <Sparkles size={12} className="animate-spin-slow" />
                                Giao bởi Google Classroom
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter leading-none mb-2 drop-shadow-xl">{quiz.title}</h1>
                        </div>
                    </div>

                    <div className="p-10">
                        {/* Description */}
                        <p className="text-muted-foreground text-lg font-bold mb-10 leading-relaxed italic opacity-80 border-l-4 border-primary/20 pl-6">{quiz.description || "Không có mô tả cho quiz này."}</p>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center justify-between p-6 bg-foreground/5 rounded-3xl border border-white/5 transition-all hover:bg-foreground/10 group/item">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-3xl bg-primary/20 text-primary flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform">
                                        <SiGoogleclassroom size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Số câu hỏi</p>
                                        <p className="text-lg font-bold text-foreground">Bộ câu hỏi chi tiết</p>
                                    </div>
                                </div>
                                <span className="font-black text-2xl text-primary tabular-nums">{quiz.questions?.length || 0}</span>
                            </div>

                            <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all hover:scale-[1.01] ${isPastDeadline ? 'bg-red-500/5 border-red-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shadow-lg ${isPastDeadline ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Hạn chót</p>
                                        <p className={`text-lg font-bold ${isPastDeadline ? 'text-red-500' : 'text-orange-500'}`}>
                                            {homework.deadline ? new Date(homework.deadline).toLocaleDateString() : 'Không thời hạn'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {homework.strictMode && (
                                <div className="flex items-center justify-between p-6 bg-violet-500/5 rounded-3xl border border-violet-500/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-3xl bg-violet-500/20 text-violet-500 flex items-center justify-center shadow-lg">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-1">Chế độ nghiêm ngặt</p>
                                            <p className="text-lg font-bold text-foreground">Hoàn thành trong 1 lần</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Area */}
                        <div className="flex flex-col gap-4">
                            <Button
                                onClick={handleStart}
                                disabled={isPastDeadline}
                                className="w-full h-20 text-2xl font-black bg-primary text-primary-foreground rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-tighter"
                            >
                                {isPastDeadline ? 'ĐÃ HẾT HẠN' : 'Bắt đầu bài tập'}
                                <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                            </Button>

                            <button
                                onClick={() => navigate('/classrooms')}
                                className="w-full py-4 text-muted-foreground hover:text-foreground font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Quay lại Danh sách lớp học
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeworkStart;
