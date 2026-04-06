import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import apiClient from "@/api/client";
import endpoints from "../../api/api";

const TypeAnswerQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult, correctAnswer }) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(
    socket,
    userId,
    question.id,
    () => onResult?.(true),
    () => onResult?.(false)
  );

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
  }, [question.id]);

  const handleSubmit = async () => {
    if (!answer.trim() || submitted || correctAnswer !== null) return;
    const finalAnswer = answer.trim();
    setSubmitted(true);

    if (mode === "HOMEWORK") {
      try {
        const res = await apiClient.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerData: finalAnswer
        });
        if (onResult) onResult(res.data.isCorrect);
        if (onHomeworkSubmit) onHomeworkSubmit();
      } catch (err) {
        console.error("Failed to submit homework answer", err);
      }
    } else {
      socket.emit("submitAnswer", {
        matchId,
        userId,
        questionId: question.id,
        answer: finalAnswer,
      });
      setAnswer("");
    }
  };

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timer === 0 && !submitted && mode !== "HOMEWORK") {
      handleSubmit();
    }
  }, [timer, submitted, mode, answer]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
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
          <div className="relative">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu trả lời..."
              disabled={submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0 || correctAnswer !== null}
              className={`bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 text-xl py-8 rounded-2xl focus:ring-primary focus:border-primary transition-all border-2 ${correctAnswer !== null ? "border-green-500/50 bg-green-500/5 text-green-400" : ""}`}
            />
            {correctAnswer !== null && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-in zoom-in-95 duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60 mb-1">Đáp án đúng</p>
                <p className="text-2xl font-black text-green-400">{correctAnswer}</p>
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0 || correctAnswer !== null}
          className="mt-6 w-full text-lg font-black bg-primary text-primary-foreground rounded-2xl py-6 shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all"
        >
          XÁC NHẬN
        </Button>
      </div>
    </div>
  );
};

export default TypeAnswerQuestionPlay;