/**
 * Preprocesses an image file by converting it to grayscale and adjusting contrast
 * to improve OCR accuracy.
 * @param file The image file to preprocess.
 * @returns A promise that resolves with the base64 encoded string of the processed image.
 */
export const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }

        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Apply grayscale filter using the luminosity method for better results.
                for (let i = 0; i < data.length; i += 4) {
                    const grayscale = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = grayscale;     // red
                    data[i + 1] = grayscale; // green
                    data[i + 2] = grayscale; // blue
                }

                // Apply contrast adjustment.
                const contrast = 60; // A value between -255 and 255.
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                
                for (let i = 0; i < data.length; i += 4) {
                    // RGB are the same due to grayscale, so we only need to calculate once.
                    let pixelValue = data[i];
                    pixelValue = factor * (pixelValue - 128) + 128;
                    // Clamp the value between 0 and 255
                    pixelValue = Math.max(0, Math.min(255, pixelValue));
                    
                    data[i] = pixelValue;
                    data[i + 1] = pixelValue;
                    data[i + 2] = pixelValue;
                }

                ctx.putImageData(imageData, 0, 0);

                // Get the base64 representation of the processed image, without the data URL prefix.
                const dataUrl = canvas.toDataURL(file.type);
                const base64 = dataUrl.split(',')[1];
                resolve(base64);

            } catch (error) {
                reject(error);
            }
        };

        image.onerror = (error) => reject(error);

        // Read the file and set it as the image source.
        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                image.src = e.target.result;
            } else {
                reject(new Error('Failed to read file as Data URL'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
