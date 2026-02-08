import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket.jsx"

const CheckboxQuestionPlay = ({ question, socket, matchId, userId, timer }) => {
  const [selected, setSelected] = useState([]); // Array of selected indices
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    setSelected([]);
  }, [question.id]);

  const handleSelect = (idx) => {
    if (selected.includes(idx)) {
      setSelected(selected.filter(i => i !== idx));
    } else {
      setSelected([...selected, idx]);
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0 || timer <= 0) return;
    const answer = question.options.map((_, idx) => selected.includes(idx)); // Boolean array
    socket.emit("submitAnswer", {
      matchId,
      userId,
      questionId: question.id,
      answer,
    });
    setSelected([]); // Lock after submit
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
          <div className="space-y-4 flex flex-col gap-4 mb-4">
            {question.options.map((opt, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`option-${idx}`}
                  checked={selected.includes(idx)}
                  onCheckedChange={() => handleSelect(idx)}
                  disabled={isCorrect !== null || timer <= 0}
                />
                <Label htmlFor={`option-${idx}`}>{opt.text}</Label>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={selected.length === 0 || isCorrect !== null || timer <= 0}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default CheckboxQuestionPlay;