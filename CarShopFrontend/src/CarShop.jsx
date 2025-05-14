// CarShop.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import Sidebar from "./Sidebar.jsx";
import CarList from "./CarList.jsx";
import Cover from "./Cover.jsx";
import "./CarShop.css";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import CarOperationsContext from './CarOperationsContext.jsx';
import { faker } from "@faker-js/faker";
import config from './config.js';
import Charts from "./Charts.jsx";
import CacheManager from './utils/CacheManager.js';
import DebugPanel from "./DebugPanel.jsx";

// Global cache for pagination chunks (in memory)
const inMemoryCarCache = {
  chunks: {}, // Format: { pageKey: { data: [], timestamp: Date } }
  currentPage: 1,
  totalPages: 1,
  totalCars: 0,
  timestamp: null
};

// Create a session storage backup when localStorage fails
const sessionCarsCache = {
  cars: [],
  timestamp: null
};

// Utility function for debouncing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Storage utilities to handle localStorage quota limits
const storageUtils = {
    // Ultra compresses a car object - only absolute minimum fields
    minimalCompressCar: (car) => {
        if (!car) return null;
        
        // Store only the bare minimum fields needed to render the card
        return {
            id: car.id,
            make: car.make,
            model: car.model,
            price: car.price,
            _isTemp: car._isTemp || false
        };
    },
    
    // Compresses a car object by removing unnecessary fields for storage
    compressCar: (car) => {
        if (!car) return null;
        
        // Only store essential fields to save space
        const compressedCar = {
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            fuelType: car.fuelType,
            brandId: car.brandId, 
            _isTemp: car._isTemp || false
        };
        
        // Don't store keywords as they're not essential
        if (car.keywords && car.keywords.length < 20) {
            compressedCar.keywords = car.keywords;
        }
        
        // Only store image reference (not full data URLs) to save space
        if (car.img) {
            // If it's a path or URL that's not a base64 string, store it
            if (typeof car.img === 'string' && !car.img.startsWith('data:')) {
                compressedCar.img = car.img;
            }
        }
        
        return compressedCar;
    },
    
    // Check if local storage is available and has space
    isLocalStorageAvailable: () => {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Get a paginated cache key
    getPaginatedCacheKey: (page = 1, filters = {}) => {
        // Create a simplified hash of the filters for the cache key
        const filterHash = JSON.stringify(filters).replace(/[{}":\s]/g, '');
        return `cachedCars_p${page}_${filterHash}`;
    },
    
    // Store cars in page chunks to avoid quota issues
    storePagedCars: (cars, page = 1, totalPages = 1, totalCars = 0, filters = {}) => {
        if (!cars || !cars.length) return false;
        
        try {
            // Update the in-memory cache (no quota issues)
            const key = storageUtils.getPaginatedCacheKey(page, filters);
            inMemoryCarCache.chunks[key] = {
                data: cars,
                timestamp: new Date().toISOString()
            };
            
            inMemoryCarCache.currentPage = page;
            inMemoryCarCache.totalPages = totalPages;
            inMemoryCarCache.totalCars = totalCars;
            inMemoryCarCache.timestamp = new Date().toISOString();
            
            // Also store current page meta info in localStorage (small payload)
            try {
                const metaInfo = {
                    lastPage: page,
                    totalPages: totalPages,
                    totalCars: totalCars,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('carCache_meta', JSON.stringify(metaInfo));
                
                // Only try to store up to 50 cars per page in localStorage to avoid quota issues
                const compressedCars = cars.slice(0, 50).map(storageUtils.compressCar);
                localStorage.setItem(key, JSON.stringify({
                    cars: compressedCars,
                    timestamp: new Date().toISOString()
                }));
                
                console.log(`Stored page ${page} with ${compressedCars.length} cars in localStorage`);
                return true;
            } catch (error) {
                console.warn("Failed to store paged cars in localStorage:", error.message);
                // We still have the in-memory cache, so this is not a critical failure
                return true;
            }
        } catch (error) {
            console.error("Failed to store paged cars:", error);
            return false;
        }
    },
    
    // Get cars for a specific page from cache
    getPagedCars: (page = 1, filters = {}) => {
        const key = storageUtils.getPaginatedCacheKey(page, filters);
        
        // First try in-memory cache (fastest, no quota issues)
        if (inMemoryCarCache.chunks[key]?.data?.length) {
            console.log(`Using in-memory cache for page ${page}`);
            return {
                cars: inMemoryCarCache.chunks[key].data,
                totalPages: inMemoryCarCache.totalPages,
                totalCars: inMemoryCarCache.totalCars,
                fromCache: 'memory',
                timestamp: inMemoryCarCache.chunks[key].timestamp
            };
        }
        
        // Then try localStorage
        try {
            const cachedData = localStorage.getItem(key);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const metaInfo = JSON.parse(localStorage.getItem('carCache_meta') || '{}');
                
                console.log(`Using localStorage cache for page ${page}`);
                return {
                    cars: parsed.cars || [],
                    totalPages: metaInfo.totalPages || 1,
                    totalCars: metaInfo.totalCars || parsed.cars?.length || 0,
                    fromCache: 'local',
                    timestamp: parsed.timestamp
                };
            }
        } catch (error) {
            console.warn(`Failed to retrieve page ${page} from localStorage:`, error.message);
        }
        
        // No cached data found for this page
        return null;
    },
    
    // Safely store data in localStorage with error handling and multiple fallbacks
    safelyStoreData: (key, data) => {
        // Special handling for car data to use pagination strategy
        if (key === 'cachedCars' && data.cars && data.cars.length > 100) {
            console.log(`Breaking up ${data.cars.length} cars into cached chunks`);
            // Store metadata only
            const metaInfo = {
                totalCars: data.cars.length,
                timestamp: data.timestamp || new Date().toISOString()
            };
            
            try {
                localStorage.setItem('carCache_meta', JSON.stringify(metaInfo));
                // We'll store the first 50 cars under the main cache key
                const firstChunk = data.cars.slice(0, 50).map(storageUtils.compressCar);
                localStorage.setItem('cachedCars_p1', JSON.stringify({
                    cars: firstChunk,
                    timestamp: data.timestamp || new Date().toISOString()
                }));
                console.log(`Stored first 50 cars in localStorage`);
                
                // Rest of the cache handled by in-memory strategy
                inMemoryCarCache.chunks['cachedCars_p1'] = {
                    data: data.cars.slice(0, Math.min(1000, data.cars.length)),
                    timestamp: data.timestamp || new Date().toISOString()
                };
                inMemoryCarCache.totalCars = data.cars.length;
                inMemoryCarCache.timestamp = data.timestamp || new Date().toISOString();
                
                return true;
            } catch (error) {
                console.warn("Failed main cache storage, falling back to session memory");
                sessionCarsCache.cars = data.cars.slice(0, 1000); // Only keep a reasonable amount in memory
                sessionCarsCache.timestamp = data.timestamp || new Date().toISOString();
                return false;
            }
        }

        // First try: session memory cache for cars (doesn't use localStorage)
        if (key === 'cachedCars') {
            sessionCarsCache.cars = [...data.cars];
            sessionCarsCache.timestamp = data.timestamp;
        }
        
        try {
            // Second try: Normal storage
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn(`Storage warning for ${key}:`, error.message);
            
            // If it's a quota error, try to store a reduced version
            if (error.name === 'QuotaExceededError' || error.code === 22 || 
                error.code === 1014 || error.message.includes('quota')) {
                
                if (key === 'cachedCars' && data.cars) {
                    try {
                        // Third try: Store compressed version (no images, limited fields)
                        const compressedData = {
                            cars: data.cars.slice(0, 50).map(storageUtils.compressCar),
                            timestamp: data.timestamp,
                            compressed: true
                        };
                        
                        localStorage.setItem(key, JSON.stringify(compressedData));
                        console.log('Stored compressed car data (50 items)');
                        return true;
                    } catch (compressError) {
                        // Fourth try: Ultra minimal data, severely limited count
                        try {
                            console.warn('Trying minimal compression with very limited data');
                            const minimalData = {
                                cars: data.cars.slice(0, 20).map(storageUtils.minimalCompressCar),
                                timestamp: data.timestamp,
                                ultraCompressed: true
                            };
                            
                            localStorage.setItem(key, JSON.stringify(minimalData));
                            console.log('Stored minimal car data (20 items only)');
                            return true;
                        } catch (finalError) {
                            console.error('All localStorage attempts failed - using session memory only');
                            
                            // Fifth try: Clear other storage to make room
                            try {
                                localStorage.removeItem('cachedCars');
                                console.log('Cleared existing cached cars to make room');
                                
                                // Try one more time with minimal data
                                const lastAttemptData = {
                                    cars: data.cars.slice(0, 10).map(storageUtils.minimalCompressCar),
                                    timestamp: data.timestamp,
                                    emergency: true
                                };
                                
                                localStorage.setItem(key, JSON.stringify(lastAttemptData));
                                console.log('Emergency storage of 10 items succeeded');
                                return true;
                            } catch (e) {
                                // We'll rely on sessionCarsCache instead
                            }
                        }
                    }
                } else {
                    // For non-car data, try to store a stringified version
                    try {
                        const stringData = JSON.stringify(data);
                        if (stringData.length > 10000) {
                            // If it's too large, store truncated version
                            localStorage.setItem(key, stringData.substring(0, 10000) + '..."');
                            return true;
                        }
                    } catch (e) {
                        console.error('Failed to store even truncated data');
                    }
                }
            }
            
            // We still have the session memory cache as fallback
            return false;
        }
    },
    
    // Safely retrieve data from localStorage with fallback to session memory
    safelyGetData: (key, defaultValue = null) => {
        try {
            // Try to get from localStorage first
            const item = localStorage.getItem(key);
            
            // For cachedCars, use the session memory cache if localStorage fails or isn't available
            if (key === 'cachedCars' && (!item || item === 'null') && sessionCarsCache.cars.length > 0) {
                console.log('Using session memory cache instead of localStorage');
                return {
                    cars: sessionCarsCache.cars,
                    timestamp: sessionCarsCache.timestamp,
                    fromSessionCache: true
                };
            }
            
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error retrieving data from localStorage (${key}):`, error);
            
            // Fallback to session cache for cars
            if (key === 'cachedCars' && sessionCarsCache.cars.length > 0) {
                return {
                    cars: sessionCarsCache.cars,
                    timestamp: sessionCarsCache.timestamp,
                    fromSessionCache: true
                };
            }
            
            return defaultValue;
        }
    },
    
    // Clear all storage for testing
    clearAllStorage: () => {
        try {
            localStorage.clear();
            sessionCarsCache.cars = [];
            sessionCarsCache.timestamp = null;
            
            // Also clear in-memory cache
            inMemoryCarCache.chunks = {};
            inMemoryCarCache.totalCars = 0;
            inMemoryCarCache.timestamp = null;
            
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Queue for storing offline operations
const getOfflineQueue = () => {
    return storageUtils.safelyGetData('offlineOperationsQueue', []);
};

const setOfflineQueue = (queue) => {
    storageUtils.safelyStoreData('offlineOperationsQueue', queue);
};

const addToOfflineQueue = (operation) => {
    const queue = getOfflineQueue();
    queue.push({
        ...operation,
        timestamp: new Date().toISOString()
    });
    setOfflineQueue(queue);
};

const clearOfflineQueue = () => {
    localStorage.removeItem('offlineOperationsQueue');
    console.log("CarShop: Offline operations queue cleared");
    // Return an empty array to ensure the queue is cleared
    return [];
};

// Add this helper function to your component

// Improved caching strategy with pagination
const cacheCarsInChunks = (carsData, pageNumber = 1, append = false) => {
    const maxCarsPerChunk = 50; // Small enough to not exceed quota
    
    try {
        // If not appending, clear existing cache
        if (!append) {
            // Clear all chunked car caches
            let i = 1;
            while (localStorage.getItem(`cachedCars_page_${i}`)) {
                localStorage.removeItem(`cachedCars_page_${i}`);
                i++;
            }
        }
        
        // Store current page data
        const currentChunk = {
            cars: carsData,
            timestamp: new Date().toISOString(),
            page: pageNumber
        };
        
        // Store compressed data
        try {
            const serializedData = JSON.stringify(currentChunk);
            localStorage.setItem(`cachedCars_page_${pageNumber}`, serializedData);
            console.log(`Stored car data for page ${pageNumber} (${carsData.length} items)`);
        } catch (e) {
            console.warn(`Failed to cache cars for page ${pageNumber}:`, e);
        }
    } catch (error) {
        console.error("Error in cacheCarsInChunks:", error);
    }
};

const CarShop = () => {
    const carOperations = useContext(CarOperationsContext);
    const { deleteCar, fetchCars: contextFetchCars, lastWebSocketMessage } = carOperations;

    const [cars, setCars] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [serverAvailable, setServerAvailable] = useState(true);
    const [syncStatus, setSyncStatus] = useState(null); // For showing sync status
    const [offlineData, setOfflineData] = useState({
        cars: [],
        lastSyncTimestamp: null    });
    const [realtimeUpdateReceived, setRealtimeUpdateReceived] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [totalCars, setTotalCars] = useState(0);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    const [debugPanelExpanded, setDebugPanelExpanded] = useState(false);
    const [lastServerCheck, setLastServerCheck] = useState(null);
    const [lastDeleteResult, setLastDeleteResult] = useState(null);
    
    // Consolidated filter state
    const [filters, setFilters] = useState({
        makes: [],
        fuelTypes: [],
        minPrice: '',
        maxPrice: '',
        searchTerm: ''
    });
    
    // Debounce the filters to prevent too many requests for text inputs
    const debouncedFilters = useDebounce(filters, 300);
      const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
    const [itemsPerPage, setItemsPerPage] = useState(searchParams.get("itemsPerPage") ? 
        parseInt(searchParams.get("itemsPerPage")) : 8);
    const [sortMethod, setSortMethod] = useState('');    // Check if server is available
    const checkServerAvailability = useCallback(() => {
        console.log("Checking server availability...");
        axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`)
            .then(() => {
                console.log("Server availability check: SERVER IS AVAILABLE");
                const serverStatusChanged = !serverAvailable;
                if (serverStatusChanged) {
                    console.log("Server status changed: OFFLINE → ONLINE");
                }
                setServerAvailable(true);
                setLastServerCheck(new Date().toISOString());
                
                // Just set a flag to trigger the sync in a useEffect that runs after
                // all functions have been defined
                if (serverStatusChanged && isOnline) {
                    const queue = getOfflineQueue();
                    if (queue && queue.length > 0) {
                        console.log(`Found ${queue.length} operations to sync now that server is available`);
                        // We'll handle the actual sync in a useEffect
                    }
                }
            })
            .catch((error) => {
                console.error("Server unavailable:", error);
                if (serverAvailable) {
                    console.log("Server status changed: ONLINE → OFFLINE");
                }
                setServerAvailable(false);
                setLastServerCheck(new Date().toISOString());
                
                // Cache the current data for offline use if we're going offline
                if (cars.length > 0) {
                    storageUtils.safelyStoreData('cachedCars', {
                        cars: cars,
                        timestamp: new Date().toISOString()
                    });
                }
            });
    }, [cars, serverAvailable, isOnline]);

    // Memoize fetchCars to prevent unnecessary re-creation
    const fetchCars = useCallback(() => {
        console.log("CarShop: Fetching cars with current page:", currentPage, "and items per page:", itemsPerPage);
        console.log("CarShop: Current filters:", JSON.stringify(debouncedFilters));
        setLoading(true);
        
        // Safety timer to exit loading state even if request fails
        const loadingTimeout = setTimeout(() => {
            if (loading) {
                console.log("CarShop: Loading timeout reached - forcing exit from loading state");
                setLoading(false);
            }
        }, 5000); // 5 seconds timeout
        
        const params = new URLSearchParams();
        
        params.append("page", currentPage.toString());
          // For unlimited option, use 8 as itemsPerPage instead of -1
        if (itemsPerPage === -1 || itemsPerPage === Infinity) {
            params.append("itemsPerPage", "100");
            console.log("CarShop: Requesting 100 cars per page instead of unlimited");
        } else {
            params.append("itemsPerPage", itemsPerPage.toString());
            console.log(`CarShop: Requesting ${itemsPerPage} cars per page`);
        }
        
        if (sortMethod) {
            const [field, direction] = sortMethod.split('-');
            params.append("sortBy", field);
            params.append("sortOrder", direction);
        }
        
        // Updated: Use brandId instead of make to match backend expectations
        if (debouncedFilters.makes && debouncedFilters.makes.length > 0) {
            params.append("brandId", debouncedFilters.makes.join(","));
            console.log("CarShop: Setting brandId filter:", debouncedFilters.makes.join(","));
        }
        
        if (debouncedFilters.fuelTypes.length > 0) {
            params.append("fuelType", debouncedFilters.fuelTypes.join(","));
        }
        
        if (debouncedFilters.minPrice) {
            params.append("minPrice", debouncedFilters.minPrice);
        }
        
        if (debouncedFilters.maxPrice) {
            params.append("maxPrice", debouncedFilters.maxPrice);
        }
        
        if (debouncedFilters.searchTerm) {
            params.append("search", debouncedFilters.searchTerm); // Make sure param name matches backend
        }
        
        // Update URL parameters silently (replace: true prevents adding history entries)
        setSearchParams(params, { replace: true });
        
        if (!isOnline || !serverAvailable) {
            // Use cached data when offline - just display without filtering/sorting
            console.log("CarShop: Using cached data in offline mode");
            setLoading(false);
            const cachedData = storageUtils.safelyGetData('cachedCars', {cars: [], timestamp: null});
            if (cachedData && cachedData.cars && cachedData.cars.length > 0) {
                try {
                    // Simple display of cached data without filtering/sorting
                    // Just use pagination for simplicity
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = itemsPerPage === Infinity ? cachedData.cars.length : startIndex + itemsPerPage;
                    const simpleCars = cachedData.cars.slice(startIndex, endIndex);
                    
                    console.log(`CarShop: Retrieved ${simpleCars.length} cars from cache`);
                    console.log(`CarShop: Using ${cachedData.fromSessionCache ? 'session memory' : 'localStorage'} cache`);
                    
                    if (cachedData.compressed || cachedData.ultraCompressed || cachedData.emergency) {
                        console.log(`CarShop: Using compressed cache data (${
                            cachedData.emergency ? 'emergency mode' : 
                            cachedData.ultraCompressed ? 'ultra-compressed' : 'compressed'
                        })`);
                    }
                    
                    setCars(simpleCars);
                    setTotalPages(itemsPerPage === Infinity ? 1 : Math.ceil(cachedData.cars.length / itemsPerPage));
                } catch (error) {
                    console.error("CarShop: Error processing cached data:", error);
                    setCars([]);
                    setTotalPages(1);
                }
            } else {
                console.log("CarShop: No cached data available");
                setCars([]);
                setTotalPages(1);
            }
            clearTimeout(loadingTimeout); // Clear the timeout when we're done
        } else {
            // Enhanced debugging for API request
            console.log(`CarShop: Fetching cars with URL: ${config.API_URL}/api/cars?${params.toString()}`);
            
            axios.get(`${config.API_URL}/api/cars?${params.toString()}`)
                .then((response) => {
                    console.log("CarShop: API response received:", response.status);
                    console.log("CarShop: Response headers:", JSON.stringify(response.headers));
                    
                    if (!response.data) {
                        console.error("CarShop: No data in response");
                        throw new Error("No data in response");
                    }
                    
                    if (!response.data.cars) {
                        console.error("CarShop: No cars property in response data:", JSON.stringify(response.data));
                        throw new Error("Response missing cars property");
                    }
                    
                    console.log(`CarShop: Received ${response.data.cars.length} cars from API`);
                    if (response.data.cars.length > 0) {
                        console.log("CarShop: First car:", JSON.stringify(response.data.cars[0]));
                    }
                    
                    // Filter out any cars that are in the deletedCarsRegistry
                    const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                    const filteredCars = (response.data.cars || []).filter(
                        car => car.id != null && !deletedCarsRegistry.includes(car.id.toString())
                    );
                    
                    console.log(`CarShop: Displaying ${filteredCars.length} cars after filtering`);
                    setCars(filteredCars);
                    setTotalPages(itemsPerPage === Infinity ? 1 : response.data.totalPages || 1);
                    setLoading(false);
                      // Cache the filtered data using pagination to avoid quota issues
                    if (filteredCars.length > 100) {
                        console.log(`CarShop: Using paged caching for ${filteredCars.length} cars`);
                        storageUtils.storePagedCars(
                            filteredCars, 
                            currentPage, 
                            response.data.totalPages || 1,
                            response.data.totalCars || filteredCars.length,
                            debouncedFilters
                        );
                    } else {
                        storageUtils.safelyStoreData('cachedCars', {
                            cars: filteredCars,
                            timestamp: new Date().toISOString()
                        });
                    }
                    clearTimeout(loadingTimeout); // Clear the timeout when we're done
                })
                .catch((error) => {
                    console.error("CarShop: Error fetching cars:", error);
                    console.log("CarShop: Error message:", error.message);
                    
                    // Enhanced error logging
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        console.error(`CarShop: Server responded with status ${error.response.status}`);
                        console.error('CarShop: Response headers:', JSON.stringify(error.response.headers));
                        console.error('CarShop: Response data:', JSON.stringify(error.response.data));
                    } else if (error.request) {
                        // The request was made but no response was received
                        console.error('CarShop: No response received from server');
                        console.error('CarShop: Request details:', error.request);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.error('CarShop: Error setting up request:', error.message);
                    }
                    
                    clearTimeout(loadingTimeout); // Clear the timeout when we're done
                    
                    // Try to use cached data as fallback using improved storage utilities
                    const cachedData = storageUtils.safelyGetData('cachedCars', {cars: [], timestamp: null});
                    if (cachedData && cachedData.cars && cachedData.cars.length > 0) {
                        console.log("CarShop: Using cached data as fallback after fetch error");
                        console.log(`CarShop: Retrieved ${cachedData.cars.length} cars from cache`);
                        if (cachedData.fromSessionCache) {
                            console.log("CarShop: Using data from session memory (localStorage failed)");
                        }
                        setCars(cachedData.cars || []);
                    } else {
                        console.log("CarShop: No valid cached data available after error");
                        setCars([]);
                    }
                    
                    setTotalPages(1);
                    setLoading(false);
                    
                    // Server might be down, mark it as unavailable
                    setServerAvailable(false);
                });
        }
        
        return () => clearTimeout(loadingTimeout); // Clean up the timeout if component unmounts during fetch
    }, [currentPage, itemsPerPage, sortMethod, debouncedFilters, setSearchParams, isOnline, serverAvailable, loading]);    // Function to load more cars from the backend for infinite scroll
    const fetchInfiniteScrollCars = useCallback((pageNumber, append = false, exactCount = null) => {
        console.log(`Fetching infinite scroll cars for page: ${pageNumber}, append: ${append}`);
        setLoading(true);
        
        const params = new URLSearchParams();
        
        // Always use exactly batchSize items per batch for consistent loading
        const ITEMS_PER_BATCH = exactCount || 16;
        
        params.append("page", pageNumber.toString());
        params.append("itemsPerPage", ITEMS_PER_BATCH.toString());
        
        // Add filters from the main filters state
        if (filters.makes && filters.makes.length > 0) {
            params.append("brandId", filters.makes.join(","));
        }
        
        if (filters.fuelTypes && filters.fuelTypes.length > 0) {
            params.append("fuelType", filters.fuelTypes.join(","));
        }
        
        if (filters.minPrice) {
            params.append("minPrice", filters.minPrice);
        }
        
        if (filters.maxPrice) {
            params.append("maxPrice", filters.maxPrice);
        }
        
        if (filters.searchTerm) {
            params.append("search", filters.searchTerm);
        }
        
        // Apply sorting if present
        if (sortMethod) {
            const [field, direction] = sortMethod.split('-');
            params.append("sortBy", field);
            params.append("sortOrder", direction);
        }
        
        axios.get(`${config.API_URL}/api/cars?${params.toString()}`)
            .then((response) => {
                console.log(`API response received for infinite scroll:`, response.data);
                setLoading(false);
                
                const { cars: fetchedCars, currentPage, totalPages, totalCars } = response.data;
                
                // Cache this page of results using the new chunked approach from CacheManager
                CacheManager.cacheCarsInChunks(fetchedCars, pageNumber, append, filters, totalPages, totalCars);
                
                // Update total cars count state
                setTotalCars(totalCars);
                
                // Update component state - limit rendered cars to 500 max for performance
                setCars(prevCars => {
                    if (append && prevCars.length > 0) {
                        // Only append new cars that aren't already displayed
                        const existingIds = new Set(prevCars.map(car => car.id));
                        const newCars = fetchedCars.filter(car => !existingIds.has(car.id));
                        console.log(`Adding ${newCars.length} new unique cars to existing ${prevCars.length}`);
                        
                        // Limit total rendered cars to prevent browser crash
                        const combinedCars = [...prevCars, ...newCars];
                        if (combinedCars.length > 500) {
                            return combinedCars.slice(combinedCars.length - 500);
                        }
                        return combinedCars;
                    } else {
                        return fetchedCars;
                    }
                });
                
                // Update pagination state
                setTotalPages(totalPages);
                setTotalCars(totalCars);
                
                // Check if we've loaded all items
                if (currentPage >= totalPages) {
                    setAllItemsLoaded(true);
                }
            })
            .catch((error) => {
                console.error("Error fetching cars for infinite scroll:", error);
                setLoading(false);
            });
    }, [filters, sortMethod]);

    // Function to filter out deleted cars from the current state or cache
    const filterOutDeletedCars = useCallback(() => {
        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
        if (deletedCarsRegistry.length > 0) {
            setCars(prevCars => prevCars.filter(car => !deletedCarsRegistry.includes(car.id.toString())));
            
            // Also update cache with safe storage
            const cachedData = storageUtils.safelyGetData('cachedCars', {cars: [], timestamp: ''});
            if (cachedData && cachedData.cars) {
                cachedData.cars = cachedData.cars.filter(car => !deletedCarsRegistry.includes(car.id.toString()));
                storageUtils.safelyStoreData('cachedCars', cachedData);
            }
        }
    }, []);
    
    // Function that will be exported to the context
    const refreshCars = useCallback(() => {
        fetchCars();
        filterOutDeletedCars();
    }, [fetchCars, filterOutDeletedCars]);    // Sync offline changes when we're back online
    const syncOfflineChanges = useCallback(async () => {
        if (!isOnline || !serverAvailable) {
            console.log("Cannot sync changes - offline or server unavailable");
            return;
        }
        
        console.log("CarShop: Starting sync of offline changes");
        
        // First, check if there are any cars in the deletedCarsRegistry that 
        // need to be deleted on the server but aren't in the offline queue
        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
        const queue = getOfflineQueue();    
        
        // Find cars that are in the registry but not in any DELETE operation in the queue
        const deletedCarsToSync = deletedCarsRegistry.filter(id => 
            !queue.some(op => op.type === 'DELETE' && op.id.toString() === id.toString())
        );
        
        // Add these to the beginning of the queue for deletion
        if (deletedCarsToSync.length > 0) {
            console.log(`CarShop: Adding ${deletedCarsToSync.length} deleted cars to sync queue that weren't in the queue`);
            const newQueue = [
                ...deletedCarsToSync.map(id => ({ type: 'DELETE', id, timestamp: new Date().toISOString() })),
                ...queue
            ];
            setOfflineQueue(newQueue);
        }
        
        const updatedQueue = getOfflineQueue();
        console.log(`CarShop: Queue length: ${updatedQueue.length}`);
        
        if (updatedQueue.length === 0) {
            console.log("CarShop: No changes to sync");
            return;
        }
        
        setSyncStatus('Syncing changes...');
        
        // Prioritize and process queue: DELETE operations first, then CREATE/UPDATE
        // This prevents trying to update or reference items that should be deleted
        const deleteOperations = updatedQueue.filter(op => op.type === 'DELETE');
        const otherOperations = updatedQueue.filter(op => op.type !== 'DELETE');
        const prioritizedQueue = [...deleteOperations, ...otherOperations];
        
        console.log(`CarShop: Processing ${prioritizedQueue.length} operations (${deleteOperations.length} deletions)`);
        
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let processedIds = []; // Track which IDs we've already processed
        let successfulOperations = []; // Track successful operations
        let failedOperations = []; // Track failed operations
        
        // Process each operation independently
        for (const operation of prioritizedQueue) {
            // Skip duplicate operations on the same ID
            if (processedIds.includes(String(operation.id))) {
                console.log(`CarShop: Skipping duplicate operation on ID ${operation.id}`);
                skippedCount++;
                continue;
            }
            
            try {
                console.log(`CarShop: Processing ${operation.type} operation for ID ${operation.id}`);
                
                switch(operation.type) {
                    case 'CREATE':
                        try {
                            // For CREATE operations, we need to handle the file separately
                            const formData = new FormData();
                            Object.keys(operation.data).forEach(key => {
                                // Skip the img property if it's an object (file)
                                if (key !== 'img' || typeof operation.data[key] !== 'object') {
                                    formData.append(key, operation.data[key]);
                                }
                            });
                            
                            // If we have an image file, add it
                            if (operation.data.img && typeof operation.data.img === 'object') {
                                formData.append('image', operation.data.img);
                            }
                            
                            const createdCarResponse = await axios.post(`${config.API_URL}/api/cars`, formData, {
                                headers: {
                                    "Content-Type": "multipart/form-data",
                                }
                            });
                            
                            // Update the cached data to replace the temporary car with the real one
                            const tempId = operation.tempId;
                            if (tempId) {
                                const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                                cachedData.cars = cachedData.cars.filter(car => car.id !== tempId);
                                cachedData.cars.push(createdCarResponse.data);
                                localStorage.setItem('cachedCars', JSON.stringify(cachedData));
                            }
                            console.log(`CarShop: Created car with server ID ${createdCarResponse.data.id}`);
                            successCount++;
                            successfulOperations.push(operation);
                        } catch (error) {
                            console.error(`CarShop: Error creating car:`, error);
                            failedCount++;
                            failedOperations.push({...operation, error: error.message});
                            // Continue with next operation instead of throwing
                        }
                        break;
                    
                    case 'UPDATE':
                        try {
                            // Skip update if this ID is in deletedCarsRegistry
                            if (deletedCarsRegistry.includes(String(operation.id))) {
                                console.log(`CarShop: Skipping update for ID ${operation.id} as it's marked for deletion`);
                                skippedCount++;
                            } else {
                                await axios.put(`${config.API_URL}/api/cars/${operation.id}`, operation.data);
                                console.log(`CarShop: Updated car with ID ${operation.id}`);
                                successCount++;
                                successfulOperations.push(operation);
                                processedIds.push(String(operation.id)); // Mark as processed
                            }
                        } catch (error) {
                            // If we get a 404, the car might have been deleted by another client
                            if (error.response && error.response.status === 404) {
                                console.log(`CarShop: Car with ID ${operation.id} not found, possibly deleted`);
                                skippedCount++;
                                // Add to deletedCarsRegistry to prevent future operations on it
                                if (!deletedCarsRegistry.includes(String(operation.id))) {
                                    deletedCarsRegistry.push(String(operation.id));
                                    localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
                                }
                            } else {
                                console.error(`CarShop: Error updating car:`, error);
                                failedCount++;
                                failedOperations.push({...operation, error: error.message});
                            }
                            // Continue with next operation
                        }
                        break;
                        
                    case 'DELETE':
                        try {
                            await axios.delete(`${config.API_URL}/api/cars/${operation.id}`);
                            console.log(`CarShop: Deleted car with ID ${operation.id}`);
                            
                            // Mark this ID as processed
                            processedIds.push(String(operation.id));
                            successCount++;
                            successfulOperations.push(operation);
                            
                            // Always clean up the deletedCarsRegistry
                            const updatedRegistry = deletedCarsRegistry.filter(id => id !== String(operation.id));
                            localStorage.setItem('deletedCarsRegistry', JSON.stringify(updatedRegistry));
                        } catch (error) {
                            // If we get a 404, the car was already deleted
                            if (error.response && error.response.status === 404) {
                                console.log(`CarShop: Car with ID ${operation.id} already deleted`);
                                skippedCount++;
                                // Still remove from deletedCarsRegistry as the goal was accomplished
                                const updatedRegistry = deletedCarsRegistry.filter(id => id !== String(operation.id));
                                localStorage.setItem('deletedCarsRegistry', JSON.stringify(updatedRegistry));
                            } else {
                                console.error(`CarShop: Error deleting car:`, error);
                                failedCount++;
                                failedOperations.push({...operation, error: error.message});
                            }
                            // Continue with next operation
                        }
                        break;
                        
                    default:
                        console.warn('CarShop: Unknown operation type:', operation.type);
                        skippedCount++;
                }
            } catch (error) {
                console.error('CarShop: Failed to sync operation:', operation, error);
                failedCount++;
                failedOperations.push({...operation, error: error.message});
                // Continue with next operation
            }
        }
        
        // Remove successful and skipped operations from queue
        const remainingQueue = prioritizedQueue.filter(op => {
            // Keep operations that failed
            return failedOperations.some(failedOp => 
                failedOp.type === op.type && 
                failedOp.id === op.id &&
                failedOp.timestamp === op.timestamp
            );
        });
        
        // Update the queue in localStorage with only failed operations
        setOfflineQueue(remainingQueue);
        localStorage.setItem('offlineOperationsQueue', JSON.stringify(remainingQueue));
        
        // Display status message
        const totalAttempted = successCount + failedCount + skippedCount;
        if (failedCount > 0) {
            setSyncStatus(`Synced ${successCount} of ${totalAttempted} changes. ${failedCount} operations failed. Failed operations will be retried later.`);
            console.log(`CarShop: Sync partially succeeded, ${successCount} succeeded, ${failedCount} failed, ${skippedCount} skipped`);
            console.log(`CarShop: Failed operations:`, failedOperations);
        } else {
            setSyncStatus('All changes synced successfully!');
            setOfflineQueue([]);
            localStorage.setItem('offlineOperationsQueue', JSON.stringify([]));
            console.log('CarShop: All changes synced successfully');
        }
        
        // Remove temp-item styling from all cards after sync
        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
        cachedData.cars = cachedData.cars.map(car => ({
            ...car,
            _isTemp: remainingQueue.some(op => op.id === car.id) // Only keep temp flag for failed operations
        }));
        localStorage.setItem('cachedCars', JSON.stringify(cachedData));
        
        // Force refresh the UI to immediately update pending frames
        setCars(prevCars => prevCars.map(car => ({
            ...car,
            _isTemp: remainingQueue.some(op => op.id === car.id)
        })));
        
        // Clear status after a delay
        setTimeout(() => {
            setSyncStatus(null);
        }, 5000);
        
        // Refresh data after syncing to get updated IDs from server
        refreshCars();
    }, [isOnline, serverAvailable, refreshCars]);

    // Network status event listeners
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            checkServerAvailability();
            syncOfflineChanges();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkServerAvailability();
        
        // Set up periodic server availability checks every 30 seconds
        const intervalId = setInterval(() => {
            console.log("Performing periodic server availability check");
            checkServerAvailability();
        }, 30000);

        // Load cached data if available
        const cachedData = localStorage.getItem('cachedCars');
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setOfflineData({
                cars: parsed.cars,
                lastSyncTimestamp: parsed.timestamp
            });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId); // Clean up interval on unmount
        };
    }, [checkServerAvailability, syncOfflineChanges]);

    // Use the enhanced fetch function in place of the original where appropriate
    useEffect(() => {
        console.log("Running initial data fetch");

        // Fetch cars only when dependencies change
        fetchCars();

        // Add a failsafe timeout to prevent infinite loading
        const failsafeTimeout = setTimeout(() => {
            if (loading) {
                console.log("Failsafe: Forcing exit from loading state");
                setLoading(false);
            }
        }, 10000); // 10 seconds timeout

        return () => clearTimeout(failsafeTimeout); // Cleanup timeout
    }, [currentPage, itemsPerPage, sortMethod, debouncedFilters, isOnline, serverAvailable]);

    useEffect(() => {
        console.log("Fetching cars with current filters:", debouncedFilters);

        // Fetch cars only when debounced filters change
        fetchCars();
    }, [debouncedFilters, currentPage, itemsPerPage]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterType]: value
        }));
        setCurrentPage(1);
    };

    // Log the operations received from context
    useEffect(() => {
        console.log("CarShop: Received operations from context:", {
            deleteCar: typeof deleteCar === 'function',
            fetchCars: typeof contextFetchCars === 'function'
        });
    }, [deleteCar, contextFetchCars]);

    const updateCar = useCallback((id, updatedData) => {
        console.log(`Updating car with ID: ${id}`);
        if (isOnline && serverAvailable) {
            return axios.put(`${config.API_URL}/api/cars/${id}`, updatedData)
                .then((response) => {
                    console.log("Car updated successfully:", response.data);
                    return response.data;
                })
                .catch((error) => {
                    console.error("Error updating car:", error);
                    throw error;
                });
        } else {
            console.log("Offline mode - queuing update operation");
            addToOfflineQueue({
                type: 'UPDATE',
                id,
                data: updatedData,
            });
            return Promise.resolve({ ...updatedData, _isTemp: true });
        }
    }, [isOnline, serverAvailable]);

    // Handle WebSocket messages - move this effect earlier and fix its behavior
    useEffect(() => {
        if (!lastWebSocketMessage) return;

        const { type, data } = lastWebSocketMessage;

        switch (type) {
            case 'CAR_CREATED':
                // Add the new car to the state without re-fetching
                setCars(prevCars => [data, ...prevCars]);
                break;

            case 'CAR_UPDATED':
                // Update the car in the state
                setCars(prevCars =>
                    prevCars.map(car => (car.id === data.id ? { ...car, ...data } : car))
                );
                break;

            case 'CAR_DELETED':
                // Remove the car from the state
                setCars(prevCars => prevCars.filter(car => car.id !== data.id));
                break;

            default:
                console.warn("Unknown WebSocket message type:", type);
        }
    }, [lastWebSocketMessage]);

    const generateCar = () => {
        setLoading(true);
        
        // Use the backend endpoint to generate one car
        axios.post(`${config.API_URL}/api/cars/generate/1`)
            .then((response) => {
                console.log("Car generated successfully:", response.data);
                
                // Access the generated cars properly from the response structure
                if (response.data && response.data.generatedCars && response.data.generatedCars.length > 0) {
                    const newCar = response.data.generatedCars[0];
                    console.log("Adding newly generated car to state with ID:", newCar.id);
                    
                    // Ensure the car has a real ID - we'll use the one from the server response
                    if (!newCar.id) {
                        console.error("Generated car is missing an ID:", newCar);
                    } else {
                        // Add the new car to the beginning of the list
                        setCars(prevCars => [newCar, ...prevCars]);
                        
                        // Update the cached cars with safe storage
                        const cachedData = storageUtils.safelyGetData('cachedCars', {cars: [], timestamp: new Date().toISOString()});
                        cachedData.cars = [newCar, ...cachedData.cars];
                        storageUtils.safelyStoreData('cachedCars', cachedData);
                        
                        // Show a notification
                        setRealtimeUpdateReceived(true);
                        setTimeout(() => setRealtimeUpdateReceived(false), 3000);
                    }
                } else {
                    console.error("No new car data in response:", response.data);
                }
                
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error generating car:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        let interval;
        if (isGenerating) {
            interval = setInterval(() => {
                generateCar();
            }, 2000); // Generate a new car every 2 seconds
        }

        return () => clearInterval(interval);
    }, [isGenerating]);

    // Function to clear the deletedCarsRegistry
    const clearDeletedCarsRegistry = () => {
        localStorage.removeItem('deletedCarsRegistry');
        console.log('CarShop: Deleted cars registry cleared');
        // Refresh cars
        fetchCars();
    };
    
    // Function to clear the offline queue
    // const clearOfflineQueue = () => {
    //     localStorage.removeItem('offlineOperationsQueue');
    //     console.log('CarShop: Offline operations queue cleared');
        
    //     // Update any temporary styling on cached cars using safe methods
    //     const cachedData = storageUtils.safelyGetData('cachedCars', {cars: [], timestamp: new Date().toISOString()});
    //     if (cachedData && cachedData.cars) {
    //         cachedData.cars = cachedData.cars.map(car => ({
    //             ...car,
    //             _isTemp: false // Remove all temp flags
    //         }));
    //         storageUtils.safelyStoreData('cachedCars', cachedData);
    //     }
        
    //     // Update UI to remove temporary styling
    //     setCars(prevCars => prevCars.map(car => ({
    //         ...car,
    //         _isTemp: false
    //     })));
        
    //     // Force refresh of UI state
    //     setSyncStatus('All pending changes cleared');
    //     setTimeout(() => {
    //         setSyncStatus(null);
    //     }, 3000);
        
    //     // Return an empty array to represent the cleared queue
    //     return [];
    // };

    const toggleGeneration = () => {
        setIsGenerating((prev) => !prev);
    };

    // Watch for server availability changes and trigger sync if needed
    useEffect(() => {
        // Don't try to sync on initial load, only when serverAvailable changes from false to true
        if (isOnline && serverAvailable) {
            const queue = getOfflineQueue();
            if (queue && queue.length > 0) {
                console.log(`CarShop: Server is now available with ${queue.length} pending operations in queue`);
                // Small timeout to ensure all state updates are complete
                const timeoutId = setTimeout(() => {
                    if (typeof syncOfflineChanges === 'function') {
                        syncOfflineChanges();
                    } else {
                        console.error("syncOfflineChanges is not a function yet");
                    }
                }, 500);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [isOnline, serverAvailable]);

    // Function to test delete operations with detailed logging
    const testDeleteOperation = async (id, forceMode = null) => {
        if (!id) {
            const randomCar = cars[Math.floor(Math.random() * cars.length)];
            id = randomCar ? randomCar.id : null;
            if (!id) {
                setLastDeleteResult({
                    success: false,
                    message: "No cars available to test deletion",
                    timestamp: new Date().toISOString()
                });
                return;
            }
        }
        
        console.log(`CarShop: Testing delete operation for car ID ${id} with forceMode=${forceMode}`);
        
        // Track the current online/server state
        const currentOnlineState = isOnline;
        const currentServerState = serverAvailable;
        
        try {
            // If forceMode is specified, override the current state temporarily
            if (forceMode === 'online') {
                console.log("CarShop: Forcing ONLINE mode for this test");
                // We're not changing the actual state variables to avoid re-renders
                // Instead, we'll override inside the local test function
                
                // Check with direct server call to verify it's truly available
                const serverCheck = await axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`);
                console.log("CarShop: Direct server check result:", serverCheck.status);
            } else if (forceMode === 'offline') {
                console.log("CarShop: Forcing OFFLINE mode for this test");
            }
            
            // Use the context's deleteCar function directly
            console.log(`CarShop: Calling deleteCar with ID=${id}`);
            const result = await deleteCar(id);
            
            console.log("CarShop: Delete operation result:", result);
            
            // Check if the car was actually deleted from the server
            let serverVerification = "Not checked";
            if (currentOnlineState && currentServerState) {
                try {
                    // Try to fetch the car to see if it's really deleted
                    await axios.get(`${config.API_URL}/api/cars/${id}`);
                    // If we get here, the car still exists on the server
                    serverVerification = "Failed - Car still exists on server";
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        // 404 means the car is gone, which is what we want
                        serverVerification = "Success - Car confirmed deleted on server";
                    } else {
                        serverVerification = `Error checking - ${error.message}`;
                    }
                }
            }
            
            // Check if car is in the offline queue
            const offlineQueue = getOfflineQueue();
            const inQueue = offlineQueue.some(op => 
                op.type === 'DELETE' && op.id.toString() === id.toString()
            );
            
            // Check if car ID is in the deletedCarsRegistry
            const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
            const inRegistry = deletedCarsRegistry.includes(id.toString());
            
            setLastDeleteResult({
                success: true,
                id,
                result,
                timestamp: new Date().toISOString(),
                networkState: {
                    online: currentOnlineState,
                    serverAvailable: currentServerState,
                    forceMode
                },
                serverVerification,
                offlineStatus: {
                    inQueue,
                    inRegistry
                }
            });
            
            // Refresh UI to reflect changes
            refreshCars();
            
        } catch (error) {
            console.error("CarShop: Error in test delete operation:", error);
            setLastDeleteResult({
                success: false,
                id,
                error: error.message,
                timestamp: new Date().toISOString(),
                networkState: {
                    online: currentOnlineState,
                    serverAvailable: currentServerState,
                    forceMode
                }
            });
        }
    };

    return (
        <div>
                <Cover />
                <div className="content">
                    <Sidebar 
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        disabled={!isOnline || !serverAvailable}
                    />                    <div className="generatebuttoncontainer">
                        <button className="generatebutton" onClick={toggleGeneration}>
                            {isGenerating ? "Stop Generating Cars" : "Start Generating Cars"}
                        </button>

                                <div>
                                    <div style={{
                                        padding: '5px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        marginBottom: '10px',
                                        backgroundColor: '#fff'
                                    }}>
                                        <div><strong>Network Status:</strong> {isOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}</div>
                                        <div><strong>Server Status:</strong> {serverAvailable ? "🟢 AVAILABLE" : "🔴 UNAVAILABLE"}</div>
                                        <div><strong>Last Check:</strong> {lastServerCheck ? 
                                            new Date(lastServerCheck).toLocaleTimeString() : 'Never'}</div>
                                    </div>
                                    
                                    <div style={{display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap'}}>
                                        <button 
                                            onClick={() => {
                                                setServerAvailable(true);
                                                setIsOnline(true);
                                                console.log("Forced online status: ONLINE, server: AVAILABLE");
                                                setLastServerCheck(new Date().toISOString());
                                            }}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Force Online Mode
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setServerAvailable(false);
                                                console.log("Forced offline server status");
                                                setLastServerCheck(new Date().toISOString());
                                            }}                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#F44336',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Force Offline Mode
                                        </button>
                                        <button
                                            onClick={checkServerAvailability}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#2196F3',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Check Server Now
                                        </button>
                                    </div>
                                      <div style={{marginTop: '15px'}}>
                                        <h4 style={{margin: '0 0 8px 0'}}>Test Delete Operation</h4>
                                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                            <button
                                                onClick={() => testDeleteOperation(null, null)}
                                                style={{
                                                    padding: '5px 10px',
                                                    border: '1px solid #2196F3',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#fff',
                                                    color: '#2196F3'
                                                }}
                                            >
                                                Test Delete (Normal)
                                            </button>
                                            <button
                                                onClick={() => testDeleteOperation(null, 'online')}
                                                style={{
                                                    padding: '5px 10px',
                                                    border: '1px solid #4CAF50',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#fff',
                                                    color: '#4CAF50'
                                                }}
                                            >
                                                Test Delete (Force Online)
                                            </button>
                                        </div>
                                    </div>
                                            Force Offline Mode
                                        </button>
                                        <button 
                                            onClick={checkServerAvailability}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#2196F3',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Check Server Now
                                        </button>
                                    </div>

                                    {debugPanelExpanded && (
                                        <div>
                                            <h4>Delete Operation Tester</h4>
                                            <div style={{marginBottom: '10px'}}>
                                                <button 
                                                    onClick={() => {
                                                        // Find the first car ID to test with
                                                        if (cars.length > 0) {
                                                            const testId = cars[0].id;
                                                            console.log(`Testing delete operation with ID: ${testId}`);
                                                            
                                                            // Call delete and track the result
                                                            deleteCar(testId)
                                                                .then(result => {
                                                                    console.log("Delete result:", result);
                                                                    setLastDeleteResult({
                                                                        timestamp: new Date().toISOString(),
                                                                        id: testId,
                                                                        success: true,
                                                                        result
                                                                    });
                                                                    // Refresh car list
                                                                    fetchCars();
                                                                })
                                                                .catch(error => {
                                                                    console.error("Delete failed:", error);
                                                                    setLastDeleteResult({
                                                                        timestamp: new Date().toISOString(),
                                                                        id: testId,
                                                                        success: false,
                                                                        error: error.message
                                                                    });
                                                                });
                                                        } else {
                                                            console.log("No cars available for delete test");
                                                            setLastDeleteResult({
                                                                timestamp: new Date().toISOString(),
                                                                error: "No cars available for testing"
                                                            });
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#FF9800',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                    disabled={cars.length === 0}
                                                >
                                                    Test Delete (First Car)
                                                </button>
                                            </div>
                                            
                                            {lastDeleteResult && (
                                                <div style={{
                                                    padding: '10px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: lastDeleteResult.success ? '#E8F5E9' : '#FFEBEE'
                                                }}>
                                                    <h5 style={{margin: '0 0 5px 0'}}>Last Delete Operation</h5>
                                                    <div><strong>Time:</strong> {new Date(lastDeleteResult.timestamp).toLocaleTimeString()}</div>
                                                    <div><strong>Car ID:</strong> {lastDeleteResult.id}</div>
                                                    <div><strong>Result:</strong> {lastDeleteResult.success ? 'Success' : 'Failed'}</div>
                                                    {lastDeleteResult.error && (
                                                        <div><strong>Error:</strong> {lastDeleteResult.error}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="main-content">
                {/* Real-time update notification */}
                {realtimeUpdateReceived && (
                    <div className="realtime-notification">
                        Real-time update received! 
                    </div>
                )}
                
                    <CarList 
                        cars={cars}
                        loading={loading}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        totalCars={totalCars} // Add this prop
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        sortMethod={sortMethod}
                        setSortMethod={setSortMethod}
                        isOffline={!isOnline || !serverAvailable}
                        createCar={carOperations.createCar}
                        updateCar={carOperations.updateCar}
                        deleteCar={carOperations.deleteCar}
                        disableSortAndFilter={!isOnline || !serverAvailable}
                        fetchInfiniteScrollCars={fetchInfiniteScrollCars}
                    />
                    <br></br>
                    
                    <Charts />
                </div>
            </div>
            {process.env.NODE_ENV === 'development' && (
    <div style={{
        position: 'fixed',
        bottom: debugPanelExpanded ? '20px' : '-500px', 
        right: '20px',
        width: '550px',
        backgroundColor: 'rgba(240, 240, 240, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        transition: 'bottom 0.3s ease-in-out',
        zIndex: 1000,
        maxHeight: '80vh',
        overflow: 'auto'
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
        }}>
            <h3 style={{ margin: 0 }}>Debug Panel</h3>
            <button 
                onClick={() => setDebugPanelExpanded(!debugPanelExpanded)}
                style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '0',
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '8px 8px 0 0',
                    padding: '8px 15px'
                }}
            >
                {debugPanelExpanded ? 'Hide' : 'Show'} Debug
            </button>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
            <h4>Network Status</h4>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div>
                    <strong>Browser Status:</strong>{' '}
                    <span style={{ color: isOnline ? 'green' : 'red' }}>
                        {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                    </span>
                </div>
                <div>
                    <strong>Server Status:</strong>{' '}
                    <span style={{ color: serverAvailable ? 'green' : 'red' }}>
                        {serverAvailable ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}
                    </span>
                </div>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Last check: {lastServerCheck ? new Date(lastServerCheck).toLocaleTimeString() : 'Never'}
            </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
            <h4>Test Delete Operations</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button 
                    onClick={() => testDeleteOperation(null, null)}
                    style={{ padding: '5px 10px' }}
                >
                    Test Delete (Normal)
                </button>
                <button 
                    onClick={() => testDeleteOperation(null, 'online')}
                    style={{ padding: '5px 10px' }}
                >
                    Test Delete (Force Online)
                </button>
                <button 
                    onClick={() => testDeleteOperation(null, 'offline')}
                    style={{ padding: '5px 10px' }}
                >
                    Test Delete (Force Offline)
                </button>
            </div>
            
            <div style={{ marginTop: '10px' }}>
                <label>
                    <span style={{ marginRight: '5px' }}>Test with specific ID:</span>
                    <input 
                        type="text" 
                        placeholder="Car ID" 
                        style={{ width: '80px', marginRight: '10px' }}
                        id="debugDeleteId"
                    />
                </label>
                <button 
                    onClick={() => {
                        const id = document.getElementById('debugDeleteId').value;
                        if (id) testDeleteOperation(id);
                    }}
                    style={{ padding: '5px 10px' }}
                >
                    Delete by ID
                </button>
            </div>
            
            {lastDeleteResult && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '5px',
                    backgroundColor: lastDeleteResult.success ? '#e6f7e6' : '#ffebeb' 
                }}>
                    <h5 style={{ margin: '0 0 5px 0' }}>Last Delete Operation Result:</h5>
                    <div style={{ fontSize: '13px' }}>
                        <div><strong>Time:</strong> {new Date(lastDeleteResult.timestamp).toLocaleTimeString()}</div>
                        <div><strong>Status:</strong> {lastDeleteResult.success ? 'Success' : 'Failed'}</div>
                        {lastDeleteResult.id && <div><strong>Car ID:</strong> {lastDeleteResult.id}</div>}
                        {lastDeleteResult.networkState && (
                            <div>
                                <strong>Network:</strong> {lastDeleteResult.networkState.online ? 'Online' : 'Offline'}, 
                                Server: {lastDeleteResult.networkState.serverAvailable ? 'Available' : 'Unavailable'}
                                {lastDeleteResult.networkState.forceMode && 
                                    ` (Forced: ${lastDeleteResult.networkState.forceMode})`}
                            </div>
                        )}
                        {lastDeleteResult.serverVerification && (
                            <div><strong>Verification:</strong> {lastDeleteResult.serverVerification}</div>
                        )}
                        {lastDeleteResult.offlineStatus && (
                            <div>
                                <strong>Offline Status:</strong> 
                                {lastDeleteResult.offlineStatus.inQueue ? ' In queue,' : ' Not in queue,'}
                                {lastDeleteResult.offlineStatus.inRegistry ? ' In registry' : ' Not in registry'}
                            </div>
                        )}
                        {lastDeleteResult.error && <div><strong>Error:</strong> {lastDeleteResult.error}</div>}
                    </div>
                </div>
            )}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
            <h4>Offline Operations</h4>
            <div>
                <button onClick={checkServerAvailability} style={{ marginRight: '10px' }}>
                    Check Server Now
                </button>
                <button onClick={syncOfflineChanges} style={{ marginRight: '10px' }}>
                    Sync Now
                </button>
            </div>
            
            <div style={{ marginTop: '10px' }}>
                <h5 style={{ margin: '0 0 5px 0' }}>Queue Status:</h5>
                {(() => {
                    const queue = getOfflineQueue();
                    if (queue.length === 0) return <div>Queue is empty</div>;
                    
                    return (
                        <>
                            <div>{queue.length} operations pending</div>
                            <details>
                                <summary>View queue details</summary>
                                <pre style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                                    {JSON.stringify(queue, null, 2)}
                                </pre>
                            </details>
                        </>
                    );
                })()}
            </div>
            
            <div style={{ marginTop: '10px' }}>
                <h5 style={{ margin: '0 0 5px 0' }}>Deleted Cars Registry:</h5>
                {(() => {
                    const registry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                    if (registry.length === 0) return <div>Registry is empty</div>;
                    
                    return (
                        <>
                            <div>{registry.length} cars marked as deleted</div>
                            <details>
                                <summary>View registry details</summary>
                                <pre style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                                    {JSON.stringify(registry, null, 2)}
                                </pre>
                            </details>
                        </>
                    );
                })()}
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default CarShop;
