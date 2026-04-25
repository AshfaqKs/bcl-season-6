import React from 'react';

const PosterHeader = ({ title, subtitle, color = "green" }) => {
    
    // Mapping colors to Tailwind classes
    const colorMap = {
        green: { text: "text-green-400", border: "border-green-500" },
        blue: { text: "text-blue-400", border: "border-blue-500" },
        cyan: { text: "text-cyan-400", border: "border-cyan-500" },
        emerald: { text: "text-emerald-400", border: "border-emerald-500" },
        gold: { text: "text-yellow-400", border: "border-yellow-500" },
        yellow: { text: "text-yellow-400", border: "border-yellow-500" },
        red: { text: "text-red-400", border: "border-red-500" }
    };

    const theme = colorMap[color] || colorMap.green;

    return (
        <div className="flex flex-col items-center text-center mb-16 space-y-4 w-full">
            {/* League Brand Bar */}
            <div className="flex items-center justify-center space-x-4 mb-4 w-full">
                <span className="text-2xl font-black text-gray-500 italic uppercase tracking-tighter leading-none">BCL</span>
                <span className="text-2xl font-black text-blue-500 italic uppercase tracking-tighter leading-none">S6</span>
            </div>
            
            {/* Subtitle */}
            <div className="h-6 flex items-center justify-center">
                <p className={`${theme.text} font-black uppercase tracking-[0.6em] text-[14px] leading-none`}>
                    {subtitle}
                </p>
            </div>

            {/* Main Title - FIXED: Locked alignment and height */}
            <div className="relative flex flex-col items-center pb-8">
                <h2 className={`text-8xl font-black text-white italic tracking-tighter uppercase leading-[1] pr-6`}>
                    {title}
                </h2>
                <div className={`absolute bottom-0 w-[80%] h-2 ${theme.border.replace('border-', 'bg-')} rounded-full`}></div>
            </div>
        </div>
    );
};

export default PosterHeader;
