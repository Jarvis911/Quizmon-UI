import { useEffect, useRef } from "react";
import { ListTree, CheckCircle2, CircleDot, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface HierarchyQuestion {
    id: number;
    text: string;
    type: string;
    options: unknown[];
    data: unknown;
}

const TYPE_LABELS: Record<string, string> = {
    BUTTONS: "Nút",
    CHECKBOXES: "Hộp chọn",
    REORDER: "Sắp xếp",
    TYPEANSWER: "Gõ đáp án",
    LOCATION: "Vị trí",
};

function truncate(s: string, max: number) {
    const t = s.replace(/\s+/g, " ").trim();
    if (!t.length) return "—";
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1)}…`;
}

function typeLabel(type: string) {
    return TYPE_LABELS[type] || type;
}

function getChildLines(q: HierarchyQuestion): { key: string; text: string; correct?: boolean; orderHint?: string }[] {
    const opts = Array.isArray(q.options) ? q.options : [];

    if (q.type === "REORDER") {
        const rows = opts
            .filter((o): o is { text?: string; order?: number | null } => !!o && typeof o === "object")
            .map((o, idx) => ({
                order: o.order ?? idx + 1,
                text: o.text || "",
                idx,
            }))
            .sort((a, b) => a.order - b.order);
        return rows.map((r, i) => ({
            key: `r-${q.id}-${i}`,
            orderHint: `${i + 1}.`,
            text: r.text || "—",
        }));
    }

    if (q.type === "BUTTONS" || q.type === "CHECKBOXES") {
        return opts
            .filter((o): o is { id?: number; text?: string; isCorrect?: boolean } => !!o && typeof o === "object")
            .map((o, i) => ({
                key: `o-${q.id}-${o.id ?? i}`,
                text: o.text || "—",
                correct: !!o.isCorrect,
            }));
    }

    if (q.type === "TYPEANSWER") {
        const d = q.data as { correctAnswer?: string } | null;
        const ans = d?.correctAnswer?.trim();
        if (ans) return [{ key: `ta-${q.id}`, text: `Đáp án: ${truncate(ans, 48)}` }];
        return [{ key: `ta-${q.id}`, text: "Chưa có đáp án" }];
    }

    if (q.type === "LOCATION") {
        const d = q.data as { correctLatitude?: number; correctLongitude?: number } | null;
        if (d && typeof d.correctLatitude === "number" && typeof d.correctLongitude === "number") {
            return [
                {
                    key: `loc-${q.id}`,
                    text: `${d.correctLatitude.toFixed(4)}, ${d.correctLongitude.toFixed(4)}`,
                },
            ];
        }
        return [{ key: `loc-${q.id}`, text: "Chưa chọn vị trí" }];
    }

    return [];
}

export interface QuizHierarchyPanelProps {
    questions: HierarchyQuestion[];
    activeIndex: number | null;
    onSelectQuestion: (index: number) => void;
    className?: string;
    /** When set, shows a control to dismiss the panel (e.g. desktop sidebar). */
    onClose?: () => void;
}

const QuizHierarchyPanel = ({ questions, activeIndex, onSelectQuestion, className, onClose }: QuizHierarchyPanelProps) => {
    const activeRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (activeIndex === null) return;
        activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [activeIndex]);

    return (
        <div
            className={cn(
                "rounded-xl border border-white/10 bg-card/60 backdrop-blur-md shadow-lg overflow-hidden flex flex-col",
                className
            )}
            data-testid="quiz-hierarchy-panel"
        >
            <div className="px-3 py-2.5 border-b border-white/10 flex items-center gap-2 bg-black/20 min-w-0">
                <ListTree className="w-4 h-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-bold tracking-tight truncate min-w-0 flex-1">Cấu trúc quiz</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{questions.length} câu</span>
                {onClose && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={onClose}
                        aria-label="Ẩn cấu trúc quiz"
                        title="Ẩn cấu trúc quiz"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="p-2 max-h-[min(70vh,calc(100vh-10rem))] overflow-y-auto overscroll-contain">
                {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-6 text-center">Chưa có câu hỏi</p>
                ) : (
                    <ul className="space-y-1" role="list">
                        {questions.map((q, i) => {
                            const active = i === activeIndex;
                            const children = getChildLines(q);
                            return (
                                <li key={q.id} className="rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-colors">
                                    <button
                                        type="button"
                                        ref={active ? activeRef : undefined}
                                        className={cn(
                                            "w-full text-left px-2 py-2 rounded-lg transition-colors",
                                            active && "bg-primary/15 ring-1 ring-primary/30"
                                        )}
                                        onClick={() => onSelectQuestion(i)}
                                        aria-current={active ? "true" : undefined}
                                        aria-label={`Chọn câu ${i + 1}: ${truncate(q.text, 80)}`}
                                    >
                                        <div className="flex items-start gap-2 min-w-0">
                                            <span className="shrink-0 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary tabular-nums leading-none mt-0.5">
                                                Câu {i + 1}
                                            </span>
                                            <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground leading-none mt-0.5">
                                                {typeLabel(q.type)}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-xs font-medium text-foreground/90 leading-snug pl-0.5 break-words">
                                            {truncate(q.text, 220)}
                                        </p>

                                        {children.length > 0 && (
                                            <ul className="mt-2 ml-1 pl-2 border-l border-white/15 space-y-1" role="list">
                                                {children.map((c) => (
                                                    <li
                                                        key={c.key}
                                                        className="text-[11px] text-muted-foreground leading-snug flex items-start gap-1.5 min-w-0"
                                                    >
                                                        {c.orderHint ? (
                                                            <span className="shrink-0 font-mono text-[10px] text-primary/80 w-4">
                                                                {c.orderHint}
                                                            </span>
                                                        ) : c.correct !== undefined ? (
                                                            <span className="shrink-0 mt-0.5" title={c.correct ? "Đáp án đúng" : ""}>
                                                                {c.correct ? (
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500/90" aria-label="Đúng" />
                                                                ) : (
                                                                    <CircleDot className="w-3 h-3 text-muted-foreground/50" aria-hidden />
                                                                )}
                                                            </span>
                                                        ) : null}
                                                        <span className="min-w-0 break-words">{truncate(c.text, 160)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default QuizHierarchyPanel;
