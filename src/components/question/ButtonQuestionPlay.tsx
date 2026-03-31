import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useQuestionSocket from "@/hooks/useQuestionSocket"
import QuestionMedia from "./QuestionMedia";
import apiClient from "@/api/client";
import endpoints from "../../api/api";

const OPTION_COLORS = [
  "from-red-500/80 to-red-600/80",
  "from-blue-500/80 to-blue-600/80",
  "from-emerald-500/80 to-emerald-600/80",
  "from-amber-500/80 to-amber-600/80",
  "from-purple-500/80 to-purple-600/80",
  "from-pink-500/80 to-pink-600/80",
];

const OPTION_ICONS = ["🔴", "🔵", "🟢", "🟡", "🟣", "🩷"];

const ButtonQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult }) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(
    socket,
    userId,
    question.id,
    () => onResult?.(true),
    () => onResult?.(false)
  );

  useEffect(() => {
    setSelectedAnswerId(null);
    setIsSubmitted(false);
  }, [question.id]);

  const handleAnswerSelect = async (index) => {
    if (isSubmitted || timer <= 0) return;
    setSelectedAnswerId(index);
    setIsSubmitted(true);

    // Auto-submit immediately for BUTTONS (single-choice)
    if (mode === "HOMEWORK") {
      try {
        const res = await apiClient.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerData: index
        });
        if (onResult) onResult(res.data.isCorrect);
        if (onHomeworkSubmit) onHomeworkSubmit();
      } catch (err) {
        console.error("Failed to submit homework answer", err);
      }
    } else {
      socket.emit("submitAnswer", {
        matchId,
        questionId: question.id,
        answer: index,
        userId,
      });
    }
  };

  const wrapperClass = `w-full max-w-5xl mx-auto flex flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-foreground flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] max-w-full wrap-break-word text-2xl font-black mb-6 text-foreground drop-shadow-sm">
            {question.text}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, idx) => {
              const isSelected = selectedAnswerId === idx;
              const isAnswered = selectedAnswerId !== null;

              const bgBase = `bg-gradient-to-br ${OPTION_COLORS[idx % OPTION_COLORS.length]} border-white/20`;
              const bgHover = isAnswered
                ? ""
                : isSelected
                  ? "bg-amber-400 border-amber-500 shadow-amber-300/50"
                  : "hover:bg-amber-400 hover:border-amber-500 hover:scale-105 hover:shadow-lg";

              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={isAnswered || timer <= 0}
                  className={`
                 relative flex flex-col items-center justify-center p-4
                 rounded-2xl border-4 transition-all duration-300
                 shadow-md
                 h-32 md:h-40 w-full
                 ${bgBase} ${bgHover}
                 ${isSelected && !isAnswered ? "scale-105 shadow-xl ring-4 ring-white/50" : ""}
                 ${isAnswered && !isSelected ? "opacity-50 scale-95 saturate-50" : ""}
                 ${timer <= 0 && !isAnswered && !isSelected ? "opacity-30" : "opacity-100"}
              `}
                >
                  <span className="text-white text-lg md:text-2xl font-bold text-center leading-tight drop-shadow-sm px-2">
                    {opt.text}
                  </span>

                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonQuestionPlay;
