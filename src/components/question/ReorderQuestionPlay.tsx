import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem"; 
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket.jsx"


const ReorderQuestionPlay = ({ question, socket, matchId, userId, timer }) => {
  const [submitted, setSubmitted] = useState(null);
  const { isCorrect, isWrong } = useQuestionSocket(socket, userId, question.id);
  const colors = ["bg-red-500/60", "bg-blue-500/60", "bg-green-500/60", "bg-yellow-500/60"];

  const [items, setItems] = useState(
    question.options.map((opt, idx) => ({
      id: idx,
      text: opt.text,
      color: colors[idx % colors.length], 
    }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Reset states when a new question is received
    setItems(question.options.map((opt, idx) => ({ id: idx, text: opt.text, color: colors[idx % colors.length] })));
    setSubmitted(null);

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

  const handleSubmit = () => {
    if (timer <= 0) return;
    const answer = items.map(item => item.id); // Array of orders
    socket.emit("submitAnswer", {
      matchId,
      userId,
      questionId: question.id,
      answer,
    });
    setSubmitted(true);
  };

  const wrapperClass = `flex flex-row gap-8 p-6 relative transition ${isWrong ? "bg-red-500/30 shake rounded-2xl" : ""}`;
  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]}/>
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg text-black flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] text-2xl font-bold mb-4">
            {question.text}
          </h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id} color={item.color}>
                  {item.text}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <Button onClick={handleSubmit} disabled={submitted || isCorrect !== null || timer <= 0}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default ReorderQuestionPlay;