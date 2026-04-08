import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Quiz } from "@/types";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import QuizCard from "@/components/quiz/QuizCard";
import { checkAuth, sanitizeError } from "@/lib/utils";

const Library = () => {
    const { user, token } = useAuth();
    const { showAlert } = useModal();
    const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyQuizzes = async () => {
            if (!token) return;
            try {
                const res = await apiClient.get(endpoints.quizzes);
                setMyQuizzes(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyQuizzes();
    }, [token]);

    const handlePlayNow = async (quizId: string | number) => {
        if (!checkAuth()) return;
        try {
            const res = await apiClient.post(endpoints.matches, { quizId });
            navigate(`/match/${res.data.pin}/lobby`);
        } catch (err: any) {
            showAlert({
                title: "Lỗi",
                message: sanitizeError(err, "Không thể tạo trận đấu."),
                type: "error"
            });
        }
    };

    const handleEditQuiz = (quizId: string | number) => {
        if (!checkAuth()) return;
        navigate(`/quiz/${quizId}/editor`);
    };

    const handleDeleteQuiz = async (quizId: string | number) => {
        if (!checkAuth()) return;
        
        showAlert({
            title: "Xác nhận xóa",
            message: "Bạn có chắc chắn muốn xóa bài trắc nghiệm này? Hành động này không thể hoàn tác.",
            type: "warning",
            onConfirm: async () => {
                try {
                    await apiClient.delete(endpoints.quiz_delete(quizId));
                    setMyQuizzes(prev => prev.filter(q => q.id !== quizId));
                    showAlert({
                        title: "Thành công",
                        message: "Đã xóa bài trắc nghiệm.",
                        type: "success"
                    });
                } catch (err: any) {
                    showAlert({
                        title: "Lỗi",
                        message: sanitizeError(err, "Không thể xóa bài trắc nghiệm."),
                        type: "error"
                    });
                }
            }
        });
    };

    const filteredQuizzes = myQuizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-2 md:gap-3">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/3038/3038168.png"
                            alt="Library"
                            className="w-8 h-8 md:w-10 md:h-10 object-contain"
                        />
                        Thư viện của tôi
                    </h1>
                    <p className="text-muted-foreground font-medium text-xs md:text-base mt-1 md:mt-2">
                        Quản lý và tổ chức tất cả các bài trắc nghiệm bạn đã tạo.
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/quiz')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold md:shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm md:text-base"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        Tạo Quiz mới
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="relative group">
                <img
                    src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png"
                    alt="Search"
                    className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 object-contain"
                />
                <Input
                    placeholder="Tìm kiếm trong thư viện..."
                    className="pl-10 md:pl-12 h-12 md:h-14 bg-card/50 backdrop-blur-md border-2 border-white/5 rounded-xl md:rounded-2xl text-sm md:text-lg font-medium shadow-inner focus:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Quiz Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-48 md:h-64 rounded-2xl md:rounded-3xl bg-card/40 animate-pulse border-2 border-white/5" />
                    ))}
                </div>
            ) : filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            onPlay={handlePlayNow}
                            onEdit={handleEditQuiz}
                            onDelete={handleDeleteQuiz}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 md:py-20 px-4 text-center space-y-4 bg-card/20 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-white/10">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/3038/3038168.png"
                        alt="Library"
                        className="w-10 h-10 object-contain opacity-20"
                    />
                    <h2 className="text-xl md:text-2xl font-black text-foreground/50">Không tìm thấy Quiz nào</h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-xs mx-auto">
                        {searchQuery ? "Hãy thử tìm kiếm với từ khóa khác." : "Bạn chưa tạo bài trắc nghiệm nào. Hãy bắt đầu sáng tạo ngay!"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => navigate('/quiz')}
                            className="mt-2 md:mt-4 text-sm md:text-base text-primary font-bold hover:underline"
                        >
                            Tạo bài trắc nghiệm đầu tiên
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Library;
