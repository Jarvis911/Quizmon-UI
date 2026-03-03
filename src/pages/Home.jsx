import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Palette, Plus, Play, Edit3, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

//Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { useTheme, BACKGROUND_THEMES } from "@/context/ThemeContext";

const Home = () => {
  const { user, token } = useAuth();
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Homework Modal State
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [homeworkForm, setHomeworkForm] = useState({ classroomId: "", deadline: "", strictMode: false });

  // Theme state
  const { themeId, handleThemeChange } = useTheme();

  // Fetch my quizzes and categories first
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!token) return;
      try {
        const res = await axios.get(endpoints.classrooms, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassrooms(res.data.filter(c => c.teacher?.id === user?.id)); // Only classes they teach
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

  const handlePlayNow = async (quizId) => {
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

  const handleEditQuiz = async (quizId) => {
    navigate(`/quiz/${quizId}/editor`);
  };

  const handleOpenHomeworkModal = (quizId) => {
    setSelectedQuizId(quizId);
    setIsHomeworkModalOpen(true);
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    try {
      await axios.post(endpoints.homework, {
        quizId: selectedQuizId,
        classroomId: homeworkForm.classroomId,
        deadline: homeworkForm.deadline || null,
        strictMode: homeworkForm.strictMode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsHomeworkModalOpen(false);
      setHomeworkForm({ classroomId: "", deadline: "", strictMode: false });
      alert("Homework assigned successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign homework");
    }
  };

  const renderQuizCard = (quiz) => {
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
        {/* Modern Hero Section */}
        {user && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-xl shadow-black/5 border border-white/50 group hover:bg-white/70 transition-colors duration-500">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 flex items-center gap-3">
                Chào mừng, {user.username}! <span className="animate-wave inline-block origin-bottom-right">👋</span>
              </h1>
              <p className="text-lg text-slate-600 font-medium max-w-xl leading-relaxed">
                Sẵn sàng khám phá và tạo nên những bài trắc nghiệm thú vị hôm nay?
              </p>
            </div>

            <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl border-white/40 bg-white/50 hover:bg-white/80 shadow-sm backdrop-blur-md transition-all">
                    <Palette className="w-4 h-4 mr-2 text-indigo-500" />
                    Giao diện
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 p-2 shadow-2xl">
                  <DropdownMenuLabel className="font-bold text-slate-700">Màu nền giao diện</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  {BACKGROUND_THEMES.map((theme) => (
                    <DropdownMenuItem
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`cursor-pointer rounded-xl mb-1 flex items-center gap-2 ${themeId === theme.id ? 'bg-indigo-50/80 font-semibold text-indigo-700' : 'text-slate-600 focus:bg-slate-50 focus:text-slate-900'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border border-black/10 shadow-sm ${theme.className} ${theme.id === 'default' ? 'bg-slate-200' : ''}`} />
                      {theme.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => navigate('/quiz')} className="rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white items-center h-10 px-5">
                <Plus className="w-5 h-5 mr-1" />
                Tạo Quiz mới
              </Button>
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

const QuizCarousel = ({ quizzes, renderQuizCard }) => (
  <Swiper
    modules={[Navigation]}
    spaceBetween={24}
    navigation
    breakpoints={{
      320: { slidesPerView: 1.5, spaceBetween: 16 },
      640: { slidesPerView: 2.5, spaceBetween: 20 },
      768: { slidesPerView: 3.5, spaceBetween: 24 },
      1024: { slidesPerView: 4.5 },
      1280: { slidesPerView: 5.5 },
    }}
    className="pb-12 px-2 -mx-2"
  >
    {quizzes.map((quiz) => (
      <SwiperSlide key={quiz.id} className="py-4">
        {renderQuizCard(quiz)}
      </SwiperSlide>
    ))}
  </Swiper>
);

const CategoryQuizzes = ({ categoryId, renderQuizCard }) => {
  const [quizzes, setQuizzes] = useState([]);

  const fetchQuizzesByCategory = async (categoryId) => {
    try {
      const res = await axios.get(endpoints.getQuizByCategory(categoryId));
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
