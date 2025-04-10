// CarShop.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import Sidebar from "./Sidebar.jsx";
import CarList from "./CarList.jsx";
import Cover from "./Cover.jsx";
import "./CarShop.css";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import CarOperationsContext from './CarOperationsContext.jsx';

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
    const { deleteCar, fetchCars: contextFetchCars } = carOperations;

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
    const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get("itemsPerPage") || "8"));
    const [sortMethod, setSortMethod] = useState('');

    // Check if server is available
    const checkServerAvailability = useCallback(() => {
        axios.get('http://localhost:5000/api/cars?page=1&itemsPerPage=1')
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
        setLoading(true);
        
        const params = new URLSearchParams();
        
        params.append("page", currentPage.toString());
        params.append("itemsPerPage", itemsPerPage.toString());
        
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
            setLoading(false);
            const cachedData = localStorage.getItem('cachedCars');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                
                // Simple display of cached data without filtering/sorting
                // Just use pagination for simplicity
                const startIndex = 0;
                const endIndex = parsed.cars.length;
                const simpleCars = parsed.cars.slice(startIndex, endIndex);
                
                setCars(simpleCars);
                setTotalPages(1); // No pagination in offline mode
            } else {
                setCars([]);
                setTotalPages(1);
            }
        } else {
            // Log the URL for debugging purposes
            console.log(`Fetching cars with params: ${params.toString()}`);
            
            axios.get(`http://localhost:5000/api/cars?${params.toString()}`)
                .then((response) => {
                    // Filter out any cars that are in the deletedCarsRegistry
                    const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                    const filteredCars = (response.data.cars || []).filter(
                        car => !deletedCarsRegistry.includes(car.id.toString())
                    );
                    
                    setCars(filteredCars);
                    setTotalPages(response.data.totalPages || 1);
                    setLoading(false);
                    
                    // Cache the filtered data
                    localStorage.setItem('cachedCars', JSON.stringify({
                        cars: filteredCars,
                        timestamp: new Date().toISOString()
                    }));
                })
                .catch((error) => {
                    console.error("Error fetching cars:", error);
                    setLoading(false);
                    
                    // Server might be down, mark it as unavailable
                    setServerAvailable(false);
                });
        }
    }, [currentPage, itemsPerPage, sortMethod, debouncedFilters, setSearchParams, isOnline, serverAvailable]);

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
            const newQueue = [
                ...deletedCarsToSync.map(id => ({ type: 'DELETE', id, timestamp: new Date().toISOString() })),
                ...queue
            ];
            setOfflineQueue(newQueue);
        }
        
        const updatedQueue = getOfflineQueue();
        console.log("checking length");
        if (updatedQueue.length === 0) return;
        console.log("length greater than 0")
        setSyncStatus('Syncing changes...');
        
        let failed = false;
        let completedOperations = 0;
        
        // Process queue in order
        for (const operation of updatedQueue) {
            try {
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
                        
                        const createdCarResponse = await axios.post('http://localhost:5000/api/cars', formData, {
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
                        
                        break;
                    
                    case 'UPDATE':
                        await axios.put(`http://localhost:5000/api/cars/${operation.id}`, operation.data);
                        break;
                    case 'DELETE':
                        await axios.delete(`http://localhost:5000/api/cars/${operation.id}`);
                        
                        // Remove from deletedCarsRegistry if exists
                        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                        if (deletedCarsRegistry.includes(operation.id.toString())) {
                            const updatedRegistry = deletedCarsRegistry.filter(id => id !== operation.id.toString());
                            localStorage.setItem('deletedCarsRegistry', JSON.stringify(updatedRegistry));
                        }
                        break;
                    default:
                        console.warn('Unknown operation type:', operation.type);
                }
                completedOperations++;
            } catch (error) {
                console.error('Failed to sync operation:', operation, error);
                failed = true;
                break;
            }
        }
        
        // Remove processed operations from queue
        if (completedOperations > 0) {
            setOfflineQueue(updatedQueue.slice(completedOperations));
            
            // Clear the UI to update the display
            localStorage.setItem('offlineOperationsQueue', JSON.stringify(updatedQueue.slice(completedOperations)));
        }
        
        if (failed) {
            setSyncStatus(`Synced ${completedOperations} of ${updatedQueue.length} changes. Some operations failed.`);
        } else if (completedOperations === updatedQueue.length) {
            setSyncStatus('All changes synced successfully!');
            setOfflineQueue([]);
            
            // Explicitly clear the queue in localStorage to ensure the pending changes indicator disappears
            localStorage.setItem('offlineOperationsQueue', JSON.stringify([]));
            
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
        refreshCars();
        
        // Set up a timer to periodically refresh cars and apply the deletion registry
        const refreshInterval = setInterval(() => {
            if (isOnline && serverAvailable) {
                filterOutDeletedCars();
            }
        }, 30000); // Every 30 seconds
        
        // Add periodic sync attempt if there are pending operations
        const syncInterval = setInterval(() => {
            if (isOnline && serverAvailable && getOfflineQueue().length > 0) {
                syncOfflineChanges();
            }
        }, 60000); // Try every minute
        
        return () => {
            clearInterval(refreshInterval);
            clearInterval(syncInterval);
        };
    }, [refreshCars, filterOutDeletedCars, isOnline, serverAvailable, syncOfflineChanges]);

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

    return (
        <div>
                <Cover />
                <div className="content">
                    <Sidebar 
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        disabled={!isOnline || !serverAvailable}
                    />
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
                    {syncStatus && (
                        <div className="sync-status">
                            {syncStatus}
                        </div>
                    )}
                </div>
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
                    />
                </div>
            </div>
        </div>
    );
};

export default CarShop;
