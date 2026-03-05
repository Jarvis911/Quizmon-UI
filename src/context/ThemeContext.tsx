import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { AnimatedBackground } from "../components/ui/AnimatedBackground";

export interface NavbarStyles {
    logo: string;
    buttonPrimary: string;
    buttonSecondary: string;
    borderFocus: string;
}

export interface Theme {
    id: string;
    name: string;
    className: string;
    navbarStyles: NavbarStyles;
}

export const BACKGROUND_THEMES: Theme[] = [
    {
        id: 'default',
        name: 'Mặc định (Trong suốt)',
        className: 'bg-transparent',
        navbarStyles: {
            logo: 'text-orange-600',
            buttonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
            buttonSecondary: 'bg-orange-500 hover:bg-orange-600 text-white',
            borderFocus: 'border-orange-400 focus:border-orange-500'
        }
    },
    {
        id: 'sunset',
        name: 'Hoàng hôn',
        className: 'bg-gradient-to-br from-orange-400 via-red-400 to-pink-500',
        navbarStyles: {
            logo: 'text-pink-600',
            buttonPrimary: 'bg-pink-600 hover:bg-pink-700 text-white',
            buttonSecondary: 'bg-pink-500 hover:bg-pink-600 text-white',
            borderFocus: 'border-pink-400 focus:border-pink-500'
        }
    },
    {
        id: 'ocean',
        name: 'Đại dương',
        className: 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400',
        navbarStyles: {
            logo: 'text-blue-600',
            buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
            buttonSecondary: 'bg-blue-500 hover:bg-blue-600 text-white',
            borderFocus: 'border-blue-400 focus:border-blue-500'
        }
    },
    {
        id: 'forest',
        name: 'Rừng xanh',
        className: 'bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500',
        navbarStyles: {
            logo: 'text-green-600',
            buttonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
            buttonSecondary: 'bg-green-500 hover:bg-green-600 text-white',
            borderFocus: 'border-green-400 focus:border-green-500'
        }
    },
    {
        id: 'midnight',
        name: 'Đêm khuya',
        className: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800',
        navbarStyles: {
            logo: 'text-purple-600',
            buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
            buttonSecondary: 'bg-purple-500 hover:bg-purple-600 text-white',
            borderFocus: 'border-purple-400 focus:border-purple-500'
        }
    },
    {
        id: 'lavender',
        name: 'Hoa oải hương',
        className: 'bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300',
        navbarStyles: {
            logo: 'text-indigo-600',
            buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            buttonSecondary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
            borderFocus: 'border-indigo-400 focus:border-indigo-500'
        }
    },
];

interface ThemeContextType {
    themeId: string;
    selectedTheme: Theme;
    handleThemeChange: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeId, setThemeId] = useState<string>(() => {
        return localStorage.getItem("home_bg_theme") || "default";
    });

    const selectedTheme = BACKGROUND_THEMES.find(t => t.id === themeId) || BACKGROUND_THEMES[0];

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', themeId);
    }, [themeId]);

    const handleThemeChange = (id: string) => {
        setThemeId(id);
        localStorage.setItem("home_bg_theme", id);
    };

    return (
        <ThemeContext.Provider value={{ themeId, selectedTheme, handleThemeChange }}>
            {children}
            <div className="fixed inset-0 -z-[5] opacity-90 transition-all duration-700 ease-in-out pointer-events-none">
                <AnimatedBackground themeId={themeId} />
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
