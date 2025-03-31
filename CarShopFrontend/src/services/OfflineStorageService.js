import axios from 'axios';
import networkStatusService from './NetworkStatusService';

const STORAGE_KEYS = {
  PENDING_OPERATIONS: 'car_shop_pending_operations',
  CARS_CACHE: 'car_shop_cars_cache'
};

class OfflineStorageService {
  constructor() {
    this.pendingOperations = this.loadPendingOperations();
    this.carsCache = this.loadCarsCache();
    
    // Try to sync when coming online
    networkStatusService.addStatusListener(({ isOnline, isServerAvailable }) => {
      if (isOnline && isServerAvailable) {
        this.syncPendingOperations();
      }
    });
  }
  
  // Load and save operations from localStorage
  loadPendingOperations() {
    const stored = localStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
    return stored ? JSON.parse(stored) : [];
  }
  
  savePendingOperations() {
    localStorage.setItem(STORAGE_KEYS.PENDING_OPERATIONS, JSON.stringify(this.pendingOperations));
  }
  
  // Load and save cars cache
  loadCarsCache() {
    const stored = localStorage.getItem(STORAGE_KEYS.CARS_CACHE);
    return stored ? JSON.parse(stored) : { cars: [], timestamp: 0 };
  }
  
  saveCarsCache(cars) {
    this.carsCache = { cars, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEYS.CARS_CACHE, JSON.stringify(this.carsCache));
  }
  
  // Add a pending operation
  addPendingOperation(operation) {
    // Generate a temporary ID for new cars
    if (operation.type === 'create') {
      operation.data.id = `temp_${Date.now()}`;
    }
    
    this.pendingOperations.push({
      ...operation,
      timestamp: Date.now()
    });
    
    this.savePendingOperations();
    
    // Update local cache based on the operation
    this.updateLocalCache(operation);
    
    return operation.data;
  }
  
  // Update local cache based on an operation
  updateLocalCache(operation) {
    const { type, data, id } = operation;
    
    if (type === 'create') {
      this.carsCache.cars.push(data);
    } 
    else if (type === 'update') {
      const index = this.carsCache.cars.findIndex(car => car.id === id);
      if (index !== -1) {
        this.carsCache.cars[index] = { ...this.carsCache.cars[index], ...data };
      }
    } 
    else if (type === 'delete') {
      this.carsCache.cars = this.carsCache.cars.filter(car => car.id !== id);
    }
    
    this.saveCarsCache(this.carsCache.cars);
  }
  
  // Try to sync pending operations with the server
  async syncPendingOperations() {
    if (this.pendingOperations.length === 0) return;
    if (!networkStatusService.isOnline || !networkStatusService.isServerAvailable) return;
    
    const operations = [...this.pendingOperations];
    const completedOperations = [];
    
    for (const operation of operations) {
      try {
        const { type, url, data, id } = operation;
        
        if (type === 'create') {
          const response = await axios.post(url, data);
          // Update any references to this temp ID in other pending operations
          this.updateTempIdReferences(data.id, response.data.id);
        } 
        else if (type === 'update') {
          await axios.put(url, data);
        } 
        else if (type === 'delete') {
          await axios.delete(url);
        }
        
        completedOperations.push(operation);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        // Stop syncing if there's an error
        break;
      }
    }
    
    // Remove completed operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !completedOperations.some(cop => cop === op)
    );
    this.savePendingOperations();
    
    // Refresh cache if all operations were completed
    if (this.pendingOperations.length === 0) {
      try {
        const response = await axios.get('http://localhost:5000/api/cars');
        this.saveCarsCache(response.data.cars || []);
      } catch (error) {
        console.error('Failed to refresh cache after sync:', error);
      }
    }
    
    return completedOperations.length;
  }
  
  // Update references to temporary IDs after they're created on the server
  updateTempIdReferences(tempId, actualId) {
    this.pendingOperations.forEach(operation => {
      if (operation.id === tempId) {
        operation.id = actualId;
      }
      
      if (operation.data && operation.data.id === tempId) {
        operation.data.id = actualId;
      }
      
      // Update URL if it contains the temp ID
      if (operation.url && operation.url.includes(tempId)) {
        operation.url = operation.url.replace(tempId, actualId);
      }
    });
    
    // Update cache references
    this.carsCache.cars.forEach(car => {
      if (car.id === tempId) {
        car.id = actualId;
      }
    });
    
    this.savePendingOperations();
    this.saveCarsCache(this.carsCache.cars);
  }
  
  // Get cached cars (optionally applying filters)
  getCachedCars(filters = {}) {
    let filteredCars = [...this.carsCache.cars];
    
    // Apply basic filtering
    if (filters.make) {
      filteredCars = filteredCars.filter(car => 
        car.make.toLowerCase() === filters.make.toLowerCase()
      );
    }
    
    if (filters.minPrice) {
      filteredCars = filteredCars.filter(car => car.price >= parseInt(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      filteredCars = filteredCars.filter(car => car.price <= parseInt(filters.maxPrice));
    }
    
    // Add more filters as needed
    
    return {
      cars: filteredCars,
      totalPages: 1,
      currentPage: 1,
      fromCache: true
    };
  }
  
  // Handle offline operations
  async createCar(data) {
    return this.addPendingOperation({
      type: 'create',
      url: 'http://localhost:5000/api/cars',
      data
    });
  }
  
  async updateCar(id, data) {
    return this.addPendingOperation({
      type: 'update',
      url: `http://localhost:5000/api/cars/${id}`,
      id,
      data
    });
  }
  
  async deleteCar(id) {
    return this.addPendingOperation({
      type: 'delete',
      url: `http://localhost:5000/api/cars/${id}`,
      id
    });
  }
  
  hasPendingOperations() {
    return this.pendingOperations.length > 0;
  }
  
  getPendingOperationsCount() {
    return this.pendingOperations.length;
  }
}

const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;
