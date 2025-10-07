import { AspectRatio } from '../types';

const DPI = 96;
const INCH_TO_CM = 2.54;

/**
 * Converts a value in centimeters to pixels based on a standard screen DPI.
 * @param cm The value in centimeters.
 * @returns The equivalent value in pixels.
 */
export const convertCmToPx = (cm: number): number => {
    return Math.round((cm / INCH_TO_CM) * DPI);
};

const supportedRatios: { name: AspectRatio; value: number }[] = [
    { name: '16:9', value: 16 / 9 }, // ~1.77
    { name: '4:3', value: 4 / 3 },   // ~1.33
    { name: '1:1', value: 1 },
    { name: '3:4', value: 3 / 4 },   // 0.75
    { name: '9:16', value: 9 / 16 }, // ~0.56
];

/**
 * Finds the closest supported aspect ratio to a given width and height.
 * This is used to select the best generation option before resizing.
 * @param width The target width.
 * @param height The target height.
 * @returns The closest AspectRatio string.
 */
export const findClosestAspectRatio = (width: number, height: number): AspectRatio => {
    if (height === 0) return '1:1'; // Avoid division by zero
    const targetRatio = width / height;

    // Find the supported ratio with the minimum difference from the target ratio
    let closest = supportedRatios[0];
    let minDiff = Math.abs(targetRatio - closest.value);

    for (let i = 1; i < supportedRatios.length; i++) {
        const diff = Math.abs(targetRatio - supportedRatios[i].value);
        if (diff < minDiff) {
            minDiff = diff;
            closest = supportedRatios[i];
        }
    }

    return closest.name;
};

/**
 * Resizes a base64 encoded image to a new width and height using a canvas.
 * @param base64Image The source image data URL.
 * @param newWidth The target width in pixels.
 * @param newHeight The target height in pixels.
 * @returns A promise that resolves with the new base64 data URL of the resized image.
 */
export const resizeImage = (base64Image: string, newWidth: number, newHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            
            // Draw the image stretched to the new dimensions
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            const mimeType = base64Image.substring(5, base64Image.indexOf(';'));
            resolve(canvas.toDataURL(mimeType));
        };
        img.onerror = () => {
            reject(new Error('Failed to load image for resizing'));
        };
        img.src = base64Image;
    });
};
