/**
 * Utility functions for handling images in the CarShop application
 */

/**
 * Gets a display URL for an image regardless of how it's stored
 * @param {File|string|null} imageSource - The image source (File object or base64 string)
 * @param {string} defaultImage - Default image URL to use if no image is provided
 * @returns {string} - URL for displaying the image
 */
export const getDisplayUrl = (imageSource, defaultImage = '/default-car.jpg') => {
    // If the image is a File object, create an object URL for display
    if (imageSource instanceof File) {
        return URL.createObjectURL(imageSource);
    }
    
    // If it's a string (base64 or URL), use directly
    if (typeof imageSource === 'string' && imageSource) {
        return imageSource;
    }
    
    // If no image, use default
    return defaultImage;
};

/**
 * Validates an image URL by loading it and checking for errors
 * @param {string} url - The image URL to validate
 * @returns {Promise<boolean>} - Promise that resolves to true if valid, false otherwise
 */
export const validateImageUrl = (url) => {
    return new Promise((resolve) => {
        if (!url) {
            resolve(false);
            return;
        }
        
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
};

/**
 * Cleans up object URLs to prevent memory leaks
 * @param {string} url - The object URL to revoke
 */
export const revokeObjectUrl = (url) => {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
};
