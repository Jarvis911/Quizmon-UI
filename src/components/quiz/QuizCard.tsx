import React from 'react';
import { Star, Play, Edit3, BookOpen } from 'lucide-react';
import { SiGoogleclassroom } from 'react-icons/si';
import { MdImageNotSupported } from "react-icons/md";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Quiz } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface QuizCardProps {
    quiz: Quiz;
    onPlay: (id: string | number) => void;
    onEdit?: (id: string | number) => void;
    onAssign?: (id: string | number) => void;
    isAiGenerated?: boolean;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

const QuizCard: React.FC<QuizCardProps> = ({
    quiz,
    onPlay,
    onEdit,
    onAssign,
    isAiGenerated = false,
    difficulty
}) => {
    const { user } = useAuth();
    const isOwner = user && user.id === quiz.creatorId;

    return (
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden flex flex-col h-full border border-slate-200 dark:border-slate-800">
            {/* Image Container */}
            <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {quiz.image ? (
                    <img
                        src={quiz.image}
                        alt={quiz.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <MdImageNotSupported className="w-12 h-12 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                    </div>
                )}
                
                {/* Badges */}
                <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                    {difficulty && (
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                             <span className={`text-[10px] font-black uppercase tracking-wider ${
                                difficulty === 'EASY' ? 'text-emerald-500' : 
                                difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500'
                             }`}>
                                {difficulty}
                             </span>
                        </div>
                    )}
                    {isAiGenerated && (
                        <div className="bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-400">
                             <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                AI GENERATED
                             </span>
                        </div>
                    )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4">
                    <Button 
                        onClick={() => onPlay(quiz.id)}
                        className="w-full h-8 px-4 rounded-full bg-primary hover:bg-primary/90 font-black text-[10px] uppercase tracking-wider"
                    >
                        <Play className="w-2.5 h-2.5 mr-2 fill-current" /> CHƠI NGAY
                    </Button>
                    
                    {isOwner && (
                        <>
                            <Button 
                                variant="secondary"
                                onClick={() => onEdit?.(quiz.id)}
                                className="w-full h-8 px-4 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold text-[10px] uppercase tracking-wider"
                            >
                                <Edit3 className="w-2.5 h-2.5 mr-2" /> CHỈNH SỬA
                            </Button>
                            <Button 
                                variant="secondary"
                                onClick={() => onAssign?.(quiz.id)}
                                className="w-full h-8 px-4 rounded-full bg-indigo-500/80 hover:bg-indigo-600 text-white border border-indigo-400 font-bold text-[10px] uppercase tracking-wider"
                            >
                                <SiGoogleclassroom className="w-2.5 h-2.5 mr-2" /> GIAO BÀI
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="p-3 flex flex-col grow">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {quiz.title}
                </h3>
                
                <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-bold text-xs">4.2</span>
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </div>
                    
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate max-w-[100px]">
                        Bởi {quiz.creator?.username || 'Ẩn danh'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizCard;
