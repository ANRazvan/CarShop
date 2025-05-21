// Configuration settings for the application
const config = {
    // Dynamic API URL based on environment
    API_URL: import.meta.env.MODE === 'production' ? 
        'https://carshop-r48i.onrender.com/api' : 
        'http://localhost:5000/api',
    WS_URL: import.meta.env.MODE === 'production' ? 
        'wss://carshop-r48i.onrender.com/ws' : 
        'ws://localhost:5000/ws',
    UPLOADS_PATH: `/uploads/`, // Use a relative path for uploads
};

export default config;