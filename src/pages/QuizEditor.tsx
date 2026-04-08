import { useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Trash2 } from "lucide-react";
import { MdImageNotSupported } from "react-icons/md";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import type { Quiz } from "@/types";
import { useModal } from "@/context/ModalContext";

import ButtonQuestionForm from "@/components/question/ButtonQuestionForm";
import CheckboxQuestionForm from "@/components/question/CheckboxQuestionForm";
import ReorderQuestionForm from "@/components/question/ReorderQuestionForm";
import TypeAnswerQuestionForm from "@/components/question/TypeAnswerQuestionForm";
import LocationQuestionForm from "@/components/question/LocationQuestionForm";
import SelectQuestionType from "@/components/quiz/SelectQuestionType";
import QuizSettingsModal from "@/components/quiz/QuizSettingsModal";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface QuestionMedia {
    id: number;
    type: "IMAGE" | "VIDEO";
    url: string;
}

interface EditorQuestion {
    id: number;
    text: string;
    type: string;
    media: QuestionMedia[];
    options: unknown[];
    data: unknown;
}

interface QuizResponse extends Omit<Quiz, 'questions'> {
    questions: EditorQuestion[];
}

const QuizEditor = () => {
    const { id } = useParams<{ id: string }>();
    const { showAlert } = useModal();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [questions, setQuestions] = useState<EditorQuestion[]>([]);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [creatingType, setCreatingType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);

    useUnsavedChanges(isDirty);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!id) return;
            try {
                const res = await apiClient.get<QuizResponse>(endpoints.quiz(Number(id)));
                const normalized: EditorQuestion[] = (res.data.questions || []).map((q) => ({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    media: q.media || [],
                    options: q.options || [],
                    data: q.data || null,
                }));
                setQuestions(normalized);
                setActiveIndex(normalized.length ? 0 : null);
                setQuiz(res.data as unknown as Quiz);
            } catch (err) {
                console.error("Failed to load quiz:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const addQuestion = (type: string) => {
        setCreatingType(type);
        setActiveIndex(null);
    };

    const handleSaveNew = (newQ: EditorQuestion) => {
        setQuestions([...questions, newQ]);
        setActiveIndex(questions.length);
        setCreatingType(null);
        setIsDirty(false);
    };

    const handleUpdate = (updatedQ: EditorQuestion) => {
        setQuestions(questions.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
        setIsDirty(false);
    };

    const handleDeleteQuestion = async (e: React.MouseEvent, questionId: number) => {
        e.stopPropagation(); // Prevent selecting the question when clicking delete
        
        showAlert({
            title: "Xác nhận xóa câu hỏi",
            message: "Bạn có chắc chắn muốn xóa câu hỏi này?",
            type: "warning",
            onConfirm: async () => {
                try {
                    await apiClient.delete(endpoints.question_delete(questionId));
                    const newQuestions = questions.filter(q => q.id !== questionId);
                    setQuestions(newQuestions);
                    
                    // Adjust active index
                    if (activeIndex !== null) {
                        if (newQuestions.length === 0) {
                            setActiveIndex(null);
                        } else if (activeIndex >= newQuestions.length) {
                            setActiveIndex(newQuestions.length - 1);
                        }
                    }
                } catch (err) {
                    console.error("Failed to delete question:", err);
                    showAlert({
                        title: "Lỗi",
                        message: "Không thể xóa câu hỏi.",
                        type: "error"
                    });
                }
            }
        });
    };

    const getYoutubeThumbnail = (url: string): string | null => {
        const regex =
            /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|embed)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
    };

    const renderActiveQuestion = (): ReactNode => {
        if (loading) return <p className="text-muted-foreground animate-pulse font-medium">Đang tải quiz...</p>;

        if (creatingType) {
            const formProps = {
                quizId: id!,
                onSaved: handleSaveNew,
                question: undefined as any,
                onDirtyChange: setIsDirty
            };

            switch (creatingType) {
                case "BUTTONS":
                    return <ButtonQuestionForm {...formProps} />;
                case "CHECKBOXES":
                    return <CheckboxQuestionForm {...formProps} />;
                case "REORDER":
                    return <ReorderQuestionForm {...formProps} />;
                case "TYPEANSWER":
                    return <TypeAnswerQuestionForm {...formProps} />;
                case "LOCATION":
                    return <LocationQuestionForm {...formProps} />;
            }
        }

        const q = activeIndex !== null ? questions[activeIndex] : null;

        if (!q) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p className="text-lg font-medium">Chưa có câu hỏi nào</p>
                    <Button onClick={() => setCreatingType("SELECT")} className="mt-4 px-8 py-6 text-lg font-bold shadow-lg">
                        <Plus className="w-5 h-5 mr-2" /> Thêm câu hỏi đầu tiên
                    </Button>
                </div>
            );
        }

        const formProps = {
            question: q,
            quizId: id!,
            onSaved: handleUpdate,
            onDirtyChange: setIsDirty,
            onDelete: (e: React.MouseEvent) => handleDeleteQuestion(e, q.id)
        };


        switch (q.type) {
            case "BUTTONS":
                return <ButtonQuestionForm {...formProps} />;
            case "CHECKBOXES":
                return <CheckboxQuestionForm {...formProps} />;
            case "REORDER":
                return <ReorderQuestionForm {...formProps} />;
            case "TYPEANSWER":
                return <TypeAnswerQuestionForm {...formProps} />;
            case "LOCATION":
                return <LocationQuestionForm {...formProps} />;
            default:
                return <p className="text-destructive font-bold">Loại câu hỏi chưa được hỗ trợ</p>;
        }
    };

    return (
        <div className="flex justify-center flex-col min-h-screen pb-24">
            {/* No Header */}

            <main className="p-6 flex-1 flex justify-center">
                <div className="w-full max-w-5xl">
                    {creatingType !== "SELECT" && renderActiveQuestion()}
                    {creatingType === "SELECT" && (
                        <SelectQuestionType
                            onSelect={(t) => addQuestion(t)}
                            onClose={() => setCreatingType(null)}
                        />
                    )}
                </div>
            </main>

            {/* Navbar preview */}
            <footer className="fixed inset-x-0 bottom-0 h-20 md:h-24 flex items-center justify-between px-2 md:px-4 bg-card/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-40 gap-2">
                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto flex-1 h-full py-2 pl-2">
                    {/* Edit Cover */}
                    <div
                        className="min-w-16 h-16 md:min-w-20 md:h-20 relative rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center overflow-hidden shadow-sm hover:scale-105 border-primary/30 hover:border-primary/50 bg-primary/5 group shrink-0"
                        onClick={() => setIsSettingsOpen(true)}
                        title="Sửa ảnh bìa và thông tin"
                    >
                        <Settings className="w-5 h-5 md:w-6 md:h-6 text-primary/80 mb-1 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="text-[9px] md:text-[10px] font-bold text-foreground/80 leading-none">Sửa bìa</span>
                    </div>

                    {questions.map((q, i) => (
                        <div
                            key={q.id}
                            className={`min-w-16 h-16 md:min-w-20 md:h-20 relative rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-center overflow-hidden shadow-sm hover:scale-105 shrink-0 group ${i === activeIndex ? "border-primary ring-2 ring-primary/20 scale-105 z-10" : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-white/5"
                                }`}
                            onClick={() => {
                                setActiveIndex(i);
                                setCreatingType(null);
                            }}
                        >
                            <div className="text-foreground font-black absolute top-1 left-2 drop-shadow-md z-10 text-xs md:text-base">{i + 1}</div>

                            {/* Delete button overlay */}
                            <button
                                onClick={(e) => handleDeleteQuestion(e, q.id)}
                                className="absolute top-1 right-1 p-1 bg-rose-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-rose-600 shadow-md"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>

                            {/* thumbnail */}
                            {q.media && q.media.length > 0 ? (
                                q.media.map((m) => {
                                    if (m.type === "IMAGE") {
                                        return (
                                            <img
                                                key={m.id}
                                                className="w-12 h-12 md:w-16 md:h-16 rounded-md object-cover"
                                                src={m.url}
                                                alt=""
                                            />
                                        );
                                    }
                                    if (m.type === "VIDEO") {
                                        const thumbnail = getYoutubeThumbnail(m.url);
                                        return (
                                            <img
                                                key={m.id}
                                                src={thumbnail || ""}
                                                className="w-12 h-12 md:w-16 md:h-16 rounded-md object-cover"
                                                alt=""
                                            />
                                        );
                                    }
                                    return null;
                                })
                            ) : (
                                <MdImageNotSupported className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/40" />
                            )}
                        </div>
                    ))}
                    {/* Add button */}
                    <Button
                        onClick={() => setCreatingType("SELECT")}
                        variant="secondary"
                        className="min-w-16 h-16 md:min-w-20 md:h-20 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all shadow-md group shrink-0"
                    >
                        <Plus className="w-6 h-6 md:w-8 md:h-8 text-primary group-hover:scale-110 transition-transform" />
                    </Button>
                </div>

                {/* Save and Exit */}
                <div className="shrink-0 flex items-center pl-1 md:pl-2">
                    <div
                        className="min-w-16 h-16 md:min-w-20 md:h-20 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center overflow-hidden shadow-sm hover:scale-105 border-green-500/30 hover:border-green-500/50 bg-green-500/5 group"
                        onClick={() => {
                            window.location.href = `/library`; 
                        }}
                        title="Lưu và Thoát"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-6 md:h-6 text-green-500/80 mb-1 group-hover:scale-110 transition-transform duration-300">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span className="text-[9px] md:text-[10px] font-bold text-foreground/80 leading-none text-center">Lưu <br className="md:hidden" /> & Thoát</span>
                    </div>
                </div>
            </footer>


            {quiz && (
                <QuizSettingsModal
                    quiz={quiz}
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    onSuccess={(updatedQuiz) => {
                        setQuiz(updatedQuiz);
                    }}
                />
            )}
        </div>
    );
};

export default QuizEditor;
