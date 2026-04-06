import React from "react";

interface AnimatedBackgroundProps {
    themeId: string;
}

const ForestScene = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 opacity-90" />

        {/* Sun rays */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-200 rounded-full blur-[100px] opacity-40 mix-blend-overlay" />

        {/* Floating leaves */}
        {[...Array(15)].map((_, i) => (
            <svg
                key={i}
                className={`absolute text-green-200/40 animate-[sway_8s_ease-in-out_infinite]`}
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    animationDuration: `${10 + Math.random() * 10}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    width: `${20 + Math.random() * 30}px`,
                    height: `${20 + Math.random() * 30}px`,
                }}
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
            </svg>
        ))}

        {/* Tree silhouettes */}
        <svg className="absolute bottom-0 left-0 w-full h-48 sm:h-64 text-green-900/20 fill-current preserve-3d" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path d="M0,200 L0,100 Q50,150 100,80 T200,60 T300,100 T400,40 T500,90 T600,50 T700,90 T800,40 T900,100 T1000,60 L1000,200 Z" />
            <path d="M-100,200 L-100,120 Q0,170 50,100 T150,80 T250,120 T350,60 T450,110 T550,70 T650,110 T750,60 T850,120 T950,80 L1050,200 Z" className="opacity-50" />
        </svg>
    </div>
);

const SunsetScene = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 opacity-90" />

        {/* Big Sun */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-tr from-yellow-300 to-orange-200 rounded-full blur-[2px] shadow-[0_0_100px_30px_rgba(253,224,71,0.6)] animate-[pulse_4s_ease-in-out_infinite]" />

        {/* Clouds */}
        {[...Array(4)].map((_, i) => (
            <svg
                key={i}
                className="absolute text-pink-200/30 fill-current animate-[driftRight_40s_linear_infinite]"
                style={{
                    top: `${10 + i * 20}%`,
                    left: `-30%`,
                    width: `${200 + Math.random() * 200}px`,
                    animationDuration: `${30 + Math.random() * 40}s`,
                    animationDelay: `-${Math.random() * 30}s`
                }}
                viewBox="0 0 24 24"
            >
                <path d="M19.35,10.04C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.04C2.34,8.36 0,10.91 0,14C0,17.31 2.69,20 6,20H19C21.76,20 24,17.76 24,15C24,12.36 21.95,10.22 19.35,10.04Z" />
            </svg>
        ))}
    </div>
);

const OceanScene = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 opacity-90" />

        {/* Light rays reflecting */}
        <div className="absolute -top-20 right-1/4 w-96 h-96 bg-cyan-200 rounded-full blur-[120px] opacity-40 mix-blend-overlay" />

        {/* Bubbles */}
        {[...Array(20)].map((_, i) => (
            <div
                key={i}
                className="absolute rounded-full border border-cyan-100/40 bg-cyan-50/10 animate-[floatUp_10s_ease-in_infinite]"
                style={{
                    left: `${Math.random() * 100}%`,
                    bottom: `-20px`,
                    width: `${5 + Math.random() * 15}px`,
                    height: `${5 + Math.random() * 15}px`,
                    animationDuration: `${5 + Math.random() * 10}s`,
                    animationDelay: `${Math.random() * 10}s`
                }}
            />
        ))}

        {/* Waves layered */}
        <div className="absolute bottom-0 left-0 w-[200%] h-32 animate-[wave_20s_linear_infinite]">
            <svg className="w-full h-full text-blue-500/20 fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.34,188.4,106.84C236.4,96.42,279.79,72.45,321.39,56.44Z"></path>
            </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-[200%] h-40 animate-[wave_25s_linear_infinite_reverse]">
            <svg className="w-full h-full text-teal-400/20 fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.34,188.4,106.84C236.4,96.42,279.79,72.45,321.39,56.44Z"></path>
            </svg>
        </div>
    </div>
);

const MidnightScene = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 opacity-95" />

        {/* Moon */}
        <div className="absolute top-16 right-32 w-24 h-24 rounded-full bg-yellow-100 blur-[1px] shadow-[0_0_50px_10px_rgba(253,224,71,0.3)]" />

        {/* Stars */}
        {[...Array(50)].map((_, i) => (
            <div
                key={i}
                className="absolute rounded-full bg-white animate-[twinkle_3s_ease-in-out_infinite]"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 70}%`,
                    width: `${Math.random() * 3}px`,
                    height: `${Math.random() * 3}px`,
                    animationDuration: `${2 + Math.random() * 4}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random()
                }}
            />
        ))}

        {/* Floating dust/clouds */}
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-purple-900/50 to-transparent" />
    </div>
);

const LavenderScene = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 opacity-90" />

        {/* Soft glowing orbs */}
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className="absolute rounded-full bg-white/30 blur-xl animate-[floatDiag_15s_ease-in-out_infinite]"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${50 + Math.random() * 100}px`,
                    height: `${50 + Math.random() * 100}px`,
                    animationDuration: `${10 + Math.random() * 20}s`,
                    animationDelay: `-${Math.random() * 10}s`
                }}
            />
        ))}

        {/* Falling petals */}
        {[...Array(20)].map((_, i) => (
            <div
                key={i}
                className="absolute w-3 h-3 bg-pink-100/50 rounded-tl-full rounded-br-full animate-[sway_8s_ease-in-out_infinite]"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    animationDuration: `${8 + Math.random() * 12}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`
                }}
            />
        ))}
    </div>
);

const BasicScene = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#f8fafc]">
        {/* Subtle background texture or very faint grid could go here */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(#0078D4 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />

        {/* Large Azure-style soft blurs */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -left-20 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] animate-[pulse_15s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-cyan-300/10 rounded-full blur-[80px] animate-[pulse_12s_ease-in-out_infinite]" />
    </div>
);

const DefaultScene = () => (
    <div className="absolute inset-0 bg-transparent pointer-events-none" />
);

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ themeId }) => {
    switch (themeId) {
        case 'forest': return <ForestScene />;
        case 'sunset': return <SunsetScene />;
        case 'ocean': return <OceanScene />;
        case 'midnight': return <MidnightScene />;
        case 'lavender': return <LavenderScene />;
        case 'coban': return <BasicScene />;
        case 'default':
        default: return <DefaultScene />;
    }
};
