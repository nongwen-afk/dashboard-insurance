/**
 * Loads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Preprocesses an image crop for better Tesseract OCR accuracy on Thai text.
 * - Crops the image based on pixelRect.
 * - Upscales the crop by a factor (e.g., 2x) so Tesseract can see small fonts.
 * - Applies grayscale, contrast stretching, and binarization.
 * 
 * @param file The original image file
 * @param pixelRect The rectangle coordinates in pixels { left, top, width, height }
 * @param scaleFactor How much to upscale the crop (default: 2)
 * @returns A base64 string of the preprocessed JPEG image
 */
export async function preprocessOcrImage(
  file: File,
  pixelRect: { left: number; top: number; width: number; height: number },
  scaleFactor: number = 2
): Promise<string> {
  const img = await loadImage(file);
  
  // Create a canvas for the upscaled crop
  const canvas = document.createElement('canvas');
  canvas.width = pixelRect.width * scaleFactor;
  canvas.height = pixelRect.height * scaleFactor;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get 2d context');

  // Draw the cropped area from the original image onto the canvas, scaling it up
  ctx.drawImage(
    img,
    pixelRect.left, pixelRect.top, pixelRect.width, pixelRect.height, // Source rectangle
    0, 0, canvas.width, canvas.height // Destination rectangle
  );

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Pass 1: Convert to grayscale and find min/max luminance for contrast stretching
  let minLum = 255;
  let maxLum = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula (human eye perception)
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = lum;     // R
    data[i + 1] = lum; // G
    data[i + 2] = lum; // B
    
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // Pass 2: Contrast stretching and Binarization (Thresholding)
  // We want to make text (dark parts) purely black (0), and background (light parts) purely white (255)
  // Calculate dynamic threshold based on the image's luminance range
  const threshold = minLum + (maxLum - minLum) * 0.55; // Slightly biased towards making things white to remove noise

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i]; // Since it's grayscale, R=G=B=lum
    
    // Binarization
    const newValue = lum < threshold ? 0 : 255;
    
    data[i] = newValue;     // R
    data[i + 1] = newValue; // G
    data[i + 2] = newValue; // B
    // data[i+3] is Alpha, keep it as 255
  }

  // Put the modified pixel data back onto the canvas
  ctx.putImageData(imageData, 0, 0);

  // Export as high-quality JPEG base64
  return canvas.toDataURL('image/jpeg', 1.0);
}
