import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Home, Palette, Tv, Globe, Book, Languages, Leaf, Dribbble, HelpCircle } from "lucide-react";
import { Category } from "../../types";

interface CategoryNavProps {
    categories: Category[];
}

const defaultIcons: Record<string, React.ReactNode> = {
    'Start': <img src="https://cdn-icons-png.flaticon.com/512/25/25694.png" alt="Start" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Art & Literature': <img src="https://cdn-icons-png.flaticon.com/512/2400/2400603.png" alt="Art" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Entertainment': <img src="https://cdn-icons-png.flaticon.com/512/3983/3983680.png" alt="Entertainment" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Geography': <img src="https://cdn-icons-png.flaticon.com/512/4746/4746231.png" alt="Geography" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'History': <img src="https://cdn-icons-png.flaticon.com/512/2682/2682065.png" alt="History" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Languages': <img src="https://cdn-icons-png.flaticon.com/512/3898/3898082.png" alt="Languages" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Science & Nature': <img src="https://cdn-icons-png.flaticon.com/512/1598/1598196.png" alt="Science" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Sports': <img src="https://cdn-icons-png.flaticon.com/512/4163/4163684.png" alt="Sports" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Trivia': <img src="https://cdn-icons-png.flaticon.com/512/3406/3406828.png" alt="Trivia" className="w-8 h-8 object-contain drop-shadow-sm" />,
};

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

    const getIconForCategory = (name: string) => {
        // Map category names to icons, or return a default
        if (name.toLowerCase().includes('art') || name.toLowerCase().includes('nghệ thuật')) return defaultIcons['Art & Literature'];
        if (name.toLowerCase().includes('entertainment') || name.toLowerCase().includes('giải trí')) return defaultIcons['Entertainment'];
        if (name.toLowerCase().includes('geo') || name.toLowerCase().includes('địa lý')) return defaultIcons['Geography'];
        if (name.toLowerCase().includes('history') || name.toLowerCase().includes('lịch sử')) return defaultIcons['History'];
        if (name.toLowerCase().includes('lang') || name.toLowerCase().includes('ngôn ngữ')) return defaultIcons['Languages'];
        if (name.toLowerCase().includes('science') || name.toLowerCase().includes('khoa học')) return defaultIcons['Science & Nature'];
        if (name.toLowerCase().includes('sport') || name.toLowerCase().includes('thể thao')) return defaultIcons['Sports'];
        return defaultIcons['Trivia'];
    };

    return (
        <div className="relative w-full py-4">
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
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex flex-col items-center justify-center min-w-[80px] group gap-2 py-2"
                >
                    <div className="text-primary group-hover:scale-110 transition-transform mb-1">
                        {defaultIcons['Start']}
                    </div>
                    <span className="text-xs font-bold text-foreground whitespace-nowrap border-b-2 border-primary pb-1">Start</span>
                </button>

                {categories.slice(0, 7).map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            // Find element by id and scroll
                            document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
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
