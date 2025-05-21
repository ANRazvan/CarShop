// Configuration settings for the application
const IP='127.0.0.1'
const config = {
    // Dynamic API URL based on environment
    API_URL: import.meta.env.MODE === 'production' ? 
        'https://carshop-backend-app.azurewebsites.net' : 
        'http://localhost:5000',
    WS_URL: import.meta.env.MODE === 'production' ? 
        'wss://carshop-backend-app.azurewebsites.net/ws' : 
        'ws://localhost:5000/ws',
    UPLOADS_PATH: `/uploads/`, // Use a relative path for uploads
};

export default config;