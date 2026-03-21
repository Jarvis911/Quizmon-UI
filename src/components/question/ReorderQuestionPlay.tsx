import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import apiClient from "@/api/client";
import endpoints from "../../api/api";

const ITEM_COLORS = [
  "bg-gradient-to-r from-red-500/60 to-red-600/60",
  "bg-gradient-to-r from-blue-500/60 to-blue-600/60",
  "bg-gradient-to-r from-emerald-500/60 to-emerald-600/60",
  "bg-gradient-to-r from-amber-500/60 to-amber-600/60",
  "bg-gradient-to-r from-purple-500/60 to-purple-600/60",
  "bg-gradient-to-r from-pink-500/60 to-pink-600/60",
];

const ReorderQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult }) => {
  const [submitted, setSubmitted] = useState(false);
  const { isCorrect, isWrong } = useQuestionSocket(
    socket,
    userId,
    question.id,
    () => onResult?.(true),
    () => onResult?.(false)
  );

  const [items, setItems] = useState(
    question.options.map((opt, idx) => ({
      id: opt.id,
      text: opt.text,
      color: ITEM_COLORS[idx % ITEM_COLORS.length],
    }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(question.options.map((opt, idx) => ({ id: opt.id, text: opt.text, color: ITEM_COLORS[idx % ITEM_COLORS.length] })));
    setSubmitted(false);
  }, [question.id]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    const answerIds = items.map(item => item.id);
    setSubmitted(true);

    if (mode === "HOMEWORK") {
      try {
        const res = await apiClient.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerData: answerIds
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
        answer: answerIds,
      });
    }
  };

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timer === 0 && !submitted && mode !== "HOMEWORK") {
      handleSubmit();
    }
  }, [timer, submitted, mode, items]);
  const wrapperClass = `w-full max-w-5xl mx-auto flex flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-foreground flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] max-w-full break-words text-2xl font-black mb-6 text-foreground drop-shadow-sm">
            {question.text}
          </h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableItem key={item.id} id={item.id} color={item.color}>
                    <span className="text-white font-bold drop-shadow-sm">{item.text}</span>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitted || (mode !== "HOMEWORK" && isCorrect !== null) || timer <= 0}
          className="mt-6 w-full text-lg font-black bg-primary text-primary-foreground rounded-2xl py-6 shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all"
        >
          ✅ XÁC NHẬN
        </Button>
      </div>
    </div>
  );
};

export default ReorderQuestionPlay;