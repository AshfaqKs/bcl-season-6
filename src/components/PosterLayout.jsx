import React from 'react';

const PosterLayout = ({ children, id }) => {
    return (
        <div 
            id={id}
            className="w-[1080px] h-[1080px] bg-slate-950 flex flex-col p-20 relative overflow-hidden shrink-0 shadow-2xl rounded-[60px]"
            style={{ 
                // FIXED: Simplified gradient for perfect image capture fidelity
                background: `linear-gradient(135deg, #020617 0%, #0f172a 100%)`,
                fontFamily: "'Inter', sans-serif"
            }}
        >
            {/* Subtle Lighting Overlays */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 opacity-[0.07] rounded-full -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900 opacity-[0.05] rounded-full -ml-48 -mb-48"></div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};

export default PosterLayout;
