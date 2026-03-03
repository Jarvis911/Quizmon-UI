import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import axios from "axios";
import endpoints from "../../api/api";

const CheckboxQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);

  useEffect(() => {
    setSelectedIds([]);
    setIsSubmitted(false);
  }, [question.id]);

  const handleSelect = (idx) => {
    if (isSubmitted || timer <= 0) return;
    if (selectedIds.includes(idx)) {
      setSelectedIds(selectedIds.filter(i => i !== idx));
    } else {
      setSelectedIds([...selectedIds, idx]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0 || isSubmitted) return;

    setIsSubmitted(true);

    if (mode === "HOMEWORK") {
      try {
        const token = localStorage.getItem("token");
        await axios.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerIds: selectedIds
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
        questionId: question.id,
        answerIds: selectedIds,
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

  const wrapperClass = `flex flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-white flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-xl font-bold mb-6">
            {question.text}
          </h2>
          <div className="space-y-3 mb-6">
            {question.options.map((opt, idx) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${selectedIds.includes(idx)
                  ? "bg-purple-500/20 border-purple-400/40"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  } ${isSubmitted || timer <= 0 ? "opacity-50 pointer-events-none" : ""}`}
              >
                <Checkbox
                  id={`option-${idx}`}
                  checked={selectedIds.includes(idx)}
                  onCheckedChange={() => handleSelect(idx)}
                  disabled={isSubmitted || timer <= 0}
                  className="border-white/30 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <span className="text-white/90">{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.length === 0 || isSubmitted || timer <= 0}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-3"
        >
          ✅ Xác nhận
        </Button>
      </div>
    </div>
  );
};

export default CheckboxQuestionPlay;