// filepath: d:\Faculty\MPP\CarShopFrontend\src\CarShop.jsx
// CarShop.jsx
import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
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
// ... rest of storage utils code ...

// Helper function to get offline queue
const getOfflineQueue = () => {
    const queue = localStorage.getItem('offlineOperationsQueue');
    return queue ? JSON.parse(queue) : [];
};

// Helper function to set offline queue
const setOfflineQueue = (queue) => {
    localStorage.setItem('offlineOperationsQueue', JSON.stringify(queue));
};

// Helper function to add to offline queue
const addToOfflineQueue = (operation) => {
    const queue = getOfflineQueue();
    queue.push({
        ...operation,
        timestamp: new Date().toISOString()
    });
    setOfflineQueue(queue);
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
        lastSyncTimestamp: null
    });
    const [realtimeUpdateReceived, setRealtimeUpdateReceived] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [totalCars, setTotalCars] = useState(0);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    const [debugPanelExpanded, setDebugPanelExpanded] = useState(false);
    const [lastServerCheck, setLastServerCheck] = useState(null);    const [lastDeleteResult, setLastDeleteResult] = useState(null);
    const lastAvailable = useRef(false);
    
    // Consolidated filter state
    const [filters, setFilters] = useState({
        makes: [],
        fuelTypes: [],
        minPrice: '',
        maxPrice: '',
        searchTerm: ''
    });
    
    // Increase debounce time to reduce requests during typing
    const debouncedFilters = useDebounce(filters, 500);
    
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
    const [itemsPerPage, setItemsPerPage] = useState(searchParams.get("itemsPerPage") ? 
        parseInt(searchParams.get("itemsPerPage")) : 8);
    const [sortMethod, setSortMethod] = useState('');
    
    // Check if server is available
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
                    localStorage.setItem('cachedCars', JSON.stringify({
                        cars: cars,
                        timestamp: new Date().toISOString()
                    }));
                }
            });
    }, [cars, serverAvailable, isOnline]);    // Memoize fetchCars to prevent unnecessary re-creation
    const fetchCars = useCallback(() => {
        if (loading) return; // Prevent concurrent fetches
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
        
        // For unlimited option, use a reasonable limit
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
        
        if (debouncedFilters.makes && debouncedFilters.makes.length > 0) {
            // Convert brand IDs to brand names for backend compatibility
            const brandNames = debouncedFilters.makes.map(brandId => {
                const brand = brands.find(b => b.id === parseInt(brandId));
                return brand ? brand.name : null;
            }).filter(Boolean);
            
            if (brandNames.length > 0) {
                params.append("make", brandNames.join(","));
            }
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
            const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[], "timestamp":null}');
            if (cachedData && cachedData.cars && cachedData.cars.length > 0) {
                try {
                    // Simple display of cached data without filtering/sorting
                    // Just use pagination for simplicity
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = itemsPerPage === Infinity ? cachedData.cars.length : startIndex + itemsPerPage;
                    const simpleCars = cachedData.cars.slice(startIndex, endIndex);
                    
                    console.log(`CarShop: Retrieved ${simpleCars.length} cars from cache`);
                    
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
                    
                    if (!response.data) {
                        console.error("CarShop: No data in response");
                        throw new Error("No data in response");
                    }
                    
                    if (!response.data.cars) {
                        console.error("CarShop: No cars property in response data:", JSON.stringify(response.data));
                        throw new Error("Response missing cars property");
                    }
                    
                    console.log(`CarShop: Received ${response.data.cars.length} cars from API`);
                    
                    // Filter out any cars that are in the deletedCarsRegistry
                    const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                    const filteredCars = (response.data.cars || []).filter(
                        car => car.id != null && !deletedCarsRegistry.includes(car.id.toString())
                    );
                    
                    console.log(`CarShop: Displaying ${filteredCars.length} cars after filtering`);
                    setCars(filteredCars);
                    setTotalPages(itemsPerPage === Infinity ? 1 : response.data.totalPages || 1);
                    setLoading(false);
                    
                    // Cache the filtered data
                    localStorage.setItem('cachedCars', JSON.stringify({
                        cars: filteredCars,
                        timestamp: new Date().toISOString()
                    }));
                    
                    clearTimeout(loadingTimeout); // Clear the timeout when we're done
                })
                .catch((error) => {
                    console.error("CarShop: Error fetching cars:", error);
                    console.log("CarShop: Error message:", error.message);
                    
                    clearTimeout(loadingTimeout); // Clear the timeout when we're done
                    
                    // Try to use cached data as fallback
                    const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[], "timestamp":null}');
                    if (cachedData && cachedData.cars && cachedData.cars.length > 0) {
                        console.log("CarShop: Using cached data as fallback after fetch error");
                        console.log(`CarShop: Retrieved ${cachedData.cars.length} cars from cache`);
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
    }, [
        currentPage,
        itemsPerPage,
        sortMethod,
        debouncedFilters,
        isOnline,
        serverAvailable,
        setSearchParams,
        loading
    ]);

    // Function to load more cars from the backend for infinite scroll
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
                
                // Cache this page of results
                if (typeof CacheManager !== 'undefined' && CacheManager.cacheCarsInChunks) {
                    CacheManager.cacheCarsInChunks(fetchedCars, pageNumber, append, filters, totalPages, totalCars);
                }
                
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
            
            // Also update cache
            const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[], "timestamp":null}');
            if (cachedData && cachedData.cars) {
                cachedData.cars = cachedData.cars.filter(car => !deletedCarsRegistry.includes(car.id.toString()));
                localStorage.setItem('cachedCars', JSON.stringify(cachedData));
            }
        }
    }, []);
    
    // Function that will be exported to the context
    const refreshCars = useCallback(() => {
        fetchCars();
        filterOutDeletedCars();
    }, [fetchCars, filterOutDeletedCars]);

    // Sync offline changes when we're back online
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
                        // CREATE logic would go here
                        break;
                    
                    case 'UPDATE':
                        // UPDATE logic would go here
                        break;
                          case 'DELETE':
                        try {
                            // Use the global authToken utility
                            const token = localStorage.getItem('authToken');
                            if (token) {
                                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                            }
                            
                            await axios.delete(`${config.API_URL}/api/cars/${operation.id}`);
                            console.log(`CarShop: Successfully deleted car with ID: ${operation.id}`);
                            successCount++;
                            processedIds.push(String(operation.id));
                            successfulOperations.push(operation);
                        } catch (error) {
                            console.error(`CarShop: Error deleting car ${operation.id}:`, error);
                            
                            if (error.response && error.response.status === 404) {
                                console.log(`CarShop: Car ${operation.id} not found on server - considering delete successful`);
                                successCount++;
                                processedIds.push(String(operation.id));
                                successfulOperations.push(operation);
                            } else {
                                failedCount++;
                                failedOperations.push({...operation, error: error.message});
                            }
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
        if (cachedData && cachedData.cars) {
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
        }
        
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
        };    }, [checkServerAvailability]);    

    // Watch for server availability changes and trigger sync if needed    
    useEffect(() => {
        if (isOnline && serverAvailable && !lastAvailable.current) {
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
        lastAvailable.current = serverAvailable;
    }, [isOnline, serverAvailable, syncOfflineChanges]);

    // Add failsafe loading timeout
useEffect(() => {
    if (loading) {
        const failsafeTimeout = setTimeout(() => {
            if (loading) {
                console.log("Failsafe: Forcing exit from loading state");
                setLoading(false);
            }
        }, 10000); // 10 seconds timeout

        return () => clearTimeout(failsafeTimeout); // Cleanup timeout
    }
}, [loading]);

// Main effect to fetch cars when dependencies change
useEffect(() => {
    console.log("Data parameters changed, fetching cars with:", {
        page: currentPage,
        itemsPerPage,
        sortMethod,
        filters: debouncedFilters
    });
    fetchCars();
}, [currentPage, itemsPerPage, sortMethod, debouncedFilters]);

// Handle filter changes
const handleFilterChange = (filterType, value) => {
    console.log(`Filter change: ${filterType} = ${value}`);
    setFilters(prevFilters => ({
        ...prevFilters,
        [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
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
                    return response;
                })
                .catch((error) => {
                    return Promise.reject(error);
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
    }, [isOnline, serverAvailable]);    // Handle WebSocket messages
    useEffect(() => {
        if (!lastWebSocketMessage) return;

        const { type, data } = lastWebSocketMessage;

        switch (type) {
            case 'CAR_CREATED':
                console.log('WebSocket: Car created:', data);
                // Add the new car to the state without re-fetching
                setCars(prevCars => [data, ...prevCars]);
                break;

            case 'CAR_UPDATED':
                console.log('WebSocket: Car updated:', data);
                // Update the car in the state
                setCars(prevCars =>
                    prevCars.map(car => (car.id === data.id ? { ...car, ...data } : car))
                );
                break;

            case 'CAR_DELETED':
                console.log('WebSocket: Car deleted:', data);
                // Remove the car from the state immediately
                setCars(prevCars => prevCars.filter(car => car.id !== data.id));
                
                // Also remove from deletedCarsRegistry if it exists there
                const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                const updatedRegistry = deletedCarsRegistry.filter(id => id !== data.id.toString());
                localStorage.setItem('deletedCarsRegistry', JSON.stringify(updatedRegistry));
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
                      // Ensure the car has a real ID
                    if (!newCar.id) {
                        console.error("Generated car missing ID:", newCar);
                    } else {
                        // Add the new car to the beginning of the list (like WebSocket CAR_CREATED)
                        setCars(prevCars => [newCar, ...prevCars]);
                        
                        // Update the cached cars
                        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[], "timestamp":null}');
                        cachedData.cars = [newCar, ...cachedData.cars];
                        cachedData.timestamp = new Date().toISOString();
                        localStorage.setItem('cachedCars', JSON.stringify(cachedData));
                        
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

    const toggleGeneration = () => {
        setIsGenerating((prev) => !prev);
    };

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
                />
                <div className="generatebuttoncontainer">
                    <button className="generatebutton" onClick={toggleGeneration}>
                        {isGenerating ? "Stop Generating Cars" : "Start Generating Cars"}
                    </button>
                </div>
                <div className="main-content">
                    {syncStatus && (
                        <div className="sync-status-notification">
                            {syncStatus}
                        </div>
                    )}
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
                        totalCars={totalCars}
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
                    <br />
                    
                    <Charts />
                </div>
            </div>
            
            {/* Use our custom DebugPanel component */}
            <DebugPanel 
                isOnline={isOnline}
                serverAvailable={serverAvailable}
                lastServerCheck={lastServerCheck}
                setIsOnline={setIsOnline}
                setServerAvailable={setServerAvailable}
                setLastServerCheck={setLastServerCheck}
                checkServerAvailability={checkServerAvailability}
                syncOfflineChanges={syncOfflineChanges}
                cars={cars}
                deleteCar={deleteCar}
                refreshCars={refreshCars}
            />
        </div>
    );
};

export default CarShop;
