import { useState, useEffect, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, MapIcon, Settings } from "lucide-react";
import { MdImageNotSupported } from "react-icons/md";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import type { Quiz } from "@/types";

import ButtonQuestionForm from "@/components/question/ButtonQuestionForm";
import CheckboxQuestionForm from "@/components/question/CheckboxQuestionForm";
import RangeQuestionForm from "@/components/question/RangeQuestionForm";
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
                case "RANGE":
                    return <RangeQuestionForm {...formProps} />;
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
            onDirtyChange: setIsDirty
        };

        switch (q.type) {
            case "BUTTONS":
                return <ButtonQuestionForm {...formProps} />;
            case "CHECKBOXES":
                return <CheckboxQuestionForm {...formProps} />;
            case "RANGE":
                return <RangeQuestionForm {...formProps} />;
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
            <footer className="fixed inset-x-0 bottom-0 overflow-x-auto h-24 flex items-center gap-3 px-4 bg-card/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-40">
                {/* General Information Square */}
                <div
                    className="min-w-20 h-20 relative rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center overflow-hidden shadow-sm hover:scale-105 border-primary/30 hover:border-primary/50 bg-primary/5 group shrink-0"
                    onClick={() => setIsSettingsOpen(true)}
                    title="Cài đặt thông tin chung"
                >
                    <Settings className="w-6 h-6 text-primary/80 mb-1 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-[10px] font-bold text-foreground/80 leading-none">Cài đặt</span>
                </div>

                {questions.map((q, i) => (
                    <div
                        key={q.id}
                        className={`min-w-20 h-20 relative rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-center overflow-hidden shadow-sm hover:scale-105 ${i === activeIndex ? "border-primary ring-2 ring-primary/20 scale-105 z-10" : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-white/5"
                            }`}
                        onClick={() => {
                            setActiveIndex(i);
                            setCreatingType(null);
                        }}
                    >
                        <div className="text-foreground font-black absolute top-1 left-2 drop-shadow-md z-10">{i + 1}</div>

                        {/* thumbnail */}
                        {q.media && q.media.length > 0 ? (
                            q.media.map((m) => {
                                if (m.type === "IMAGE") {
                                    return (
                                        <img
                                            key={m.id}
                                            className="w-16 h-16 rounded-md"
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
                                            className="w-16 h-16 rounded-md"
                                            alt=""
                                        />
                                    );
                                }
                                return null;
                            })
                        ) : (
                            <MdImageNotSupported className="w-10 h-10 text-muted-foreground/40" />
                        )}
                    </div>
                ))}
                {/* Add button */}
                <Button
                    onClick={() => setCreatingType("SELECT")}
                    variant="secondary"
                    className="min-w-20 h-20 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all shadow-md group"
                >
                    <Plus className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </Button>
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
