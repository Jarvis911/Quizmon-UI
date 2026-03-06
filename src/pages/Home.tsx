import { useState, useEffect, useCallback, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, User } from "@/context/AuthContext";
import axios from "axios";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { BookOpen, ChevronLeft, ChevronRight, Edit3, Gamepad2, Palette, Play, Plus, Sparkles, Zap } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Embla Carousel
import useEmblaCarousel from "embla-carousel-react";

interface Quiz {
    id: string | number;
    title: string;
    image?: string;
    creatorId: number;
    creator?: {
        username: string;
    };
}

interface Category {
    id: string | number;
    name: string;
}

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
                const res = await axios.get(endpoints.classrooms, {
                    headers: { Authorization: token }
                });
                setClassrooms(res.data.filter((c: Classroom) => (c.teacher?.id as any) === user?.id)); // Only classes they teach
            } catch (err) { console.error(err); }
        };

        const fetchMyQuizzes = async () => {
            try {
                if (token) {
                    const res = await axios.get(endpoints.quizzes, {
                        headers: {
                            Authorization: token,
                        },
                    });

                    setMyQuizzes(res.data);
                }
            } catch (err) {
                console.error(err);
            }
        };

        const fetchCategories = async () => {
            try {
                const res = await axios.get(endpoints.category);
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
            const res = await axios.post(
                endpoints.matches,
                { quizId },
                {
                    headers: {
                        Authorization: token,
                        "Content-Type": "application/json",
                    },
                }
            );

            navigate(`/match/${res.data.id}/lobby`);
        } catch (err) {
            console.error(err);
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
            await axios.post(endpoints.homework, {
                quizId: selectedQuizId,
                classroomId: homeworkForm.classroomId,
                deadline: homeworkForm.deadline || null,
                strictMode: homeworkForm.strictMode
            }, {
                headers: { Authorization: token }
            });
            setIsHomeworkModalOpen(false);
            setHomeworkForm({ classroomId: "", deadline: "", strictMode: false });
            alert("Homework assigned successfully!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to assign homework");
        }
    };

    const renderQuizCard = (quiz: Quiz) => {
        return (
            <Card
                key={quiz.id}
                className="flex relative justify-between min-w-[200px] max-w-[220px] group cursor-pointer bg-white/80 backdrop-blur-md border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden"
            >
                <CardHeader className="p-4 pb-2 z-10 relative">
                    <CardTitle className="text-lg font-bold leading-tight line-clamp-2 text-slate-800 group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-grow flex flex-col justify-end z-10 relative">
                    {quiz.image && (
                        <div className="rounded-xl overflow-hidden mb-3 ring-1 ring-black/5">
                            <img
                                src={quiz.image}
                                alt={quiz.title}
                                className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                    )}
                    <div className="mt-2 flex flex-row justify-between items-center gap-1">
                        <div className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded-full">
                            <span className="text-yellow-500 text-xs">⭐</span>
                            <span className="text-xs font-semibold text-slate-700">
                                4.0
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 truncate max-w-[100px]">
                            bởi {quiz.creator?.username || 'Ẩn danh'}
                        </p>
                    </div>
                </CardContent>
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col gap-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <Button className="w-3/4 rounded-full shadow-lg bg-white text-slate-900 hover:bg-gray-100 hover:scale-105 transition-transform" onClick={() => handlePlayNow(quiz.id)}>
                        <Play className="w-4 h-4 mr-1 fill-current" /> Chơi
                    </Button>
                    {user && user.id === quiz.creatorId && (
                        <>
                            <Button variant="secondary" className="w-3/4 rounded-full shadow-lg bg-white/20 text-white hover:bg-white/30 hover:scale-105 transition-transform backdrop-blur-sm border border-white/20" onClick={() => handleEditQuiz(quiz.id)}>
                                <Edit3 className="w-4 h-4 mr-1" /> Sửa
                            </Button>
                            <Button variant="secondary" className="w-3/4 rounded-full shadow-lg bg-indigo-500/80 text-white hover:bg-indigo-600 hover:scale-105 transition-transform backdrop-blur-sm border border-indigo-400" onClick={() => handleOpenHomeworkModal(quiz.id)}>
                                <BookOpen className="w-4 h-4 mr-1" /> Giao Bài
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Dynamic Custom Background removed here because it's now handled globally via ThemeContext */}

            <div className="p-6 md:p-10 space-y-12 max-w-7xl mx-auto">
                {!user && <LandingHero navigate={navigate} />}

                {/* Quick Actions Hub / Welcome Section */}
                {user && (
                    <div className="relative mb-12 flex flex-col lg:flex-row gap-6 lg:items-center justify-between w-full">
                        {/* Welcome Message */}
                        <div className="lg:max-w-[40%]">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 flex items-center gap-3">
                                Chào mừng, {user.username}! <span className="animate-wave inline-block origin-bottom-right">👋</span>
                            </h1>
                            <p className="text-lg text-slate-600 font-medium max-w-xl leading-relaxed">
                                Sẵn sàng khám phá và tạo nên những bài trắc nghiệm thú vị hôm nay?
                            </p>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Action 1: Create Manually */}
                            <div
                                onClick={() => navigate('/quiz')}
                                className="group flex flex-col items-start p-5 bg-white/60 hover:bg-white/90 backdrop-blur-lg border border-primary/20 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">Tạo Quiz mới</h3>
                                <p className="text-sm text-slate-500 font-medium">Biên soạn thủ công</p>
                            </div>

                            {/* Action 2: Create with AI */}
                            <div
                                onClick={() => navigate('/ai/generate')}
                                className="group flex flex-col items-start p-5 bg-primary/5 hover:bg-primary/10 backdrop-blur-lg border border-primary/30 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">Tạo bằng AI</h3>
                                <p className="text-sm text-slate-500 font-medium">Tiết kiệm 90% thời gian</p>
                            </div>

                            {/* Action 3: Classrooms */}
                            <div
                                onClick={() => navigate('/classrooms')}
                                className="group flex flex-col items-start p-5 bg-white/60 hover:bg-white/90 backdrop-blur-lg border border-primary/20 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer sm:col-span-2 md:col-span-1"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-1">Lớp học</h3>
                                <p className="text-sm text-slate-500 font-medium">Quản lý bài tập & học sinh</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Quizzes Section */}
                {user && myQuizzes.length > 0 && (
                    <section className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1.5 bg-indigo-500 rounded-full" />
                            <h2 className="text-slate-800 text-2xl md:text-3xl font-bold tracking-tight">Quiz của tôi</h2>
                        </div>
                        <QuizCarousel quizzes={myQuizzes} renderQuizCard={renderQuizCard} />
                    </section>
                )}

                {/* Categories Section */}
                <div id="explore-categories">
                    {categories.map((cat) => (
                        <section key={cat.id} className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-1.5 bg-rose-400 rounded-full" />
                                <h2 className="text-slate-800 text-2xl md:text-3xl font-bold tracking-tight">{cat.name}</h2>
                            </div>
                            <CategoryQuizzes
                                categoryId={cat.id}
                                renderQuizCard={renderQuizCard}
                            />
                        </section>
                    ))}
                </div>
            </div>

            {/* Assign Homework Modal */}
            {isHomeworkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="text-indigo-600" size={20} /> Assign Homework</h3>
                            <button onClick={() => setIsHomeworkModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmitHomework} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Classroom *</label>
                                <select
                                    required
                                    value={homeworkForm.classroomId}
                                    onChange={e => setHomeworkForm({ ...homeworkForm, classroomId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>-- Choose a class --</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {classrooms.length === 0 && <p className="text-xs text-red-500 mt-2">You haven't created any classrooms yet.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline (Optional)</label>
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
                                    <strong>Strict Mode:</strong> Prevent students from switching browser tabs while taking the quiz.
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsHomeworkModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={!homeworkForm.classroomId || classrooms.length === 0} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50">Assign Match</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

// ==========================================
// LANDING PAGE FOR UNAUTHENTICATED USERS
// ==========================================
const LandingHero = ({ navigate }: { navigate: (path: string) => void }) => {
    return (
        <div className="relative w-full py-12 lg:py-20 flex flex-col items-center justify-center text-center overflow-hidden">

            {/* Playful Floating Background Elements */}
            <div className="absolute top-10 left-10 w-16 h-16 bg-blue-500 rounded-2xl rotate-12 opacity-80 animate-bounce" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-20 left-20 w-12 h-12 bg-orange-400 rounded-full opacity-80 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <div className="absolute top-20 right-20 w-20 h-20 bg-emerald-400 rounded-3xl -rotate-12 opacity-80 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
            <div className="absolute bottom-10 right-32 w-14 h-14 bg-purple-500 rounded-full opacity-80 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />

            {/* Hero Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4">
                <h1 className="text-6xl md:text-7xl lg:text-[5rem] font-black tracking-tighter text-slate-800 mb-6 leading-tight whitespace-pre-line">
                    Level Up Your{"\n"}
                    <span className="text-blue-500 inline-block transform hover:scale-110 transition-transform duration-300">Classroom!</span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-600 font-bold max-w-2xl mx-auto mb-10 leading-relaxed">
                    Quizmon makes learning awesome with AI-powered quizzes and intense live games.
                </p>

                {/* Call to Actions (Blooket Style 3D Chunky Buttons) */}
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

            {/* Feature Grid (Blooket Style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto px-4">
                {/* Feature 1 */}
                <div className="flex flex-col items-center text-center p-8 bg-primary/10 rounded-[2.5rem] border-4 border-primary/20">
                    <div className="w-24 h-24 rounded-full bg-primary border-4 border-primary-foreground/30 shadow-[0_6px_0_0_var(--color-primary-foreground)] flex items-center justify-center mb-6 transform -rotate-6">
                        <Sparkles className="w-12 h-12 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 block">AI Magic</h3>
                    <p className="text-slate-600 font-bold text-lg leading-relaxed">
                        Generate full quizzes instantly from any text or PDF. Save hours of manual typing!
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col items-center text-center p-8 bg-primary/10 rounded-[2.5rem] border-4 border-primary/20">
                    <div className="w-24 h-24 rounded-full bg-primary border-4 border-primary-foreground/30 shadow-[0_6px_0_0_var(--color-primary-foreground)] flex items-center justify-center mb-6 transform rotate-6">
                        <Gamepad2 className="w-12 h-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 block">Live Games</h3>
                    <p className="text-slate-600 font-bold text-lg leading-relaxed">
                        Host live racing matches where students answer on their devices to win.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col items-center text-center p-8 bg-primary/10 rounded-[2.5rem] border-4 border-primary/20">
                    <div className="w-24 h-24 rounded-full bg-primary border-4 border-primary-foreground/30 shadow-[0_6px_0_0_var(--color-primary-foreground)] flex items-center justify-center mb-6 transform -rotate-3">
                        <BookOpen className="w-12 h-12 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 block">Homework</h3>
                    <p className="text-slate-600 font-bold text-lg leading-relaxed">
                        Assign quizzes as homework and track completion through our intuitive classroom hub.
                    </p>
                </div>
            </div>
        </div>
    );
};
// ==========================================


const QuizCarousel = ({ quizzes, renderQuizCard }: { quizzes: Quiz[], renderQuizCard: (quiz: Quiz) => React.ReactNode }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <div className="relative group/carousel">
            <div className="overflow-hidden pb-12 px-2 -mx-2" ref={emblaRef}>
                <div className="flex gap-4 sm:gap-5 md:gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="flex-[0_0_80%] sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_22%] xl:flex-[0_0_18%] min-w-0 py-4">
                            {renderQuizCard(quiz)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={scrollPrev}
                className="absolute left-[-1rem] top-1/3 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 z-20 border border-slate-200"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={scrollNext}
                className="absolute right-[-1rem] top-1/3 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 z-20 border border-slate-200"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
};

const CategoryQuizzes = ({ categoryId, renderQuizCard }: { categoryId: string | number, renderQuizCard: (quiz: Quiz) => React.ReactNode }) => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    const fetchQuizzesByCategory = async (categoryId: string | number) => {
        try {
            const res = await axios.get(endpoints.getQuizByCategory(categoryId as any));
            return res.data;
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    useEffect(() => {
        const fetch = async () => {
            const data = await fetchQuizzesByCategory(categoryId);
            setQuizzes(data);
        };

        fetch();
    }, [categoryId]);

    if (quizzes.length === 0) return null;

    return (
        <QuizCarousel quizzes={quizzes} renderQuizCard={renderQuizCard} />
    );
};

export default Home;
