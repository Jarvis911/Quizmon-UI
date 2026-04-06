import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, ListFilter, Trash2 } from "lucide-react";
import { Quiz, Category } from "@/types";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import SearchResultItem from "@/components/quiz/SearchResultItem";
import CategoryNav from "@/components/ui/CategoryNav";
import KnowledgeGlobeSVG from "@/components/ui/KnowledgeGlobeSVG";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/context/ModalContext";
import Fuse from "fuse.js";

type SortOption = 
    | "best-match" 
    | "name-az" 
    | "name-za" 
    | "time-newest" 
    | "time-oldest" 
    | "rating-highest" 
    | "rating-lowest" 
    | "questions-highest" 
    | "questions-lowest";

const Results = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId");
    const navigate = useNavigate();
    const { showAlert } = useModal();

    const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortOption>("best-match");

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [catRes, quizRes] = await Promise.all([
                    apiClient.get(endpoints.category),
                    apiClient.get(endpoints.explore)
                ]);
                setCategories(catRes.data);
                setAllQuizzes(quizRes.data);
            } catch (err) {
                console.error("Results: Failed to fetch data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtered and Sorted Results
    const filteredResults = useMemo(() => {
        let results = [...allQuizzes];

        // 1. Filter by category
        if (categoryId) {
            results = results.filter(q => q.categoryId === parseInt(categoryId));
        }

        // 2. Filter by search query (using Fuse for fuzzy search on the already category-filtered results)
        if (query.trim()) {
            const searcher = new Fuse(results, {
                keys: ["title", "description", "category.name"],
                threshold: 0.4,
            });
            results = searcher.search(query).map(r => r.item);
        }

        // 3. Apply sorting
        results.sort((a, b) => {
            switch (sortBy) {
                case "name-az":
                    return a.title.localeCompare(b.title);
                case "name-za":
                    return b.title.localeCompare(a.title);
                case "time-newest":
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                case "time-oldest":
                    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                case "questions-highest":
                    return (b.questions?.length || 0) - (a.questions?.length || 0);
                case "questions-lowest":
                    return (a.questions?.length || 0) - (b.questions?.length || 0);
                case "rating-highest":
                    return 0; // Mock ratings
                case "best-match":
                default:
                    return 0; 
            }
        });

        return results;
    }, [allQuizzes, query, categoryId, sortBy]);

    const handlePlayNow = async (quizId: string | number) => {
        try {
            const res = await apiClient.post(endpoints.matches, { quizId });
            navigate(`/match/${res.data.id}/lobby`);
        } catch (err: any) {
            showAlert({
                title: "Lỗi",
                message: err.response?.data?.message || "Không thể tạo trận đấu",
                type: "error"
            });
        }
    };

    const sortLabels: Record<SortOption, string> = {
        "best-match": "Phù hợp nhất",
        "name-az": "Tên: A-Z",
        "name-za": "Tên: Z-A",
        "time-newest": "Mới nhất",
        "time-oldest": "Cũ nhất",
        "rating-highest": "Đánh giá: Cao nhất",
        "rating-lowest": "Đánh giá: Thấp nhất",
        "questions-highest": "Số câu hỏi: Nhiều nhất",
        "questions-lowest": "Số câu hỏi: Ít nhất",
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Global Background SVG Globe */}
            <div className="fixed -top-[10%] -left-[10%] md:-top-[20%] md:-left-[15%] w-[600px] md:w-[900px] h-[600px] md:h-[900px] text-primary pointer-events-none opacity-20 md:opacity-30 z-[-1]">
                <KnowledgeGlobeSVG />
            </div>

            {/* Category Nav Row */}
            <div className="w-full z-20">
                <div className="max-w-7xl mx-auto px-4">
                    <CategoryNav categories={categories} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-2 pb-10">
                {/* Header Information */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                            {query ? (
                                <>Đang hiển thị kết quả cho "{query}"</>
                            ) : categoryId ? (
                                <>Danh mục: {categories.find(c => c.id === parseInt(categoryId))?.name}</>
                            ) : (
                                <>Tất cả Quiz</>
                            )}
                        </h1>
                        <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
                            Tìm thấy {filteredResults.length} kết quả
                        </p>
                    </div>

                    {/* Advanced Sort Dropdown */}
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="rounded-2xl h-12 px-6 font-black text-sm gap-2 border-2 shadow-sm">
                                    <ListFilter className="w-4 h-4" />
                                    {sortLabels[sortBy]}
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800">
                                {Object.entries(sortLabels).map(([key, label]) => (
                                    <DropdownMenuItem 
                                        key={key}
                                        onClick={() => setSortBy(key as SortOption)}
                                        className={`rounded-xl font-bold py-3 transition-colors ${sortBy === key ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    >
                                        {label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-0 border border-white/10 rounded-4xl overflow-hidden bg-card/40 backdrop-blur-3xl shadow-2xl shadow-black/20">
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">Đang tải kết quả...</p>
                        </div>
                    ) : filteredResults.length > 0 ? (
                        filteredResults.map(quiz => (
                            <SearchResultItem 
                                key={quiz.id} 
                                quiz={quiz} 
                                onPlay={handlePlayNow} 
                            />
                        ))
                    ) : (
                        <div className="p-20 text-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Không tìm thấy kết quả nào</h2>
                            <p className="text-slate-400 font-bold">Thử thay đổi từ khóa hoặc bộ lọc để tìm thấy những gì bạn cần!</p>
                            <Button 
                                variant="link" 
                                onClick={() => navigate('/')}
                                className="mt-6 text-primary font-black"
                            >
                                Quay lại trang chủ
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Results;
