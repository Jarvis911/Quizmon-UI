import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { useOrganization } from "@/context/OrganizationContext";
import { Quiz } from "@/types";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Building2, ArrowUpRight, ArrowDownLeft, Copy, Search } from "lucide-react";
import QuizCard from "@/components/quiz/QuizCard";
import { checkAuth, sanitizeError } from "@/lib/utils";

type LibraryTab = "my" | "org";

const Library = () => {
    const { token } = useAuth();
    const { currentOrg } = useOrganization();
    const { showAlert } = useModal();
    const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
    const [orgQuizzes, setOrgQuizzes] = useState<Quiz[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<LibraryTab>("my");
    const navigate = useNavigate();

    const fetchMyQuizzes = useCallback(async () => {
        if (!token) return;
        try {
            const res = await apiClient.get(endpoints.quiz_my);
            setMyQuizzes(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    const fetchOrgQuizzes = useCallback(async () => {
        if (!token) return;
        try {
            const res = await apiClient.get(endpoints.quiz_org_library);
            setOrgQuizzes(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchMyQuizzes(), fetchOrgQuizzes()]);
            setLoading(false);
        };
        load();
    }, [fetchMyQuizzes, fetchOrgQuizzes]);

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
                    setOrgQuizzes(prev => prev.filter(q => q.id !== quizId));
                    showAlert({ title: "Thành công", message: "Đã xóa bài trắc nghiệm.", type: "success" });
                } catch (err: any) {
                    showAlert({ title: "Lỗi", message: sanitizeError(err, "Không thể xóa."), type: "error" });
                }
            }
        });
    };

    const handleAssignToOrg = async (quizId: string | number) => {
        if (!checkAuth()) return;
        try {
            await apiClient.post(endpoints.quiz_assign_to_org(Number(quizId)));
            showAlert({ title: "Thành công", message: "Đã thêm quiz vào thư viện tổ chức.", type: "success" });
            await Promise.all([fetchMyQuizzes(), fetchOrgQuizzes()]);
        } catch (err: any) {
            showAlert({ title: "Lỗi", message: sanitizeError(err, "Không thể thêm vào tổ chức."), type: "error" });
        }
    };

    const handleRemoveFromOrg = async (quizId: string | number) => {
        if (!checkAuth()) return;
        showAlert({
            title: "Rút khỏi tổ chức",
            message: "Quiz sẽ được đưa về thư viện cá nhân và không còn dùng được trong tổ chức.",
            type: "warning",
            onConfirm: async () => {
                try {
                    await apiClient.post(endpoints.quiz_remove_from_org(Number(quizId)));
                    showAlert({ title: "Thành công", message: "Đã rút quiz khỏi tổ chức.", type: "success" });
                    await Promise.all([fetchMyQuizzes(), fetchOrgQuizzes()]);
                } catch (err: any) {
                    showAlert({ title: "Lỗi", message: sanitizeError(err, "Không thể rút khỏi tổ chức."), type: "error" });
                }
            }
        });
    };

    const currentQuizzes = activeTab === "my" ? myQuizzes : orgQuizzes;
    const filteredQuizzes = currentQuizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentUserId = (() => {
        try {
            const t = localStorage.getItem("token");
            if (!t) return null;
            return JSON.parse(atob(t.split('.')[1])).id;
        } catch { return null; }
    })();

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-2 md:gap-3">
                        <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        Thư viện Quiz
                    </h1>
                    <p className="text-muted-foreground font-medium text-xs md:text-base mt-1 md:mt-2">
                        Quản lý quiz cá nhân và thư viện của tổ chức <span className="text-primary font-bold">{currentOrg?.name}</span>
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/quiz')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-primary text-primary-foreground px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm md:text-base"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        Tạo Quiz mới
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-card/60 backdrop-blur-md rounded-2xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab("my")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
                        activeTab === "my"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Của tôi
                    <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "my" ? "bg-white/20" : "bg-foreground/10"}`}>
                        {myQuizzes.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("org")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
                        activeTab === "org"
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    Tổ chức
                    <span className={`text-xs px-2 py-0.5 rounded-full font-black ${activeTab === "org" ? "bg-white/20" : "bg-foreground/10"}`}>
                        {orgQuizzes.length}
                    </span>
                </button>
            </div>

            {/* Description for current tab */}
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium flex items-center gap-3 ${
                activeTab === "my"
                    ? "bg-primary/5 border-primary/20 text-primary/80"
                    : "bg-indigo-500/5 border-indigo-500/20 text-indigo-400"
            }`}>
                {activeTab === "my" ? (
                    <>
                        <Copy className="w-4 h-4 shrink-0" />
                        Quiz cá nhân của bạn. Bạn có thể <strong>đưa vào tổ chức</strong> để giáo viên khác dùng hoặc dùng làm bài tập lớp.
                    </>
                ) : (
                    <>
                        <Building2 className="w-4 h-4 shrink-0" />
                        Thư viện chung của <strong>{currentOrg?.name}</strong>. Giáo viên có thể giao các quiz này làm bài tập cho lớp.
                    </>
                )}
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder={activeTab === "my" ? "Tìm trong thư viện của tôi..." : "Tìm trong thư viện tổ chức..."}
                    className="pl-12 h-12 md:h-14 bg-card/50 backdrop-blur-md border-2 border-white/5 rounded-xl md:rounded-2xl text-sm md:text-lg font-medium shadow-inner focus:ring-primary/20"
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
                        <div key={quiz.id} className="relative group/card">
                            <QuizCard
                                quiz={quiz}
                                onPlay={handlePlayNow}
                                onEdit={handleEditQuiz}
                                onDelete={handleDeleteQuiz}
                            />
                            {/* Org management overlay */}
                            {(quiz as any).creatorId === currentUserId && (
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                    {activeTab === "my" && !(quiz as any).organizationId ? (
                                        <button
                                            onClick={() => handleAssignToOrg(quiz.id)}
                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-500/90 text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-indigo-600 transition-colors"
                                            title="Đưa vào thư viện tổ chức"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            Vào tổ chức
                                        </button>
                                    ) : activeTab === "org" && (quiz as any).creatorId === currentUserId ? (
                                        <button
                                            onClick={() => handleRemoveFromOrg(quiz.id)}
                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-orange-500/90 text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
                                            title="Rút khỏi tổ chức"
                                        >
                                            <ArrowDownLeft className="w-3.5 h-3.5" />
                                            Rút về
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 md:py-20 px-4 text-center space-y-4 bg-card/20 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-white/10">
                    {activeTab === "my" ? (
                        <BookOpen className="w-10 h-10 opacity-20" />
                    ) : (
                        <Building2 className="w-10 h-10 opacity-20" />
                    )}
                    <h2 className="text-xl md:text-2xl font-black text-foreground/50">
                        {searchQuery ? "Không tìm thấy Quiz nào" : activeTab === "my" ? "Thư viện của bạn trống" : "Thư viện tổ chức trống"}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-xs mx-auto">
                        {searchQuery
                            ? "Hãy thử tìm kiếm với từ khóa khác."
                            : activeTab === "my"
                            ? "Bạn chưa tạo bài trắc nghiệm nào. Hãy bắt đầu sáng tạo ngay!"
                            : "Chưa có quiz nào trong tổ chức. Hãy đưa quiz của bạn vào tổ chức."}
                    </p>
                    {!searchQuery && activeTab === "my" && (
                        <button onClick={() => navigate('/quiz')} className="mt-2 text-sm text-primary font-bold hover:underline">
                            Tạo bài trắc nghiệm đầu tiên
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Library;
