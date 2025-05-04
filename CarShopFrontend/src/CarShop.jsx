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

// Queue for storing offline operations
const getOfflineQueue = () => {
    const queue = localStorage.getItem('offlineOperationsQueue');
    return queue ? JSON.parse(queue) : [];
};

const setOfflineQueue = (queue) => {
    localStorage.setItem('offlineOperationsQueue', JSON.stringify(queue));
};

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
        parseInt(searchParams.get("itemsPerPage")) : Infinity);
    const [sortMethod, setSortMethod] = useState('');
    
    // Check if server is available
    const checkServerAvailability = useCallback(() => {
        axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`)
            .then(() => {
                setServerAvailable(true);
            })
            .catch((error) => {
                console.error("Server unavailable:", error);
                setServerAvailable(false);
                // Cache the current data for offline use if we're going offline
                if (cars.length > 0) {
                    localStorage.setItem('cachedCars', JSON.stringify({
                        cars: cars,
                        timestamp: new Date().toISOString()
                    }));
                }
            });
    }, [cars]);

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
        
        // For unlimited option, use -1 as itemsPerPage
        if (itemsPerPage === Infinity) {
            params.append("itemsPerPage", "-1");
            console.log("CarShop: Requesting unlimited cars");
        } else {
            params.append("itemsPerPage", itemsPerPage.toString());
            console.log(`CarShop: Requesting ${itemsPerPage} cars per page`);
        }
        
        if (sortMethod) {
            const [field, direction] = sortMethod.split('-');
            params.append("sortBy", field);
            params.append("sortOrder", direction);
        }
        
        if (debouncedFilters.makes.length > 0) {
            params.append("make", debouncedFilters.makes.join(","));
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
            const cachedData = localStorage.getItem('cachedCars');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    
                    // Simple display of cached data without filtering/sorting
                    // Just use pagination for simplicity
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = itemsPerPage === Infinity ? parsed.cars.length : startIndex + itemsPerPage;
                    const simpleCars = parsed.cars.slice(startIndex, endIndex);
                    
                    console.log(`CarShop: Retrieved ${simpleCars.length} cars from cache`);
                    setCars(simpleCars);
                    setTotalPages(itemsPerPage === Infinity ? 1 : Math.ceil(parsed.cars.length / itemsPerPage));
                } catch (error) {
                    console.error("CarShop: Error parsing cached data:", error);
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
                    
                    // Try to use cached data as fallback
                    const cachedData = localStorage.getItem('cachedCars');
                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            console.log("CarShop: Using cached data as fallback after fetch error");
                            setCars(parsed.cars || []);
                        } catch (parseError) {
                            console.error("CarShop: Error parsing cached data:", parseError);
                            setCars([]);
                        }
                    } else {
                        setCars([]);
                    }
                    
                    setTotalPages(1);
                    setLoading(false);
                    
                    // Server might be down, mark it as unavailable
                    setServerAvailable(false);
                });
        }
        
        return () => clearTimeout(loadingTimeout); // Clean up the timeout if component unmounts during fetch
    }, [currentPage, itemsPerPage, sortMethod, debouncedFilters, setSearchParams, isOnline, serverAvailable, loading]);

    // Function to load more cars from the backend for infinite scroll
    const fetchInfiniteScrollCars = useCallback((pageNumber, append = false) => {
        console.log("Fetching infinite scroll cars for page:", pageNumber);
        setLoading(true);
        
        const params = new URLSearchParams();
        
        // Always fetch 4 items per page for infinite scroll
        params.append("page", pageNumber.toString());
        params.append("itemsPerPage", "4"); // Fixed size for infinite scroll batches
        
        if (sortMethod) {
            const [field, direction] = sortMethod.split('-');
            params.append("sortBy", field);
            params.append("sortOrder", direction);
        }
        
        if (debouncedFilters.makes.length > 0) {
            params.append("make", debouncedFilters.makes.join(","));
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
            params.append("search", debouncedFilters.searchTerm);
        }
        
        // Don't update URL params for infinite scroll requests
        // setSearchParams(params, { replace: true });
        
        if (!isOnline || !serverAvailable) {
            // Offline mode handling for infinite scroll
            console.log("Using cached data in offline mode for infinite scroll");
            setLoading(false);
            const cachedData = localStorage.getItem('cachedCars');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    const startIndex = (pageNumber - 1) * 4; // 4 items per page
                    const endIndex = startIndex + 4;
                    const pageCars = parsed.cars.slice(startIndex, endIndex);
                    
                    console.log(`Retrieved ${pageCars.length} cars from cache for infinite scroll`);
                    
                    setCars(prevCars => {
                        if (append && prevCars.length > 0) {
                            // Only append new cars that aren't already displayed
                            const existingIds = new Set(prevCars.map(car => car.id));
                            const newCars = pageCars.filter(car => !existingIds.has(car.id));
                            return [...prevCars, ...newCars];
                        } else {
                            return pageCars;
                        }
                    });
                    
                    setTotalPages(Math.ceil(parsed.cars.length / 4));
                } catch (error) {
                    console.error("Error parsing cached data:", error);
                    if (!append) {
                        setCars([]);
                        setTotalPages(1);
                    }
                }
            } else {
                console.log("No cached data available");
                if (!append) {
                    setCars([]);
                    setTotalPages(1);
                }
            }
        } else {
            console.log(`Fetching infinite scroll cars with params: ${params.toString()}`);
            
            axios.get(`${config.API_URL}/api/cars?${params.toString()}`)
                .then((response) => {
                    console.log("API response received for infinite scroll:", response.data);
                    const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                    const filteredCars = (response.data.cars || []).filter(
                        car => !deletedCarsRegistry.includes(car.id.toString())
                    );
                    
                    console.log(`Received ${filteredCars.length} new cars for infinite scroll`);
                    
                    setCars(prevCars => {
                        if (append && prevCars.length > 0) {
                            // Only append new cars that aren't already displayed
                            const existingIds = new Set(prevCars.map(car => car.id));
                            const newCars = filteredCars.filter(car => !existingIds.has(car.id));
                            return [...prevCars, ...newCars];
                        } else {
                            return filteredCars;
                        }
                    });
                    
                    setTotalPages(response.data.totalPages || 1);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching cars for infinite scroll:", error);
                    setLoading(false);
                });
        }
    }, [sortMethod, debouncedFilters, isOnline, serverAvailable]);

    // Function to filter out deleted cars from the current state or cache
    const filterOutDeletedCars = useCallback(() => {
        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
        if (deletedCarsRegistry.length > 0) {
            setCars(prevCars => prevCars.filter(car => !deletedCarsRegistry.includes(car.id.toString())));
            
            // Also update cache
            const cachedData = localStorage.getItem('cachedCars');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                parsed.cars = parsed.cars.filter(car => !deletedCarsRegistry.includes(car.id.toString()));
                localStorage.setItem('cachedCars', JSON.stringify(parsed));
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
        if (!isOnline || !serverAvailable) return;
        
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
        
        let failed = false;
        let completedOperations = 0;
        let processedIds = []; // Track which IDs we've already processed
        
        // Process queue in order with improved error handling
        for (const operation of prioritizedQueue) {
            // Skip duplicate operations on the same ID
            if (processedIds.includes(String(operation.id))) {
                console.log(`CarShop: Skipping duplicate operation on ID ${operation.id}`);
                completedOperations++;
                continue;
            }
            
            try {
                console.log(`CarShop: Processing ${operation.type} operation for ID ${operation.id}`);
                
                switch(operation.type) {
                    case 'CREATE':
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
                        
                        try {
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
                        } catch (error) {
                            console.error(`CarShop: Error creating car:`, error);
                            throw error;
                        }
                        break;
                    
                    case 'UPDATE':
                        // Skip update if this ID is in deletedCarsRegistry
                        if (deletedCarsRegistry.includes(String(operation.id))) {
                            console.log(`CarShop: Skipping update for ID ${operation.id} as it's marked for deletion`);
                        } else {
                            try {
                                await axios.put(`${config.API_URL}/api/cars/${operation.id}`, operation.data);
                                console.log(`CarShop: Updated car with ID ${operation.id}`);
                            } catch (error) {
                                // If we get a 404, the car might have been deleted by another client
                                if (error.response && error.response.status === 404) {
                                    console.log(`CarShop: Car with ID ${operation.id} not found, possibly deleted`);
                                    // Add to deletedCarsRegistry to prevent future operations on it
                                    if (!deletedCarsRegistry.includes(String(operation.id))) {
                                        deletedCarsRegistry.push(String(operation.id));
                                        localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
                                    }
                                } else {
                                    console.error(`CarShop: Error updating car:`, error);
                                    throw error;
                                }
                            }
                        }
                        break;
                        
                    case 'DELETE':
                        try {
                            await axios.delete(`${config.API_URL}/api/cars/${operation.id}`);
                            console.log(`CarShop: Deleted car with ID ${operation.id}`);
                            
                            // Mark this ID as processed
                            processedIds.push(String(operation.id));
                            
                            // Always clean up the deletedCarsRegistry
                            const updatedRegistry = deletedCarsRegistry.filter(id => id !== String(operation.id));
                            localStorage.setItem('deletedCarsRegistry', JSON.stringify(updatedRegistry));
                        } catch (error) {
                            // If we get a 404, the car was already deleted
                            if (error.response && error.response.status === 404) {
                                console.log(`CarShop: Car with ID ${operation.id} already deleted`);
                                // Still remove from deletedCarsRegistry as the goal was accomplished
                                const updatedRegistry = deletedCarsRegistry.filter(id => id !== String(operation.id));
                                localStorage.setItem('deletedCarsRegistry', JSON.stringify(updatedRegistry));
                            } else {
                                console.error(`CarShop: Error deleting car:`, error);
                                throw error;
                            }
                        }
                        break;
                        
                    default:
                        console.warn('CarShop: Unknown operation type:', operation.type);
                }
                completedOperations++;
            } catch (error) {
                console.error('CarShop: Failed to sync operation:', operation, error);
                
                // Only count non-404 errors as failures that should stop the sync
                if (!(error.response && error.response.status === 404 && operation.type === 'DELETE')) {
                    failed = true;
                    break;
                } else {
                    // For 404 on DELETE, we'll count it as completed
                    completedOperations++;
                }
            }
        }
        
        // Remove processed operations from queue
        if (completedOperations > 0) {
            const remainingQueue = updatedQueue.slice(completedOperations);
            setOfflineQueue(remainingQueue);
            
            // Update the queue in localStorage
            localStorage.setItem('offlineOperationsQueue', JSON.stringify(remainingQueue));
            console.log(`CarShop: Removed ${completedOperations} completed operations from queue`);
        }
        
        if (failed) {
            setSyncStatus(`Synced ${completedOperations} of ${updatedQueue.length} changes. Some operations failed.`);
            console.log(`CarShop: Sync partially failed, completed ${completedOperations} of ${updatedQueue.length}`);
        } else if (completedOperations === updatedQueue.length) {
            setSyncStatus('All changes synced successfully!');
            setOfflineQueue([]);
            
            // Explicitly clear the queue in localStorage 
            localStorage.setItem('offlineOperationsQueue', JSON.stringify([]));
            console.log('CarShop: All changes synced successfully');
            
            // Remove temp-item styling from all cards after sync
            const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
            cachedData.cars = cachedData.cars.map(car => ({
                ...car,
                _isTemp: false // Remove the temp flag
            }));
            localStorage.setItem('cachedCars', JSON.stringify(cachedData));
            
            // Force refresh the UI to immediately remove pending frames
            setCars(prevCars => prevCars.map(car => ({
                ...car,
                _isTemp: false // Also update the current state, not just the cache
            })));
            
            // Clear status after a delay
            setTimeout(() => {
                setSyncStatus(null);
            }, 3000);
            
            // Refresh data after syncing to get updated IDs from server
            refreshCars();
        }
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
                        
                        // Also update the cached cars
                        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                        cachedData.cars = [newCar, ...cachedData.cars];
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
                {/* Network Status Indicator */}
                <div className={`network-status ${!isOnline ? 'offline' : !serverAvailable ? 'server-down' : 'online'}`}>
                    {!isOnline ? 'You are offline - Only basic operations available' : 
                     !serverAvailable ? 'Server is unavailable - Only basic operations available' : 
                     'Online'}
                    {getOfflineQueue().length > 0 && (
                        <>
                            <span className="pending-changes">  
                                {getOfflineQueue().length} pending changes
                            </span>
                            {isOnline && serverAvailable && (
                                <button className="sync-button" onClick={syncOfflineChanges}>
                                    Sync Now
                                </button>
                            )}
                        </>
                    )}
                </div>
                
                {/* Real-time update notification */}
                {realtimeUpdateReceived && (
                    <div className="realtime-notification">
                        Real-time update received! 
                    </div>
                )}
                
                {syncStatus && (
                    <div className="sync-status">
                        {syncStatus}
                    </div>
                )}
                
                    <CarList 
                        cars={cars}
                        loading={loading}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
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
        </div>
    );
};

export default CarShop;
