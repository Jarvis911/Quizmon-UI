import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Plus, Type, MapIcon } from "lucide-react";
import axios from "axios";
import endpoints from "@/api/api";

import ButtonQuestionForm from "@/components/question/ButtonQuestionForm";
import CheckboxQuestionForm from "@/components/question/CheckboxQuestionForm";
import RangeQuestionForm from "@/components/question/RangeQuestionForm";
import ReorderQuestionForm from "@/components/question/ReorderQuestionForm";
import TypeAnswerQuestionForm from "@/components/question/TypeAnswerQuestionForm";
import LocationQuestionForm from "@/components/question/LocationQuestionForm";
import SelectQuestionType from "@/components/quiz/SelectQuestionType";

const QuizEditor = () => {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [creatingType, setCreatingType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(endpoints.quiz(id));
        const normalized = (res.data.questions || []).map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          media: q.media || [],
          options: q.options || [],
          location: q.location || [],
          range: q.range || [],
          typeAnswer: q.typeAnswer || []
        }));
        setQuestions(normalized);
        setActiveIndex(normalized.length ? 0 : null);
      } catch (err) {
        console.error("Failed to load quiz:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const addQuestion = (type) => {
    setCreatingType(type);
    setActiveIndex(null);
  };

  const handleSaveNew = (newQ) => {
    setQuestions([...questions, newQ]);
    setActiveIndex(questions.length);
    setCreatingType(null);
  }

  const renderActiveQuestion = () => {
    if (loading) return <p className="text-gray-500">Đang tải quiz...</p>;

    if (creatingType) {
      if (creatingType === "BUTTONS")
        return <ButtonQuestionForm quizId={id} onSaved={handleSaveNew} />
      if (creatingType === "CHECKBOXES")
        return <CheckboxQuestionForm quizId={id} onSaved={handleSaveNew} />
      if (creatingType === "RANGE")
        return <RangeQuestionForm quizId={id} onSaved={handleSaveNew} />
      if (creatingType === "REORDER")
        return <ReorderQuestionForm quizId={id} onSaved={handleSaveNew} />
      if (creatingType === "TYPEANSWER")
        return <TypeAnswerQuestionForm quizId={id} onSaved={handleSaveNew} />
      if (creatingType === "LOCATION")
        return <LocationQuestionForm quizId={id} onSaved={handleSaveNew} />
    }

    const q = questions[activeIndex];

    if (!q) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p>Chưa có câu hỏi nào</p>
          <Button className="mt-4">
            + Thêm câu hỏi đầu tiên
          </Button>
        </div>
      );
    }

    switch (q.type) {
      case "BUTTONS":
        return (
          <ButtonQuestionForm
            question={q} quizId={id}
          />
        );
      case "CHECKBOXES":
        return (
          <CheckboxQuestionForm
            question={q} quizId={id}
          />
        );
      case "RANGE":
        return (
          <RangeQuestionForm
            question={q} quizId={id}
          />
        );
      case "REORDER":
        return (
          <ReorderQuestionForm
            question={q} quizId={id}
          />
        );
      case "TYPEANSWER":
        return (
          <TypeAnswerQuestionForm
            question={q} quizId={id}
          />
        );
      case "LOCATION":
        return (
          <LocationQuestionForm
            question={q} quizId={id}
          />
        )
      default:
        return <p className="text-red-500">Loại câu hỏi chưa được hỗ trợ</p>;
    }
  };

  return (
    <div className="flex justify-center">
      <main className="p-4 pb-28 inline-flex">
        {creatingType != "SELECT" && renderActiveQuestion()}
        {creatingType === "SELECT" && (
          <SelectQuestionType
            onSelect={(t) => addQuestion(t)}
            onClose={() => setCreatingType(null)}
          />
        )}
      </main>

      {/* Navbar preview */}
      <footer className="fixed inset-x-0 bottom-0 overflow-x-auto h-24 flex items-center gap-3 px-2 bg-black/60 backdrop-blur-md">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`min-w-20 h-20 relative rounded-xl border-2 cursor-pointer flex items-center justify-center overflow-hidden ${i === activeIndex ? "border-blue-500" : "border-gray-300"
              }`}
            onClick={() => {
              setActiveIndex(i);
              setCreatingType(null);
            }}
          >
            <div className="text-white absolute top-0 left-2">{i + 1}</div>

            {/* thumbnail (ảnh/video) */}
            {q.media && q.media.length > 0 ? (q.media.map((m) => {
              if (m.type === "IMAGE") {
                return <img className="w-16 h-16 rounded-md" src={m.url}></img>;
              }
              if (m.type === "VIDEO") {
                function getYoutubeThumbnail(url) {
                  const regex =
                    /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|embed)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                  const match = url.match(regex);
                  return match
                    ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
                    : null;
                }

                const thumbnail = getYoutubeThumbnail(m.url);
                return (
                  <img
                    key={m.id}
                    src={thumbnail}
                    className="w-16 h-16 rounded-md"
                  />
                );
              }
            })) : (<MapIcon className="w-12 h-12 text-gray-500"></MapIcon>)}

          </div>
        ))}
        {/* nút thêm */}
        <Button
          onClick={() => setCreatingType("SELECT")}
          className="w-20 h-20 rounded-xl flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </Button>

      </footer>
    </div>
  );
};

export default QuizEditor;
