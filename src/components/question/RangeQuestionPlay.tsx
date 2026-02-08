import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket.jsx"


const RangeQuestionPlay = ({ question, socket, matchId, userId, timer }) => {
  const [value, setValue] = useState([question.range.minValue]);
  const [submitted, setSubmitted] = useState(null);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    setValue([question.range.minValue]);
    setSubmitted(null);
  }, [question.id]);

  const handleSubmit = () => {
    if (timer <= 0) return;
    const answer = value[0]; 
    socket.emit("submitAnswer", {
      matchId,
      userId,
      questionId: question.id,
      answer,
    });
    setSubmitted(true);
  };

  // For shake animation
  const wrapperClass = `flex flex-row gap-8 p-6 relative transition ${isWrong ? "bg-red-500/30 shake rounded-2xl" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]}/>
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg text-black flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-xl font-bold mb-4">
            {question.text}
          </h2>
          <Slider
            min={question.range.minValue}
            max={question.range.maxValue}
            step={1}
            value={value}
            onValueChange={setValue}
            disabled={isCorrect !== null || timer <= 0 || submitted}
          />
          <p className="text-center mt-2">Giá trị: {value[0]}</p>
        </div>
        <Button onClick={handleSubmit} disabled={submitted || isCorrect !== null || timer <= 0}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default RangeQuestionPlay;