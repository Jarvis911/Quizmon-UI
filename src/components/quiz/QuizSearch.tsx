import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Loader2, X, Play, Edit, User, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/types";
import Fuse from "fuse.js";
import { useDebounce, useClickAway } from "react-use";
import { useNavigate } from "react-router-dom";

interface QuizSearchProps {
    quizzes: Quiz[];
    onPlay: (quizId: string | number) => void;
    onEdit: (quizId: string | number) => void;
    variant?: "default" | "navbar";
    onExpandChange?: (isExpanded: boolean) => void;
}

const QuizSearch = ({ quizzes, onPlay, onEdit, variant = "default", onExpandChange }: QuizSearchProps) => {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState<Quiz[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(variant === "default");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const isNavbar = variant === "navbar";

    useDebounce(
        () => {
            setDebouncedQuery(query);
        },
        300,
        [query]
    );

    const fuse = useMemo(() => {
        return new Fuse(quizzes, {
            keys: ["title", "description", "category.name"],
            threshold: 0.4,
            includeMatches: true,
        });
    }, [quizzes]);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            return;
        }

        const searchResults = fuse.search(debouncedQuery);
        setResults(searchResults.map((r) => r.item));
    }, [debouncedQuery, fuse]);

    useClickAway(containerRef, () => {
        setIsOpen(false);
        if (isNavbar && !query) {
            setIsExpanded(false);
            onExpandChange?.(false);
        }
    });

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQuery("");
        setResults([]);
        setIsOpen(false);
        if (isNavbar) {
            setIsExpanded(false);
            onExpandChange?.(false);
        }
    };

    const handleToggleExpand = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            onExpandChange?.(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    return (
        <div ref={containerRef} className={`relative flex items-center transition-all duration-300 ease-in-out ${isNavbar
                ? isExpanded ? "w-full md:w-[400px]" : "w-10"
                : "w-full max-w-2xl"
            } group`}>
            {/* Search Input Container */}
            <div
                className={`relative w-full flex items-center overflow-hidden transition-all duration-300 ${isNavbar ? "rounded-full" : "rounded-2xl"
                    } ${isNavbar && !isExpanded ? "cursor-pointer" : ""}`}
                onClick={handleToggleExpand}
            >
                <div className={`absolute left-0 w-10 h-10 flex items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors ${isNavbar && !isExpanded ? "hover:bg-white/10 rounded-full" : "pl-1"
                    }`}>
                    <Search className="w-5 h-5" />
                </div>
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={isNavbar ? "Tìm kiếm..." : "Tìm kiếm Quiz (Ví dụ: Toán học, Lịch sử...)"}
                    className={`transition-all duration-300 bg-card/90 backdrop-blur-xl border-2 border-white/10 shadow-xl focus-visible:ring-0 focus:border-primary font-bold placeholder:text-muted-foreground placeholder:font-normal ${isNavbar
                            ? `h-10 pl-10 rounded-full ${isExpanded ? "w-full opacity-100 pr-10" : "w-0 opacity-0 border-transparent shadow-none"}`
                            : "w-full pl-12 pr-12 h-14 text-lg rounded-2xl"
                        }`}
                />
                {query && isExpanded && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && isExpanded && (query.trim() || results.length > 0) && (
                <div className={`absolute top-full mt-3 left-0 right-0 max-h-[450px] overflow-y-auto bg-card border-2 border-white/10 rounded-3xl shadow-2xl z-100 animate-in fade-in slide-in-from-top-2 duration-300 ${isNavbar ? "md:w-[400px] w-[calc(100vw-2rem)]" : "w-full"
                    }`}>
                    <div className="p-2 space-y-1">
                        {results.length > 0 ? (
                            <>
                                <div className="px-4 py-2">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60">Kết quả tìm kiếm ({results.length})</p>
                                </div>
                                {results.map((quiz) => (
                                    <div
                                        key={quiz.id}
                                        className="flex items-center gap-3 p-2 hover:bg-primary/10 rounded-2xl cursor-pointer transition-all duration-200 group/item border border-transparent hover:border-primary/20"
                                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                                    >
                                        {/* Quiz Thumbnail */}
                                        <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 border border-white/5 shadow-inner">
                                            {quiz.image ? (
                                                <img src={quiz.image} alt={quiz.title} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary">
                                                    <Bookmark className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Quiz Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-foreground truncate group-hover/item:text-primary transition-colors">
                                                {quiz.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                                    <User className="w-2.5 h-2.5" />
                                                    <span className="truncate">{quiz.creator?.username || "Ẩn danh"}</span>
                                                </div>
                                                {quiz.category && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-tighter">
                                                        {quiz.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity pr-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-full h-7 w-7 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(quiz.id);
                                                }}
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="rounded-full px-3 h-7 font-black text-[10px] gap-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPlay(quiz.id);
                                                }}
                                            >
                                                <Play className="w-2.5 h-2.5 fill-current" /> Chơi
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : query.trim() ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-dashed border-white/10">
                                    <Search className="w-6 h-6 text-muted-foreground/40" />
                                </div>
                                <h4 className="font-black text-sm text-foreground mb-0.5">Không tìm thấy kết quả</h4>
                                <p className="text-[11px] text-muted-foreground font-medium">Thử với từ khóa khác xem sao!</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};


export default QuizSearch;
