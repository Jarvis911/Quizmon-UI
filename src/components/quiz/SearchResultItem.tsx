import React from 'react';
import { Star, Play, Calendar, ListChecks, Sparkles } from 'lucide-react';
import { Quiz } from '@/types';
import { Button } from '@/components/ui/button';

interface SearchResultItemProps {
    quiz: Quiz;
    onPlay: (id: string | number) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ quiz, onPlay }) => {
    // Calculate average rating or use a default
    const rating = 4.5; // Mock for now, in a real app calculate from quizRatings
    const questionCount = quiz.questions?.length || 0;
    const isAiGenerated = quiz.title.toLowerCase().includes('ai') || quiz.description?.toLowerCase().includes('ai');

    return (
        <div className="group flex flex-row gap-3 md:gap-4 p-3 md:p-4 bg-transparent border-b border-foreground/5 hover:bg-foreground/5 transition-all duration-200">
            {/* Thumbnail */}
            <div className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/50 shrink-0 border border-foreground/10">
                {quiz.image ? (
                    <img 
                        src={quiz.image} 
                        alt={quiz.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Sparkles className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
                    </div>
                )}
                
                {/* AI Badge */}
                {isAiGenerated && (
                    <div className="absolute bottom-1 left-1 bg-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-2 h-2 fill-current" /> AI
                    </div>
                )}
            </div>

            {/* Info & Action Container */}
            <div className="flex-1 flex flex-col min-w-0 justify-between">
                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="text-sm md:text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 md:line-clamp-2 md:truncate">
                        {quiz.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-1 mt-0.5 md:mt-1 text-muted-foreground text-[10px] md:text-xs font-bold">
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{rating.toFixed(1)}</span>
                        </div>

                        {/* Question Count */}
                        <div className="flex items-center gap-1">
                            <ListChecks className="w-3 h-3" />
                            <span>{questionCount} câu hỏi</span>
                        </div>

                        {/* Date - hide on mobile to save space */}
                        {quiz.createdAt && (
                            <div className="hidden sm:flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Intl.DateTimeFormat('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(quiz.createdAt))}</span>
                            </div>
                        )}
                    </div>

                    {/* Description/Tags - Using description as tags if available */}
                    <p className="mt-1 md:mt-2 text-[10px] md:text-xs text-muted-foreground line-clamp-1 italic">
                        {quiz.description || "Không có mô tả"}
                    </p>
                </div>
                
                {/* Footer info & Action button layout */}
                <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest truncate">
                            Bởi {quiz.creator?.username || "Ẩn danh"}
                        </span>
                        {quiz.category && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[8px] md:text-[10px] font-black uppercase tracking-tighter truncate max-w-[80px] md:max-w-none">
                                    {quiz.category.name}
                                </span>
                            </>
                        )}
                    </div>
                    {/* Action */}
                    <Button 
                        size="sm"
                        onClick={() => onPlay(quiz.id)}
                        className="rounded-full px-3 md:px-6 h-6 md:h-8 font-black text-[9px] md:text-xs uppercase tracking-widest shadow hover:translate-y-[-2px] active:translate-y-0 transition-all shrink-0"
                    >
                        <Play className="w-2.5 h-2.5 md:w-3 md:h-3 md:mr-1.5 fill-current" /> <span className="hidden md:inline">Chơi</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SearchResultItem;
