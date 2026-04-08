import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Quiz } from '@/types';
import QuizCard from './QuizCard';

interface QuizSectionProps {
    title: string;
    quizzes: Quiz[];
    onPlay: (id: string | number) => void;
    onEdit?: (id: string | number) => void;
    onAssign?: (id: string | number) => void;
    isAiGeneratedSection?: boolean;
    iconColor?: string;
    icon?: React.ReactNode;
}

const QuizSection: React.FC<QuizSectionProps> = ({
    title,
    quizzes,
    onPlay,
    onEdit,
    onAssign,
    isAiGeneratedSection = false,
    iconColor = 'bg-indigo-500',
    icon
}) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (quizzes.length === 0) return null;

    return (
        <section className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {icon ? (
                        <div className="flex items-center justify-center w-12 h-12 group-hover:scale-110 transition-transform duration-300">
                            {icon}
                        </div>
                    ) : (
                        <div className={`h-10 w-2 ${iconColor} rounded-full shadow-lg opacity-80`} />
                    )}
                    <h2 className="text-slate-800 dark:text-white text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">
                        {title}
                    </h2>
                </div>
                
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={scrollPrev}
                        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="relative group/carousel">
                <div className="overflow-visible" ref={emblaRef}>
                    <div className="flex gap-4 md:gap-6">
                        {quizzes.map((quiz) => (
                            <div 
                                key={quiz.id} 
                                className="flex-[0_0_42%] sm:flex-[0_0_32%] md:flex-[0_0_22%] lg:flex-[0_0_18%] xl:flex-[0_0_15%] min-w-0 max-w-[240px] md:max-w-none"
                            >
                                <QuizCard 
                                    quiz={quiz} 
                                    onPlay={onPlay}
                                    onEdit={onEdit}
                                    onAssign={onAssign}
                                    isAiGenerated={isAiGeneratedSection}
                                    difficulty={isAiGeneratedSection ? 'EASY' : undefined}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default QuizSection;
