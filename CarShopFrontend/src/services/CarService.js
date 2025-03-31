import axios from 'axios';
import networkStatusService from './NetworkStatusService';
import offlineStorageService from './OfflineStorageService';

class CarService {
  constructor() {
    this.apiUrl = 'http://localhost:5000/api/cars';
  }
  
  async getCars(params = {}) {
    // Check if we're online and server is available
    if (networkStatusService.isOnline && networkStatusService.isServerAvailable) {
      try {
        const response = await axios.get(this.apiUrl, { params });
        // When successful, update the cache
        offlineStorageService.saveCarsCache(response.data.cars || []);
        return response.data;
      } catch (error) {
        console.error('Error fetching cars from server:', error);
        // Fall back to cache
        return offlineStorageService.getCachedCars(params);
      }
    } else {
      // Use cached data when offline
      return offlineStorageService.getCachedCars(params);
    }
  }
  
  async getCarById(id) {
    if (networkStatusService.isOnline && networkStatusService.isServerAvailable) {
      try {
        const response = await axios.get(`${this.apiUrl}/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching car details:', error);
        // Try to find in cache
        const cachedCars = offlineStorageService.loadCarsCache().cars;
        return cachedCars.find(car => car.id === parseInt(id) || car.id === id) || null;
      }
    } else {
      // Try to find in cache
      const cachedCars = offlineStorageService.loadCarsCache().cars;
      return cachedCars.find(car => car.id === parseInt(id) || car.id === id) || null;
    }
  }
  
  async createCar(carData) {
    if (networkStatusService.isOnline && networkStatusService.isServerAvailable) {
      try {
        const response = await axios.post(this.apiUrl, carData);
        return response.data;
      } catch (error) {
        console.error('Error creating car:', error);
        // Store locally if server request fails
        return offlineStorageService.createCar(carData);
      }
    } else {
      // Store locally when offline
      return offlineStorageService.createCar(carData);
    }
  }
  
  async updateCar(id, carData) {
    if (networkStatusService.isOnline && networkStatusService.isServerAvailable) {
      try {
        const response = await axios.put(`${this.apiUrl}/${id}`, carData);
        return response.data;
      } catch (error) {
        console.error('Error updating car:', error);
        // Store update locally if server request fails
        return offlineStorageService.updateCar(id, carData);
      }
    } else {
      // Store update locally when offline
      return offlineStorageService.updateCar(id, carData);
    }
  }
  
  async deleteCar(id) {
    if (networkStatusService.isOnline && networkStatusService.isServerAvailable) {
      try {
        const response = await axios.delete(`${this.apiUrl}/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting car:', error);
        // Store delete operation locally if server request fails
        return offlineStorageService.deleteCar(id);
      }
    } else {
      // Store delete operation locally when offline
      return offlineStorageService.deleteCar(id);
    }
  }
  
  getPendingOperationsCount() {
    return offlineStorageService.getPendingOperationsCount();
  }
  
  syncPendingOperations() {
    return offlineStorageService.syncPendingOperations();
  }
}

const carService = new CarService();
export default carService;
