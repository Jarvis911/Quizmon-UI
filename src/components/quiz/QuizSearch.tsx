import { useState, useMemo, useEffect, useRef } from "react";
import { X, Play, Edit, User, Bookmark, ListFilter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Quiz, Category } from "@/types";
import Fuse from "fuse.js";
import { useDebounce, useClickAway } from "react-use";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getIconForCategory, defaultIcons } from "@/lib/categoryIcons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuizSearchProps {
    quizzes: Quiz[];
    categories?: Category[];
    isLoggedIn?: boolean;
    onPlay: (quizId: string | number) => void;
    onEdit: (quizId: string | number) => void;
    variant?: "default" | "navbar";
    onExpandChange?: (isExpanded: boolean) => void;
}

const QuizSearch = ({ quizzes, categories = [], isLoggedIn = false, onPlay, onEdit, variant = "default", onExpandChange }: QuizSearchProps) => {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState<Quiz[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(variant === "default");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeCategoryId = searchParams.get("categoryId");
    const isMineActive = searchParams.get("mine") === "1";
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const isNavbar = variant === "navbar";
    const activeCategory = categories.find((c) => String(c.id) === activeCategoryId);
    const showCategoryFilter = isNavbar && (categories.length > 0 || isLoggedIn);
    const filterLabel = isMineActive
        ? "Quiz của tôi"
        : activeCategory?.name;
    const hasActiveFilter = Boolean(filterLabel);

    const handleFilterSelect = (filter: "all" | "mine" | { categoryId: number }) => {
        setIsOpen(false);
        setIsFilterMenuOpen(false);
        setIsExpanded(true);
        onExpandChange?.(true);

        if (filter === "all") {
            navigate("/results");
        } else if (filter === "mine") {
            navigate("/results?mine=1");
        } else {
            navigate(`/results?categoryId=${filter.categoryId}`);
        }
    };

    // Keep search expanded while a category/mine filter is active
    useEffect(() => {
        if (isNavbar && hasActiveFilter) {
            setIsExpanded(true);
            onExpandChange?.(true);
        }
    }, [isNavbar, hasActiveFilter, activeCategoryId, isMineActive, onExpandChange]);

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
        if (isFilterMenuOpen) return;
        setIsOpen(false);
        if (isNavbar && !query && !hasActiveFilter) {
            setIsExpanded(false);
            onExpandChange?.(false);
        }
    });

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQuery("");
        setResults([]);
        setIsOpen(false);
        if (isNavbar && !hasActiveFilter) {
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

    const isSearchCollapsed = isNavbar && !isExpanded && !hasActiveFilter;

    return (
        <div ref={containerRef} className={`relative flex items-center transition-all duration-300 ease-in-out ${isNavbar
                ? isExpanded || hasActiveFilter ? "w-full md:w-[400px]" : "w-10"
                : "w-full max-w-2xl"
            } group`}>
            {/* Search Input Container */}
            <div
                className={`relative w-full flex items-center overflow-hidden transition-all duration-300 ${isNavbar ? "rounded-full" : "rounded-2xl"
                    } ${isNavbar && !isExpanded && !hasActiveFilter ? "cursor-pointer" : ""}`}
                onClick={handleToggleExpand}
            >
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleExpand();
                    }}
                    className={`absolute left-0 z-10 w-10 h-10 flex items-center justify-center text-muted-foreground transition-colors ${isSearchCollapsed ? "hover:bg-white/10 rounded-full cursor-pointer" : "pl-1 pointer-events-none"
                    }`}
                    aria-label="Mở tìm kiếm"
                    tabIndex={isSearchCollapsed ? 0 : -1}
                >
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png"
                        alt=""
                        className="w-5 h-5 object-contain"
                    />
                </button>
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && query.trim()) {
                            setIsOpen(false);
                            navigate(`/results?q=${encodeURIComponent(query.trim())}`);
                        }
                    }}
                    placeholder={
                        isNavbar
                            ? filterLabel && !query
                                ? `Đang lọc: ${filterLabel}`
                                : "Tìm kiếm..."
                            : "Tìm kiếm Quiz (Ví dụ: Toán học, Lịch sử...)"
                    }
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={isSearchCollapsed ? -1 : 0}
                    className={`transition-all duration-300 bg-card border-2 shadow-xl focus-visible:ring-0 focus:border-primary font-bold placeholder:text-muted-foreground placeholder:font-normal ${isNavbar
                            ? `h-10 pl-10 rounded-full border-white/10 ${(isExpanded || hasActiveFilter) ? `w-full opacity-100 pointer-events-auto ${showCategoryFilter ? (query ? "pr-20" : "pr-[4.5rem]") : "pr-10"} ${hasActiveFilter && !query ? "border-primary/40 bg-primary/5" : ""}` : "w-0 opacity-0 border-transparent shadow-none pointer-events-none"}`
                            : "w-full pl-12 pr-12 h-14 text-lg rounded-2xl border-white/10"
                        }`}
                />
                {isNavbar && (isExpanded || hasActiveFilter) && showCategoryFilter && (
                    <DropdownMenu onOpenChange={setIsFilterMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-0.5 p-1.5 rounded-full transition-colors max-w-[5.5rem] ${
                                    filterLabel
                                        ? "bg-primary/15 text-primary hover:bg-primary/25"
                                        : "hover:bg-muted text-muted-foreground"
                                }`}
                                aria-label="Lọc theo danh mục"
                            >
                                <ListFilter className="w-3.5 h-3.5 shrink-0" />
                                {filterLabel ? (
                                    <span className="text-[10px] font-bold truncate hidden sm:inline">
                                        {filterLabel}
                                    </span>
                                ) : null}
                                <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 max-h-72 overflow-y-auto rounded-xl border-white/20 bg-background/95 backdrop-blur-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenuLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                Danh mục
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleFilterSelect("all")}
                                className={`cursor-pointer font-semibold ${!activeCategoryId && !isMineActive ? "bg-primary/10 text-primary" : ""}`}
                            >
                                Tất cả danh mục
                            </DropdownMenuItem>
                            {isLoggedIn && (
                                <DropdownMenuItem
                                    onClick={() => handleFilterSelect("mine")}
                                    className={`cursor-pointer font-semibold gap-2 ${isMineActive ? "bg-primary/10 text-primary" : ""}`}
                                >
                                    <span className="shrink-0 text-muted-foreground">
                                        {defaultIcons["My Quizzes"]}
                                    </span>
                                    <span className="truncate">Quiz của tôi</span>
                                </DropdownMenuItem>
                            )}
                            {categories.length > 0 && <DropdownMenuSeparator />}
                            {categories.map((cat) => (
                                <DropdownMenuItem
                                    key={cat.id}
                                    onClick={() => handleFilterSelect({ categoryId: cat.id })}
                                    className={`cursor-pointer font-semibold gap-2 ${
                                        String(cat.id) === activeCategoryId ? "bg-primary/10 text-primary" : ""
                                    }`}
                                >
                                    <span className="shrink-0 text-muted-foreground">
                                        {getIconForCategory(cat.name)}
                                    </span>
                                    <span className="truncate">{cat.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                {query && (isExpanded || hasActiveFilter) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                        aria-label="Xóa từ khóa tìm kiếm"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
                {isNavbar && hasActiveFilter && !query && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect("all");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                        aria-label="Xóa bộ lọc danh mục"
                        title="Xóa bộ lọc"
                    >
                        <X className="w-4 h-4 text-primary" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (isExpanded || hasActiveFilter) && (query.trim() || results.length > 0) && (
                <div className={`
                    ${isNavbar 
                        ? "fixed top-20 left-2 right-2 md:absolute md:top-full md:left-0 md:right-auto md:mt-3 md:w-[400px]" 
                        : "absolute top-full mt-3 left-0 right-0 w-full"
                    } 
                    max-h-[65vh] md:max-h-[450px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300
                `}>
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
                                        <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-opacity pr-1">
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
                                    <img 
                                        src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png" 
                                        alt="Search" 
                                        className="w-6 h-6 object-contain opacity-40 grayscale" 
                                    />
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
