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
        <div className="group flex flex-col md:flex-row gap-4 p-4 bg-transparent border-b border-white/5 hover:bg-white/5 transition-all duration-200">
            {/* Thumbnail */}
            <div className="relative w-full md:w-32 h-48 md:h-24 rounded-2xl overflow-hidden bg-slate-800/50 shrink-0">
                {quiz.image ? (
                    <img 
                        src={quiz.image} 
                        alt={quiz.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Sparkles className="w-8 h-8 opacity-20" />
                    </div>
                )}
                
                {/* AI Badge */}
                {isAiGenerated && (
                    <div className="absolute bottom-1 left-1 bg-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-2 h-2 fill-current" /> AI
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col min-w-0">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                    {quiz.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-slate-500 dark:text-slate-400 text-xs font-bold">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{rating.toFixed(1)}</span>
                    </div>

                    {/* Question Count */}
                    <div className="flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>{questionCount} câu hỏi</span>
                    </div>

                    {/* Date */}
                    {quiz.createdAt && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Intl.DateTimeFormat('vi-VN', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(quiz.createdAt))}</span>
                        </div>
                    )}
                </div>

                {/* Description/Tags - Using description as tags if available */}
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 line-clamp-1 italic">
                    {quiz.description || "Không có mô tả"}
                </p>
                
                {/* Categories/Creator info */}
                <div className="mt-auto pt-2 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        Bởi {quiz.creator?.username || "Ẩn danh"}
                    </span>
                    {quiz.category && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-tighter">
                                {quiz.category.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Action */}
            <div className="flex items-center justify-end md:justify-center px-2">
                <Button 
                    onClick={() => onPlay(quiz.id)}
                    className="rounded-full px-6 font-black text-xs uppercase tracking-widest shadow-lg hover:translate-y-[-2px] active:translate-y-0 transition-all"
                >
                    <Play className="w-3 h-3 mr-2 fill-current" /> Chơi
                </Button>
            </div>
        </div>
    );
};

export default SearchResultItem;
