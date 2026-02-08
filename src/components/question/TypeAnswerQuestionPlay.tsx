import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket.jsx"

const TypeAnswerQuestionPlay = ({ question, socket, matchId, userId, timer }) => {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    // Reset states when a new question is received
    setAnswer("");
    setSubmitted(null);
  }, [question.id]);

  const handleSubmit = () => {
    if (!answer.trim() || timer <= 0) return;
    socket.emit("submitAnswer", {
      matchId,
      userId,
      questionId: question.id,
      answer: answer.trim(),
    });
    setAnswer(""); // Lock after submit
    setSubmitted(true);
  };

  
  // For shake animation
  const wrapperClass = `flex flex-row gap-8 p-6 relative transition ${isWrong ? "bg-red-500/30 shake rounded-2xl" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]}/>
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg text-black flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-2xl font-bold mb-4">
            {question.text}
          </h2>
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập câu trả lời..."
            disabled={submitted || isCorrect !== null || timer <= 0}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!answer.trim() || submitted || isCorrect !== null || timer <= 0}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default TypeAnswerQuestionPlay;