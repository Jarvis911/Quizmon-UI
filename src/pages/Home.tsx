import { useState, useEffect, useCallback, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { Quiz, Category } from "@/types";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import { BookOpen, Gamepad2, Plus, Sparkles, Settings } from "lucide-react";
import { SiGoogleclassroom } from "react-icons/si";

import QuizCard from "@/components/quiz/QuizCard";
import QuizSection from "@/components/quiz/QuizSection";
import KnowledgeGlobeSVG from "@/components/ui/KnowledgeGlobeSVG";
import CategoryNav from "@/components/ui/CategoryNav";


interface Classroom {
    id: string | number;
    name: string;
    teacher?: {
        id: number;
    };
}

interface HomeworkForm {
    classroomId: string;
    deadline: string;
    strictMode: boolean;
}

const Home = () => {
    const { user, token } = useAuth();
    const { showAlert } = useModal();
    const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const navigate = useNavigate();

    // Homework Modal State
    const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
    const [selectedQuizId, setSelectedQuizId] = useState<string | number | null>(null);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [homeworkForm, setHomeworkForm] = useState<HomeworkForm>({ classroomId: "", deadline: "", strictMode: false });


    // Fetch my quizzes and categories first
    useEffect(() => {
        const fetchClassrooms = async () => {
            if (!token) return;
            try {
                const res = await apiClient.get(endpoints.classrooms);
                setClassrooms(res.data.filter((c: Classroom) => (c.teacher?.id as any) === user?.id)); // Only classes they teach
            } catch (err) { console.error(err); }
        };

        const fetchMyQuizzes = async () => {
            try {
                if (token) {
                    const res = await apiClient.get(endpoints.quizzes);

                    setMyQuizzes(res.data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchCategories = async () => {
            try {
                const res = await apiClient.get(endpoints.category);
                setCategories(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchMyQuizzes();
        fetchCategories();
        fetchClassrooms();
    }, [token, user]);

    const handlePlayNow = async (quizId: string | number) => {
        try {
            const res = await apiClient.post(
                endpoints.matches,
                { quizId },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            navigate(`/match/${res.data.id}/lobby`);
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.message || "Không thể tạo trận đấu. Vui lòng thử lại sau.";
            showAlert({
                title: "Lỗi",
                message: errorMessage,
                type: "error"
            });
        }
    };

    const handleEditQuiz = async (quizId: string | number) => {
        navigate(`/quiz/${quizId}/editor`);
    };

    const handleOpenHomeworkModal = (quizId: string | number) => {
        setSelectedQuizId(quizId);
        setIsHomeworkModalOpen(true);
    };

    const handleSubmitHomework = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post(endpoints.homework, {
                quizId: selectedQuizId,
                classroomId: homeworkForm.classroomId,
                deadline: homeworkForm.deadline || null,
                strictMode: homeworkForm.strictMode
            });
            setIsHomeworkModalOpen(false);
            setHomeworkForm({ classroomId: "", deadline: "", strictMode: false });
            showAlert({
                title: "Thành công!",
                message: "Đã giao bài tập thành công.",
                type: "success"
            });
        } catch (err: any) {
            showAlert({
                title: "Thất bại",
                message: err.response?.data?.message || "Không thể giao bài tập",
                type: "error"
            });
        }
    };


    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Global Background SVG Globe */}
            <div className="fixed -top-[10%] -left-[10%] md:-top-[20%] md:-left-[15%] w-[600px] md:w-[900px] h-[600px] md:h-[900px] text-primary pointer-events-none opacity-20 md:opacity-30 z-[-1]">
                <KnowledgeGlobeSVG />
            </div>

            {/* Category Navigation Bar */}
            {user && (
                <div className="w-full relative z-20 pt-24 lg:pt-8">
                    <CategoryNav categories={categories} />
                </div>
            )}

            <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto relative z-10">
                {!user && <LandingHero navigate={navigate} />}

                {/* Blooket Style Hero Cards */}
                {user && (
                    <div className="mb-8 w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Action 1: Create Manually */}
                        <div
                            onClick={() => navigate('/quiz')}
                            className="group flex gap-4 justify-between items-center p-6 bg-[#264653] hover:bg-[#1a3039] rounded-2xl shadow-[0_8px_0_#1a3039] hover:shadow-[0_4px_0_#1a3039] hover:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden relative"
                        >
                            <div className="flex-1 flex flex-col items-center text-center z-10">
                                <h3 className="font-extrabold text-3xl text-white mb-2 tracking-tight">Create a quiz</h3>
                                <p className="text-sm text-gray-200 font-semibold mb-6">Play for free with<br />300 participants</p>
                                <button className="bg-[#2a9d8f] text-white font-bold py-3 px-8 rounded-full shadow-[0_4px_0_#1d7066] group-hover:shadow-[0_2px_0_#1d7066] group-hover:translate-y-0.5 transition-all w-fit">
                                    Quiz editor
                                </button>
                            </div>
                            <div className="hidden sm:flex flex-1 justify-center z-10 relative">
                                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-150" />
                                <div className="text-white relative z-10">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center p-4 shadow-xl">
                                        <div className="w-full h-full border-4 border-[#264653] rounded-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-100">
                                            {/* Minimal Avatar */}
                                            <div className="w-10 h-10 bg-[#264653] rounded-full mb-1"></div>
                                            <div className="w-16 h-12 bg-[#264653] rounded-t-4xl"></div>
                                            <div className="absolute top-4 right-4 text-yellow-500 scale-75">
                                                <Sparkles className="fill-yellow-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action 2: Create with AI */}
                        <div
                            onClick={() => navigate('/ai/generate')}
                            className="group flex gap-4 justify-between items-center p-6 bg-[#264653] hover:bg-[#1a3039] rounded-2xl shadow-[0_8px_0_#1a3039] hover:shadow-[0_4px_0_#1a3039] hover:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden relative"
                        >
                            <div className="flex-1 flex flex-col items-center text-center z-10">
                                <h3 className="font-extrabold text-3xl text-white mb-2 tracking-tight">A.I.</h3>
                                <p className="text-sm text-gray-200 font-semibold mb-6">Generate a quiz from<br />any subject or pdf</p>
                                <button className="bg-[#a8dadc] text-[#1d3557] font-bold py-3 px-8 rounded-full shadow-[0_4px_0_#457b9d] group-hover:shadow-[0_2px_0_#457b9d] group-hover:translate-y-0.5 transition-all w-fit">
                                    Quiz generator
                                </button>
                            </div>
                            <div className="hidden sm:flex flex-1 justify-center z-10 relative">
                                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-150" />
                                <div className="text-white relative z-10">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center p-4 shadow-xl">
                                        <div className="w-full h-full border-4 border-[#264653] rounded-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-100">
                                            {/* Minimal Avatar */}
                                            <div className="w-10 h-10 bg-[#264653] rounded-full mb-1"></div>
                                            <div className="w-16 h-12 bg-[#264653] rounded-t-4xl"></div>
                                            <div className="absolute top-2 left-2 text-[#457b9d] scale-100">
                                                <Sparkles className="fill-[#457b9d]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Quizzes Section */}
                {user && myQuizzes.length > 0 && (
                    <QuizSection
                        title="Quiz của tôi"
                        quizzes={myQuizzes}
                        onPlay={handlePlayNow}
                        onEdit={handleEditQuiz}
                        onAssign={handleOpenHomeworkModal}
                        iconColor="bg-indigo-500"
                    />
                )}

                {/* Categories Section */}
                <div id="explore-categories" className="space-y-16">
                    {categories.map((cat, idx) => (
                        <CategoryQuizzes
                            key={cat.id}
                            category={cat}
                            onPlay={handlePlayNow}
                            onEdit={handleEditQuiz}
                            onAssign={handleOpenHomeworkModal}
                            iconColor={idx % 2 === 0 ? "bg-rose-400" : "bg-emerald-400"}
                            isAiGenerated={cat.name.toLowerCase().includes('ai')}
                        />
                    ))}
                </div>
            </div>

            {/* Assign Homework Modal */}
            {isHomeworkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><SiGoogleclassroom className="text-indigo-600" size={20} /> Giao Bài Tập</h3>
                            <button onClick={() => setIsHomeworkModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmitHomework} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn Lớp Học *</label>
                                <select
                                    required
                                    value={homeworkForm.classroomId}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, classroomId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>-- Chọn một lớp --</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {classrooms.length === 0 && <p className="text-xs text-red-500 mt-2">Bạn chưa tạo lớp học nào.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Hạn chót (Tùy chọn)</label>
                                <input
                                    type="datetime-local"
                                    value={homeworkForm.deadline}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, deadline: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <input
                                    type="checkbox"
                                    id="strictMode"
                                    checked={homeworkForm.strictMode}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, strictMode: e.target.checked })}
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor="strictMode" className="text-sm font-medium text-orange-900 cursor-pointer select-none">
                                    <strong>Chế độ Nghiêm ngặt:</strong> Ngăn học sinh chuyển tab trình duyệt khi đang làm bài.
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsHomeworkModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Hủy</button>
                                <button type="submit" disabled={!homeworkForm.classroomId || classrooms.length === 0} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50">Giao Bài</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

const LandingHero = ({ navigate }: { navigate: (path: string) => void }) => {
    return (
        <div className="relative w-full py-12 lg:py-20 flex flex-col items-center justify-center text-center overflow-hidden">

            <div className="relative z-10 max-w-4xl mx-auto px-4">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-8 leading-tight drop-shadow-2xl">
                    Nâng Tầm{"\n"}
                    <span className="text-primary inline-block transform hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">Lớp Học!</span>
                </h1>

                <p className="text-xl md:text-3xl text-muted-foreground font-black max-w-3xl mx-auto mb-16 leading-relaxed opacity-90">
                    Quizmon giúp việc học trở nên tuyệt vời hơn với các bộ trắc nghiệm AI và các trận đấu trực tiếp kịch tính.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 items-center justify-center mb-24 w-full">
                    <Button
                        size="lg"
                        variant="default"
                        onClick={() => navigate('/login')}
                        className="w-full sm:w-auto"
                    >
                        Đăng ký miễn phí
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                            document.getElementById('explore-categories')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto"
                    >
                        Khám phá
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-7xl mx-auto px-4">
                <div className="flex flex-col items-center text-center p-10 bg-card/40 backdrop-blur-2xl rounded-[3rem] border-4 border-white/5 shadow-2xl transition-all hover:scale-102">
                    <div className="w-28 h-28 rounded-3xl bg-primary border-4 border-primary-foreground/30 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] flex items-center justify-center mb-8 transform -rotate-6">
                        <Sparkles className="w-14 h-14 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <h3 className="text-3xl font-black text-foreground mb-4">Phép màu AI</h3>
                    <p className="text-muted-foreground font-bold text-xl leading-relaxed opacity-80">
                        Tạo bài trắc nghiệm đầy đủ ngay lập tức từ văn bản hoặc PDF. Tiết kiệm hàng giờ nhập liệu!
                    </p>
                </div>

                <div className="flex flex-col items-center text-center p-10 bg-card/40 backdrop-blur-2xl rounded-[3rem] border-4 border-white/5 shadow-2xl transition-all hover:scale-102">
                    <div className="w-28 h-28 rounded-3xl bg-primary border-4 border-primary-foreground/30 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] flex items-center justify-center mb-8 transform rotate-6">
                        <Gamepad2 className="w-14 h-14 text-primary-foreground" />
                    </div>
                    <h3 className="text-3xl font-black text-foreground mb-4">Đấu Trực Tiếp</h3>
                    <p className="text-muted-foreground font-bold text-xl leading-relaxed opacity-80">
                        Tổ chức các trận đấu đua top trực tiếp, nơi học sinh trả lời trên thiết bị cá nhân để thắng.
                    </p>
                </div>

                <div className="flex flex-col items-center text-center p-10 bg-card/40 backdrop-blur-2xl rounded-[3rem] border-4 border-white/5 shadow-2xl transition-all hover:scale-102">
                    <div className="w-28 h-28 rounded-3xl bg-primary border-4 border-primary-foreground/30 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] flex items-center justify-center mb-8 transform -rotate-3">
                        <BookOpen className="w-14 h-14 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <h3 className="text-3xl font-black text-foreground mb-4">Bài Tập</h3>
                    <p className="text-muted-foreground font-bold text-xl leading-relaxed opacity-80">
                        Giao trắc nghiệm làm bài tập và theo dõi kết quả qua trung tâm lớp học trực quan.
                    </p>
                </div>
            </div>
        </div>
    );
};

const CategoryQuizzes = ({
    category,
    onPlay,
    onEdit,
    onAssign,
    iconColor,
    isAiGenerated
}: {
    category: Category,
    onPlay: (id: string | number) => void,
    onEdit: (id: string | number) => void,
    onAssign: (id: string | number) => void,
    iconColor: string,
    isAiGenerated: boolean
}) => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        const fetchQuizzesByCategory = async () => {
            try {
                const res = await apiClient.get(endpoints.getQuizByCategory(category.id as any));
                setQuizzes(res.data);
            } catch (err) {
                console.error(err);
                setQuizzes([]);
            }
        };

        fetchQuizzesByCategory();
    }, [category.id]);

    if (quizzes.length === 0) return null;

    return (
        <QuizSection
            title={category.name}
            quizzes={quizzes}
            onPlay={onPlay}
            onEdit={onEdit}
            onAssign={onAssign}
            iconColor={iconColor}
            isAiGeneratedSection={isAiGenerated}
        />
    );
};

export default Home;
