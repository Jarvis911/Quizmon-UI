import React, { useMemo } from 'react';
import { Heart, Star, Puzzle, Cloud, Ghost, Circle, Square, Triangle } from 'lucide-react';

const icons = [Heart, Star, Puzzle, Cloud, Ghost, Circle, Square, Triangle];

const FloatingElements = () => {
    const elements = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => {
            const Icon = icons[Math.floor(Math.random() * icons.length)];
            const size = Math.floor(Math.random() * 40) + 30; // 30-70px (larger)
            const left = Math.random() * 100; // 0-100%
            const duration = Math.random() * 10 + 15; // 15-25s
            const delay = Math.random() * -30;
            // Increased opacity for better visibility
            const opacity = Math.random() * 0.2 + 0.15; // 0.15 - 0.35

            return (
                <div
                    key={i}
                    className="absolute pointer-events-none select-none animate-floating-fall text-primary/40 dark:text-primary/30"
                    style={{
                        left: `${left}%`,
                        top: '-15%',
                        width: size,
                        height: size,
                        opacity: opacity,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                    }}
                >
                    <Icon size={size} strokeWidth={1.5} />
                </div>
            );
        });
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {elements}
        </div>
    );
};

export default React.memo(FloatingElements);
