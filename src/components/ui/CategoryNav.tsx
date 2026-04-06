import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Category } from "../../types";
import { getIconForCategory, defaultIcons } from "../../lib/categoryIcons";

interface CategoryNavProps {
    categories: Category[];
}
export default function CategoryNav({ categories }: CategoryNavProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftScroll, setShowLeftScroll] = useState(false);
    const [showRightScroll, setShowRightScroll] = useState(true);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 300;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const navigate = useNavigate();
    const location = useLocation();

    const handleCategoryClick = (id: number) => {
        if (location.pathname === "/results") {
            // If already on results page, just update the search param
            navigate(`/results?categoryId=${id}`);
        } else {
            // Otherwise navigate to results page
            navigate(`/results?categoryId=${id}`);
        }
    };

    return (
        <div className="relative w-full py-2">
            {/* Scroll Buttons */}
            {showLeftScroll && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-md ml-2 hover:bg-white"
                >
                    <ChevronLeft className="w-7 h-7 text-gray-700" />
                </button>
            )}

            {/* Nav Container */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex items-center justify-center gap-4 md:gap-8 overflow-x-auto no-scrollbar px-4 md:px-8 scroll-smooth w-full max-w-7xl mx-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <button
                    onClick={() => {
                        if (location.pathname === "/results") {
                            navigate("/results"); // Reset filters
                        } else {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}
                    className="flex flex-col items-center justify-center min-w-[80px] group gap-2 py-2"
                >
                    <div className="text-primary group-hover:scale-110 transition-transform mb-1">
                        {defaultIcons['Start']}
                    </div>
                    <span className="text-xs font-bold text-foreground whitespace-nowrap border-b-2 border-primary pb-1">Start</span>
                </button>

                {categories.slice(0, 10).map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className="flex flex-col items-center justify-center min-w-[80px] group gap-2 py-2 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <div className="text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all mb-1">
                            {getIconForCategory(cat.name)}
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{cat.name}</span>
                    </button>
                ))}
            </div>

            {showRightScroll && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-md mr-2 hover:bg-white"
                >
                    <ChevronRight className="w-7 h-7 text-gray-700" />
                </button>
            )}

            {/* CSS to hide scrollbar */}
            <style>
                {`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                `}
            </style>
        </div>
    );
}
