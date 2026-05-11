import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { sanitizeError } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Clock, AlertCircle, Sparkles, ChevronRight, ArrowLeft, ListChecks } from "lucide-react";
import { SiGoogleclassroom } from "react-icons/si";
import { MdImageNotSupported } from "react-icons/md";
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
                const res = await apiClient.get(endpoints.homework_detail(Number(id)));
                setHomework(res.data);
                setQuiz(res.data.quiz);
            } catch (err: any) {
                setError(sanitizeError(err, "Không thể tải thông tin bài tập."));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, token]);

    const alreadySubmitted = homework?.myParticipantStatus === 'SUBMITTED';

    const handleStart = () => {
        navigate(`/match/${homework.pin || homework.id}/play`);
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground font-bold text-sm animate-pulse">Đang tải bài tập...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6">
                <div className="bg-rose-500/10 p-8 rounded-3xl border border-rose-500/20 text-center max-w-md shadow-xl animate-in fade-in zoom-in-95">
                    <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-foreground mb-2">Đã xảy ra lỗi</h2>
                    <p className="text-muted-foreground font-medium mb-6 text-sm leading-relaxed">{error}</p>
                    <Button variant="default" className="w-full h-11 rounded-xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20" onClick={() => navigate(-1)}>
                        QUAY LẠI
                    </Button>
                </div>
            </div>
        );
    }

    const isPastDeadline = homework.deadline && new Date(homework.deadline) < new Date();

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 md:p-10 max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary font-black transition-all hover:-translate-x-1 uppercase tracking-widest text-[10px] md:text-xs"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>

            {/* Main Assignment Card */}
            <div className="bg-card/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                {/* Branding Top Strip */}
                <div className="h-1.5 bg-primary w-full" />

                <div className="p-6 md:p-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Quiz Thumbnail */}
                        <div className="w-full md:w-64 h-48 md:h-64 rounded-2xl bg-foreground/5 border border-white/5 overflow-hidden shrink-0 shadow-inner group">
                            {quiz.image ? (
                                <img src={quiz.image} alt={quiz.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-16 h-16 text-muted-foreground/20" />
                                </div>
                            )}
                        </div>

                        {/* Info Content */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                                    <Sparkles size={12} className="animate-pulse" />
                                    Bài tập Quizmon
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-3">
                                    {quiz.title}
                                </h1>
                                <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed line-clamp-3">
                                    {quiz.description || "Không có mô tả chi tiết cho bài tập này."}
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-foreground/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <ListChecks size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Số câu hỏi</p>
                                        <p className="text-base font-black text-foreground">{quiz.questions?.length || 0} câu</p>
                                    </div>
                                </div>

                                <div className={`rounded-2xl p-4 flex items-center gap-3 border ${isPastDeadline ? 'bg-rose-500/5 border-rose-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPastDeadline ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Hạn chót</p>
                                        <p className={`text-base font-black ${isPastDeadline ? 'text-rose-500' : 'text-amber-500'}`}>
                                            {homework.deadline ? new Date(homework.deadline).toLocaleString("vi-VN", { dateStyle: 'short', timeStyle: 'short' }) : 'Không giới hạn'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Strict Mode Badge */}
                            {homework.strictMode && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg">
                                    <AlertCircle size={14} className="animate-bounce" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Chế độ nghiêm ngặt active</span>
                                </div>
                            )}

                            {/* Already submitted banner */}
                            {alreadySubmitted && (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p className="text-sm font-black">Bạn đã nộp bài tập này rồi. Kết quả đã được ghi nhận.</p>
                                </div>
                            )}

                            {/* Action Area */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleStart}
                                    disabled={isPastDeadline || alreadySubmitted}
                                    className="flex-1 h-14 text-lg font-black bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isPastDeadline ? 'ĐÃ HẾT HẠN' : alreadySubmitted ? 'ĐÃ NỘP BÀI' : 'Bắt đầu làm bài'}
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/classrooms')}
                                    className="h-14 px-6 rounded-2xl border-white/10 hover:bg-foreground/5 font-black text-sm uppercase tracking-widest"
                                >
                                    Về lớp học
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Guide */}
                <div className="px-6 md:px-10 py-4 bg-foreground/[0.02] border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-bold">
                        <SiGoogleclassroom className="w-3.5 h-3.5" />
                        Đồng bộ hóa với Classroom
                    </div>
                    {homework.strictMode && (
                        <p className="text-[10px] text-indigo-400/80 font-medium italic">
                            * Lưu ý: Kết quả sẽ được ghi lại ngay sau khi nộp bài.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomeworkStart;
