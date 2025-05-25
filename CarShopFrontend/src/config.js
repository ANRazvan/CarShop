// use .env 

// Configuration settings for the application
// Dynamic API URL based on environment

const config = {
    API_URL: import.meta.env.VITE_API_URL,
    WS_URL: import.meta.env.VITE_WS_URL, // WebSocket URL
    UPLOADS_PATH: `/uploads/`, // Use a relative path for uploads
};

export default config;