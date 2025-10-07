
export const addImageWatermark = (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Reverted to the crystal logo for the watermark
    const logoSvgString = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2ZM12 4.47L19.53 9.5L12 14.53L4.47 9.5L12 4.47Z" fill="rgba(255, 255, 255, 0.6)" />
      </svg>
    `;

    const mainImage = new Image();
    mainImage.src = base64Image;

    mainImage.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      canvas.width = mainImage.width;
      canvas.height = mainImage.height;
      ctx.drawImage(mainImage, 0, 0);

      // --- Watermark Logo ---
      const svgBlob = new Blob([logoSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const logoImage = new Image();

      logoImage.onload = () => {
        try {
            const padding = Math.max(20, canvas.width * 0.015);
            // Make logo size proportional to image, e.g., 4% of width, but not too small or large
            const logoSize = Math.max(24, Math.min(canvas.width * 0.04, 64));

            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.drawImage(logoImage, canvas.width - logoSize - padding, canvas.height - logoSize - padding, logoSize, logoSize);
            
            const mimeType = base64Image.substring(5, base64Image.indexOf(';'));
            resolve(canvas.toDataURL(mimeType));
        } finally {
            URL.revokeObjectURL(url);
        }
      };

      logoImage.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load watermark SVG logo'));
      };

      logoImage.src = url;
    };

    mainImage.onerror = () => {
      reject(new Error('Failed to load image for watermarking'));
    };
  });
};