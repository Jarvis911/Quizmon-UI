import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import useQuestionSocket from "@/hooks/useQuestionSocket.jsx"
import QuestionMedia from "./QuestionMedia";

const ButtonQuestionPlay = ({ question, socket, matchId, userId, timer }) => {
  const [selected, setSelected] = useState(null);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    // Reset states when a new question is received
    setSelected(null);
  }, [question.id]); 

  const handleSelect = (index) => {
    if (selected !== null || timer <= 0) return;
    setSelected(index);
    socket.emit("submitAnswer", {
      matchId,
      userId,
      questionId: question.id,
      answer: index,
    });
  };

  const wrapperClass = `flex flex-row gap-8 p-6 relative transition ${isWrong ? "bg-red-500/30 shake rounded-2xl" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]}/>
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg text-black flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-xl font-bold mb-4">
            {question.text}
          </h2>
 
            <div className="space-y-4">
              {question.options.map((opt, idx) => (
                <Button
                  key={idx}
                  variant={
                    selected === idx
                      ? isCorrect === true
                        ? "success"
                        : isCorrect === false
                        ? "destructive"
                        : "default"
                      : "outline"
                  }
                  className="w-full text-black"
                  onClick={() => handleSelect(idx)}
                  disabled={selected !== null || timer <= 0}
                >
                  {opt.text}
                </Button>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ButtonQuestionPlay;
