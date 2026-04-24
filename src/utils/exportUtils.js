import html2canvas from 'html2canvas';

export const exportAsImage = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // Force the element to be visible and correctly sized during capture
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true, // Allow images from other domains (Drive/Imgur)
            backgroundColor: '#060E20',
            windowWidth: 1080,
            windowHeight: 1080
        });

        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = image;
        link.click();
    } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export image. Please try again.");
    }
};
