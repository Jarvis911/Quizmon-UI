import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import axios from "axios";
import endpoints from "../../api/api";

const TypeAnswerQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit }) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    setAnswer("");
    setSubmitted(false);
  }, [question.id]);

  const handleSubmit = async () => {
    if (!answer.trim() || submitted) return;
    const finalAnswer = answer.trim();
    setSubmitted(true);

    if (mode === "HOMEWORK") {
      try {
        const token = localStorage.getItem("token");
        await axios.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerIds: [],
          textAnswer: finalAnswer
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
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

  const wrapperClass = `flex flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-white flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-xl font-bold mb-6">
            {question.text}
          </h2>
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu trả lời..."
            disabled={submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg py-6 rounded-xl focus:ring-purple-400 focus:border-purple-400"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
          className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-3"
        >
          ✅ Xác nhận
        </Button>
      </div>
    </div>
  );
};

export default TypeAnswerQuestionPlay;