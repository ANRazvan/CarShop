// Configuration settings for the application
const IP='127.0.0.1'
const config = {
    // Replace 'YOUR_VM_IP_OR_HOSTNAME' with your actual VM IP address or hostname
    API_URL: `http://${IP}:5000`,
    WS_URL: `ws://${IP}:5000/ws`,
    UPLOADS_PATH: `http://${IP}:5000/uploads/`,
    
};

export default config;