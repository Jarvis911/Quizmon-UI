import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import axios from "axios";
import endpoints from "../../api/api";

const RangeQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit }) => {
  const [value, setValue] = useState([question.range.minValue]);
  const [submitted, setSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    setValue([question.range.minValue]);
    setSubmitted(false);
  }, [question.id]);

  const handleSubmit = async () => {
    if (submitted) return;
    const answer = value[0];
    setSubmitted(true);

    if (mode === "HOMEWORK") {
      try {
        const token = localStorage.getItem("token");
        await axios.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerIds: [],
          numberAnswer: answer
        }, {
          headers: { Authorization: token }
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
        answer,
      });
    }
  };

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timer === 0 && !submitted && mode !== "HOMEWORK") {
      handleSubmit();
    }
  }, [timer, submitted, mode, value]);
  const wrapperClass = `flex flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-white flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-xl font-bold mb-6">
            {question.text}
          </h2>
          <div className="my-8 px-2">
            <Slider
              min={question.range.minValue}
              max={question.range.maxValue}
              step={1}
              value={value}
              onValueChange={setValue}
              disabled={isCorrect !== null || timer <= 0 || submitted}
            />
            <div className="flex justify-between text-xs text-white/40 mt-2">
              <span>{question.range.minValue}</span>
              <span>{question.range.maxValue}</span>
            </div>
          </div>
          <div className="text-center">
            <span className="text-4xl font-black text-purple-300">{value[0]}</span>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
          className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-3"
        >
          ✅ Xác nhận
        </Button>
      </div>
    </div>
  );
};

export default RangeQuestionPlay;