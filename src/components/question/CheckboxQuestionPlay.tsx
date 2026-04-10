import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import apiClient from "@/api/client";
import endpoints from "../../api/api";

const CheckboxQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult, onAnswered, correctAnswer }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(
    socket,
    userId,
    question.id,
    () => onResult?.(true),
    () => onResult?.(false)
  );

  useEffect(() => {
    setSelectedIds([]);
    setIsSubmitted(false);
  }, [question.id]);

  const handleSelect = (idx) => {
    if (isSubmitted || timer <= 0 || correctAnswer !== null) return;
    if (selectedIds.includes(idx)) {
      setSelectedIds(selectedIds.filter(i => i !== idx));
    } else {
      setSelectedIds([...selectedIds, idx]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0 || isSubmitted || correctAnswer !== null) return;

    setIsSubmitted(true);
    onAnswered?.(); // Notify parent immediately

    if (mode === "HOMEWORK") {
      try {
        const res = await apiClient.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerData: selectedIds
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
        answer: selectedIds,
        userId,
      });
    }
  };

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timer === 0 && !isSubmitted && mode !== "HOMEWORK") {
      handleSubmit();
    }
  }, [timer, isSubmitted, mode, selectedIds]);

  const wrapperClass = `w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-foreground flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] max-w-full wrap-break-word text-2xl font-black mb-6 text-foreground drop-shadow-sm">
            {question.text}
          </h2>
          <div className="space-y-3 mb-6">
            {question.options.map((opt, idx) => {
              const isSelected = selectedIds.includes(idx);
              const isActuallyCorrect = Array.isArray(correctAnswer) && correctAnswer.includes(idx);
              
              let styleClass = "";
              if (correctAnswer !== null) {
                if (isActuallyCorrect) {
                  styleClass = "bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                } else if (isSelected) {
                  styleClass = "bg-red-500/10 border-red-500/30 opacity-60";
                } else {
                  styleClass = "bg-white/5 border-white/5 opacity-30 grayscale";
                }
              } else {
                 styleClass = isSelected 
                  ? "bg-primary/20 border-primary/40 shadow-md scale-[1.02]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";
              }

              return (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${styleClass} ${isSubmitted || timer <= 0 ? "pointer-events-none" : ""}`}
              >
                <div className="relative">
                <Checkbox
                  id={`option-${idx}`}
                  checked={isSelected}
                  onCheckedChange={() => handleSelect(idx)}
                  disabled={isSubmitted || timer <= 0 || correctAnswer !== null}
                  className={`border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary ${isActuallyCorrect && correctAnswer !== null ? "border-green-500 bg-green-500" : ""}`}
                />
                {isActuallyCorrect && correctAnswer !== null && (
                   <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md border border-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                      </svg>
                   </div>
                )}
                </div>
                <span className={`text-foreground font-bold ${isActuallyCorrect && correctAnswer !== null ? "text-green-400" : ""}`}>{opt.text}</span>
              </label>
            );
            })}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.length === 0 || isSubmitted || timer <= 0 || correctAnswer !== null}
          className="w-full text-lg font-black bg-primary text-primary-foreground rounded-2xl py-6 shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all"
        >
          XÁC NHẬN
        </Button>
      </div>
    </div>
  );
};

export default CheckboxQuestionPlay;