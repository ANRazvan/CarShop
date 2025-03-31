import axios from 'axios';

class NetworkStatusService {
  constructor(serverCheckEndpoint = 'http://localhost:5000/api/health') {
    this.serverCheckEndpoint = serverCheckEndpoint;
    this.isOnline = navigator.onLine;
    this.isServerAvailable = true;
    this.listeners = [];
    
    // Initialize event listeners for network status
    window.addEventListener('online', this.handleNetworkChange.bind(this));
    window.addEventListener('offline', this.handleNetworkChange.bind(this));
    
    // Do an initial check of server availability
    this.checkServerAvailability();
    
    // Set up periodic server checking (every 30 seconds)
    this.serverCheckInterval = setInterval(() => {
      if (this.isOnline) {
        this.checkServerAvailability();
      }
    }, 30000);
  }
  
  handleNetworkChange() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    // If we just came back online, check the server
    if (!wasOnline && this.isOnline) {
      this.checkServerAvailability();
    }
    
    // If we went offline, mark server as unavailable too
    if (wasOnline && !this.isOnline) {
      this.isServerAvailable = false;
      this.notifyListeners();
    }
  }
  
  async checkServerAvailability() {
    if (!this.isOnline) {
      this.isServerAvailable = false;
      return false;
    }
    
    try {
      const response = await axios.get(this.serverCheckEndpoint, { timeout: 5000 });
      const newServerStatus = response.status === 200;
      
      if (this.isServerAvailable !== newServerStatus) {
        this.isServerAvailable = newServerStatus;
        this.notifyListeners();
      }
      
      return this.isServerAvailable;
    } catch (error) {
      if (this.isServerAvailable) {
        this.isServerAvailable = false;
        this.notifyListeners();
      }
      return false;
    }
  }
  
  addStatusListener(callback) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback({
      isOnline: this.isOnline,
      isServerAvailable: this.isServerAvailable
    });
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      isServerAvailable: this.isServerAvailable
    };
    this.listeners.forEach(callback => callback(status));
  }
  
  // Clean up on destroy
  destroy() {
    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
    clearInterval(this.serverCheckInterval);
  }
}

// Create a singleton instance
const networkStatusService = new NetworkStatusService();
export default networkStatusService;
