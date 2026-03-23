import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Quiz } from "@/types";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Input } from "@/components/ui/input";
import { Search, Library as LibraryIcon, Plus } from "lucide-react";
import QuizCard from "@/components/quiz/QuizCard";

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
        try {
            const res = await apiClient.post(endpoints.matches, { quizId });
            navigate(`/match/${res.data.id}/lobby`);
        } catch (err: any) {
            showAlert({
                title: "Lỗi",
                message: err.response?.data?.message || "Không thể tạo trận đấu.",
                type: "error"
            });
        }
    };

    const handleEditQuiz = (quizId: string | number) => {
        navigate(`/quiz/${quizId}/editor`);
    };

    const filteredQuizzes = myQuizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-[calc(100vh-64px)] p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <LibraryIcon className="w-10 h-10 text-primary" />
                        Thư viện của tôi
                    </h1>
                    <p className="text-muted-foreground font-medium mt-2">
                        Quản lý và tổ chức tất cả các bài trắc nghiệm bạn đã tạo.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/quiz')}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo Quiz mới
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Tìm kiếm trong thư viện..." 
                    className="pl-12 h-14 bg-card/50 backdrop-blur-md border-2 border-white/5 rounded-2xl text-lg font-medium shadow-inner focus:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Quiz Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-64 rounded-3xl bg-card/40 animate-pulse border-2 border-white/5" />
                    ))}
                </div>
            ) : filteredQuizzes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredQuizzes.map((quiz) => (
                        <QuizCard 
                            key={quiz.id} 
                            quiz={quiz} 
                            onPlay={handlePlayNow}
                            onEdit={handleEditQuiz}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-card/20 backdrop-blur-sm rounded-[3rem] border-4 border-dashed border-white/10">
                    <div className="w-20 h-20 rounded-3xl bg-muted/20 flex items-center justify-center mb-2">
                        <LibraryIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground/50">Không tìm thấy Quiz nào</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                        {searchQuery ? "Hãy thử tìm kiếm với từ khóa khác." : "Bạn chưa tạo bài trắc nghiệm nào. Hãy bắt đầu sáng tạo ngay!"}
                    </p>
                    {!searchQuery && (
                        <button 
                            onClick={() => navigate('/quiz')}
                            className="mt-4 text-primary font-bold hover:underline"
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
