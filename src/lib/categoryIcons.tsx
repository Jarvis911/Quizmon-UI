import React from "react";

export const defaultIcons: Record<string, React.ReactNode> = {
    'Start': <img src="https://cdn-icons-png.flaticon.com/512/2544/2544087.png" alt="Start" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Art & Literature': <img src="https://cdn-icons-png.flaticon.com/512/2400/2400603.png" alt="Art" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Entertainment': <img src="https://cdn-icons-png.flaticon.com/512/3983/3983680.png" alt="Entertainment" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Geography': <img src="https://cdn-icons-png.flaticon.com/512/4746/4746231.png" alt="Geography" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'History': <img src="https://cdn-icons-png.flaticon.com/512/2682/2682065.png" alt="History" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Languages': <img src="https://cdn-icons-png.flaticon.com/512/3898/3898082.png" alt="Languages" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Science & Nature': <img src="https://cdn-icons-png.flaticon.com/512/1598/1598196.png" alt="Science" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Sports': <img src="https://cdn-icons-png.flaticon.com/512/4163/4163684.png" alt="Sports" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'Trivia': <img src="https://cdn-icons-png.flaticon.com/512/3406/3406828.png" alt="Trivia" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'My Quizzes': <img src="https://cdn-icons-png.flaticon.com/512/3407/3407024.png" alt="My Quizzes" className="w-8 h-8 object-contain drop-shadow-sm" />,
    'AI': <img src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png" alt="AI" className="w-8 h-8 object-contain drop-shadow-sm" />,
};

export const getIconForCategory = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes('ai')) return defaultIcons['AI'];
    if (normalized.includes('art') || normalized.includes('nghệ thuật')) return defaultIcons['Art & Literature'];
    if (normalized.includes('entertainment') || normalized.includes('giải trí')) return defaultIcons['Entertainment'];
    if (normalized.includes('geo') || normalized.includes('địa lý')) return defaultIcons['Geography'];
    if (normalized.includes('history') || normalized.includes('lịch sử')) return defaultIcons['History'];
    if (normalized.includes('lang') || normalized.includes('ngôn ngữ')) return defaultIcons['Languages'];
    if (normalized.includes('science') || normalized.includes('khoa học')) return defaultIcons['Science & Nature'];
    if (normalized.includes('sport') || normalized.includes('thể thao')) return defaultIcons['Sports'];
    return defaultIcons['Trivia'];
};
