import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import axios from "axios";
import endpoints from "../../api/api";

const RangeQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit }) => {
  const [value, setValue] = useState([question.data.minValue]);
  const [submitted, setSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    setValue([question.data.minValue]);
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
  const wrapperClass = `w-full max-w-5xl mx-auto flex flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-foreground flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] max-w-full break-words text-2xl font-black mb-6 text-foreground drop-shadow-sm">
            {question.text}
          </h2>
          <div className="my-10 px-4">
            <Slider
              min={question.data.minValue}
              max={question.data.maxValue}
              step={1}
              value={value}
              onValueChange={setValue}
              disabled={isCorrect !== null || timer <= 0 || submitted}
              className="py-4"
            />
            <div className="flex justify-between text-sm font-black text-muted-foreground mt-4 uppercase tracking-widest">
              <span>{question.data.minValue}</span>
              <span>{question.data.maxValue}</span>
            </div>
          </div>
          <div className="text-center bg-primary/10 rounded-3xl py-6 border-2 border-primary/20 shadow-inner">
            <span className="text-6xl font-black text-primary drop-shadow-md">{value[0]}</span>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
          className="mt-8 w-full text-lg font-black bg-primary text-primary-foreground rounded-2xl py-6 shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all"
        >
          ✅ XÁC NHẬN
        </Button>
      </div>
    </div>
  );
};

export default RangeQuestionPlay;