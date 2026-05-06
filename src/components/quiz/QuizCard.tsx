import { Star, Play, Pencil, Copy } from 'lucide-react';
import { SiGoogleclassroom } from 'react-icons/si';
import { MdImageNotSupported } from "react-icons/md";
import { Button } from '@/components/ui/button';
import { Quiz } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface QuizCardProps {
    quiz: Quiz;
    onPlay: (id: string | number) => void;
    onEdit?: (id: string | number) => void;
    onAssign?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
    onReplicate?: (id: string | number) => void;
    isAiGenerated?: boolean;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

const QuizCard: React.FC<QuizCardProps> = ({
    quiz,
    onPlay,
    onEdit,
    onAssign,
    onDelete,
    onReplicate,
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
                        <span className="text-[10px] font-black uppercase tracking-widest">Không có ảnh</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                    {difficulty && (
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${difficulty === 'EASY' ? 'text-emerald-500' :
                                difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500'
                                }`}>
                                {difficulty === 'EASY' ? 'DỄ' :
                                    difficulty === 'MEDIUM' ? 'VỪA' : 'KHÓ'}
                            </span>
                        </div>
                    )}
                    {isAiGenerated && (
                        <div className="bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-400">
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                TẠO BỞI AI
                            </span>
                        </div>
                    )}
                </div>

                {/* Hover Overlay (Desktop) */}
                <div className="hidden lg:flex absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center p-2">
                    <div className="flex flex-col gap-1.5 w-full animate-in zoom-in-95 duration-300">
                        <Button
                            onClick={() => onPlay(quiz.id)}
                            className="w-full h-8 px-2 rounded-lg bg-primary hover:bg-primary/90 font-black text-[9px] uppercase tracking-tighter"
                        >
                            <Play className="w-3 h-3 mr-1 fill-current" /> CHƠI NGAY
                        </Button>

                        {(isOwner || (user && onAssign)) && (
                            <div className="flex flex-row gap-1 w-full">
                                {isOwner && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            onClick={() => onEdit?.(quiz.id)}
                                            className="flex-1 h-8 px-1 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 font-bold text-[9px] uppercase tracking-tighter"
                                        >
                                            <Pencil className="w-3 h-3 mr-1" /> SỬA
                                        </Button>
                                    </>
                                )}
                                {!isOwner && user && onAssign && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => onAssign?.(quiz.id)}
                                        className="w-full h-8 px-1 rounded-lg bg-indigo-500/80 hover:bg-indigo-600 text-white border border-indigo-400 font-bold text-[9px] uppercase tracking-tighter"
                                    >
                                        <SiGoogleclassroom className="w-3 h-3 mr-1" /> GIAO
                                    </Button>
                                )}
                            </div>
                        )}
                        {isOwner && onAssign && (
                            <Button
                                variant="secondary"
                                onClick={() => onAssign?.(quiz.id)}
                                className="w-full h-8 px-1 rounded-lg bg-indigo-500/80 hover:bg-indigo-600 text-white border border-indigo-400 font-bold text-[9px] uppercase tracking-tighter"
                            >
                                <SiGoogleclassroom className="w-3 h-3 mr-1" /> GIAO
                            </Button>
                        )}
                        {!isOwner && onReplicate && user && (
                            <Button
                                variant="secondary"
                                onClick={() => onReplicate?.(quiz.id)}
                                className="w-full h-8 px-1 rounded-lg bg-emerald-500/80 hover:bg-emerald-600 text-white border border-emerald-400 font-bold text-[9px] uppercase tracking-tighter"
                            >
                                <Copy className="w-3 h-3 mr-1" /> SAO CHÉP
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-2 md:p-3 flex flex-col grow">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-xs md:text-sm line-clamp-2 md:line-clamp-2 mb-1 md:mb-2 group-hover:text-primary transition-colors leading-tight">
                    {quiz.title}
                </h3>

                <div className="mt-auto flex items-center justify-between gap-1 md:gap-2">
                    <div className="flex items-center gap-0.5 md:gap-1">
                        <span className="text-amber-500 font-bold text-[10px] md:text-xs">4.2</span>
                        <Star className="w-3 h-3 md:w-4 md:h-4 fill-amber-500 text-amber-500" />
                    </div>

                    <div className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate max-w-[60px] md:max-w-[100px]">
                        B. {quiz.creator?.username || 'Ẩn'}
                    </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex lg:hidden flex-row gap-1 w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        onClick={() => onPlay(quiz.id)}
                        className="flex-1 h-7 p-0 md:h-8 md:px-2 min-w-0 justify-center rounded-md bg-primary hover:bg-primary/90 shadow-sm"
                    >
                        <Play className="w-3 h-3 md:w-3 md:h-3 md:mr-1 shrink-0 fill-current" /> <span className="hidden md:inline font-black text-[10px] uppercase tracking-tight truncate">CHƠI</span>
                    </Button>

                    {isOwner && (
                            <Button
                                variant="outline"
                                onClick={() => onEdit?.(quiz.id)}
                                className="flex-1 h-7 p-0 md:h-8 md:px-1 min-w-0 justify-center rounded-md"
                            >
                                <Pencil className="w-3 h-3 md:w-3 md:h-3 md:mr-1 shrink-0" /> <span className="hidden md:inline font-bold text-[10px] uppercase tracking-tight truncate">SỬA</span>
                            </Button>
                    )}
                    {user && onAssign && (
                            <Button
                                variant="outline"
                                onClick={() => onAssign?.(quiz.id)}
                                className="flex-1 h-7 p-0 md:h-8 md:px-1 min-w-0 justify-center rounded-md text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                                <SiGoogleclassroom className="w-3 h-3 md:w-3 md:h-3 md:mr-1 shrink-0" /> <span className="hidden md:inline font-bold text-[10px] uppercase tracking-tight truncate">GIAO</span>
                            </Button>
                    )}
                    {!isOwner && onReplicate && user && (
                            <Button
                                variant="outline"
                                onClick={() => onReplicate?.(quiz.id)}
                                className="flex-1 h-7 p-0 md:h-8 md:px-1 min-w-0 justify-center rounded-md text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                                <Copy className="w-3 h-3 md:mr-1 shrink-0" /> <span className="hidden md:inline font-bold text-[10px] uppercase tracking-tight truncate">SAO CHÉP</span>
                            </Button>
                    )}
                </div>
            </div>
        </div>

    );
};

export default QuizCard;
