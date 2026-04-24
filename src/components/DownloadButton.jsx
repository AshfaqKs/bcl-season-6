import React from 'react';
import html2canvas from 'html2canvas';

const DownloadButton = ({ elementId, filename, label }) => {
    
    const handleDownload = async () => {
        const element = document.getElementById(elementId);
        if (!element) return;

        // SHOW FEEDBACK
        const originalBtnText = label || "Download Poster";
        console.log("Starting high-fidelity render...");

        try {
            // OPTIMIZED FOR FIDELITY
            const canvas = await html2canvas(element, {
                scale: 2,           // Optimized scale for maximum accuracy
                useCORS: true,      
                backgroundColor: "#020617", // Force matching background
                logging: false,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is perfectly visible for capture
                    const clonedElement = clonedDoc.getElementById(elementId);
                    if (clonedElement) {
                        clonedElement.style.transform = "none";
                    }
                }
            });

            // DIRECT DOWNLOAD
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = image;
            link.click();
            
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download image. Please try again.");
        }
    };

    return (
        <button 
            onClick={handleDownload}
            className="group flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter hover:scale-[1.05] transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 active:scale-95"
        >
            <span className="text-xl group-hover:rotate-12 transition-transform">💾</span>
            <span>{label || "Download Poster"}</span>
        </button>
    );
};

export default DownloadButton;
