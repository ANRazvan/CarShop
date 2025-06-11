// use .env 

// Configuration settings for the application
// Dynamic API URL based on environment

const getBaseUrl = (url) => {
    return url ? url.replace(/\/+$/, '') : ''; // Remove trailing slashes
};

const config = {
    API_URL: getBaseUrl(import.meta.env.VITE_API_URL),
    WS_URL: import.meta.env.VITE_WS_URL, // WebSocket URL
    UPLOADS_PATH: `${getBaseUrl(import.meta.env.VITE_API_URL)}/uploads`, // Full URL path for uploads
};

export default config;