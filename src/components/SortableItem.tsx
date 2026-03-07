import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

interface SortableItemProps {
    id: string | number;
    children: ReactNode;
    color: string;
}

export function SortableItem({ id, children, color }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${color} font-semibold p-4 rounded-xl shadow-md mb-2 cursor-grab active:cursor-grabbing`}
        >
            {children}
        </div>
    );
}
