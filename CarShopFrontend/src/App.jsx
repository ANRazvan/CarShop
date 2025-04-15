import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from "axios";
import ReconnectingWebSocket from 'reconnecting-websocket';
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CarShop from './CarShop.jsx'
import CarDetail from './CarDetail.jsx'
import AddCar from "./AddCar.jsx";
import UpdateCar from './UpdateCar.jsx';
import CarOperationsContext from './CarOperationsContext.jsx';
import config from "./config.js";

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

function App() {
    const [cars, setCars] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [serverAvailable, setServerAvailable] = useState(true);
    const websocket = useRef(null);
    const [lastWebSocketMessage, setLastWebSocketMessage] = useState(null);
    const [wsConnectionStatus, setWsConnectionStatus] = useState('disconnected');
    
    // Check if server is available
    const checkServerAvailability = useCallback(() => {
        axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`)
            .then(() => {
                setServerAvailable(true);
            })
            .catch((error) => {
                console.error("Server unavailable:", error);
                setServerAvailable(false);
            });
    }, []);
    
    // Network status event listeners
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            checkServerAvailability();
            
            // Reconnect WebSocket when coming online
            if (websocket.current?.readyState !== WebSocket.OPEN) {
                connectWebSocket();
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            
            // Close WebSocket when going offline
            if (websocket.current) {
                websocket.current.close();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkServerAvailability();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            
            // Close WebSocket connection on component unmount
            if (websocket.current) {
                websocket.current.close();
            }
        };
    }, [checkServerAvailability]);
    
    // WebSocket Connection
    const connectWebSocket = useCallback(() => {
        if (!isOnline || !serverAvailable) return;
        
        console.log("Establishing WebSocket connection...");
        setWsConnectionStatus('connecting');
        
        // Close existing connection if any
        if (websocket.current) {
            websocket.current.close();
        }
        
        try {
            // Create new WebSocket connection with ReconnectingWebSocket directly
            // Skip the test socket - it might be causing issues
            const wsOptions = {
                connectionTimeout: 3000,
                maxRetries: 5,
                maxReconnectionDelay: 10000,
                minReconnectionDelay: 1000,
                reconnectionDelayGrowFactor: 1.3,
                debug: true
            };
            
            const wsUrl = config.WS_URL;
            console.log(`Connecting to WebSocket at ${wsUrl}`);
            
            websocket.current = new ReconnectingWebSocket(wsUrl, [], wsOptions);
            
            websocket.current.onopen = () => {
                console.log("WebSocket connection established");
                setWsConnectionStatus('connected');
            };
            
            websocket.current.onclose = (event) => {
                console.log("WebSocket connection closed", event);
                setWsConnectionStatus('disconnected');
            };
            
            websocket.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                setWsConnectionStatus('error');
            };
            
            // Set up ping interval
            const pingInterval = setInterval(() => {
                if (websocket.current && websocket.current.readyState === 1) {
                    try {
                        websocket.current.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
                    } catch (err) {
                        console.error("Error sending ping:", err);
                    }
                }
            }, 25000);
            
            websocket.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log("WebSocket message received:", message);
                    
                    // Handle ping from server
                    if (message.type === 'PING') {
                        websocket.current.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
                        return; // Don't process pings further
                    }
                    
                    setLastWebSocketMessage(message);
                } catch (error) {
                    console.error("Error parsing WebSocket message:", error);
                }
            };
            
            return pingInterval;
        } catch (error) {
            console.error("Error setting up WebSocket:", error);
            setWsConnectionStatus('error');
            return null;
        }
    }, [isOnline, serverAvailable]);
    
    // Connect WebSocket when component mounts and when online status changes
    useEffect(() => {
        let pingInterval;
        
        if (isOnline && serverAvailable) {
            const cleanup = connectWebSocket();
            if (typeof cleanup === 'function') {
                pingInterval = cleanup;
            }
        }
        
        return () => {
            if (websocket.current) {
                websocket.current.close();
            }
            if (pingInterval) {
                clearInterval(pingInterval);
            }
        };
    }, [isOnline, serverAvailable, connectWebSocket]);
    
    // Helper function for offline deletion
    const handleOfflineDeletion = useCallback((id) => {
        // Convert id to string for consistent comparison
        const idStr = String(id);
        
        // Add to offline queue for server-side deletion when online
        addToOfflineQueue({
            type: 'DELETE',
            id: idStr
        });
        
        // Update deletedCarsRegistry for tracking which cars should be filtered out in the UI
        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
        if (!deletedCarsRegistry.includes(idStr)) {
            deletedCarsRegistry.push(idStr);
            localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
        }
        
        // IMPROVEMENT: Immediately remove the car from cached cars for better offline UX
        try {
            const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
            cachedData.cars = cachedData.cars.filter(car => String(car.id) !== idStr);
            localStorage.setItem('cachedCars', JSON.stringify(cachedData));
            console.log(`App: Removed car ${idStr} from local cache for immediate UI update`);
        } catch (error) {
            console.error('App: Error updating cache during offline deletion', error);
        }
        
        return Promise.resolve({ data: { message: 'Car marked for deletion and removed from local view' } });
    }, []);
    
    // Define delete car function that will be available everywhere
    const deleteCar = useCallback((id) => {
        console.log(`App: Delete car called with ID: ${id}`);
        
        // Ensure id is consistently a string
        const idStr = String(id);
        
        // First check if this car is already in the deletedCarsRegistry
        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
        if (deletedCarsRegistry.includes(idStr)) {
            console.log(`App: Car with ID ${idStr} is already marked for deletion, skipping server call`);
            return Promise.resolve({ data: { message: 'Car already marked for deletion' } });
        }
        
        // Also check if it's already in the offline queue to avoid duplicates
        const offlineQueue = getOfflineQueue();
        const isInOfflineQueue = offlineQueue.some(op => 
            op.type === 'DELETE' && String(op.id) === idStr
        );
        
        if (isInOfflineQueue) {
            console.log(`App: Car with ID ${idStr} is already in deletion queue, skipping server call`);
            return Promise.resolve({ data: { message: 'Car already in deletion queue' } });
        }
        
        if (isOnline && serverAvailable) {
            console.log(`App: Online mode - using server deletion for ID: ${idStr}`);
            return axios.delete(`${config.API_URL}/api/cars/${idStr}`)
                .then(response => {
                    console.log('App: Server delete successful');
                    
                    // Update local cache
                    try {
                        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                        cachedData.cars = cachedData.cars.filter(car => String(car.id) !== idStr);
                        localStorage.setItem('cachedCars', JSON.stringify(cachedData));
                    } catch (error) {
                        console.error('App: Error updating cache', error);
                    }
                    
                    // Add to deletedCarsRegistry
                    try {
                        if (!deletedCarsRegistry.includes(idStr)) {
                            deletedCarsRegistry.push(idStr);
                            localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
                        }
                    } catch (error) {
                        console.error('App: Error updating deletion registry', error);
                    }
                    
                    return response;
                })
                .catch(error => {
                    console.error('App: Error deleting car from server', error);
                    return handleOfflineDeletion(idStr);
                });
        } else {
            console.log('App: Offline mode - using offline deletion');
            return handleOfflineDeletion(idStr);
        }
    }, [isOnline, serverAvailable, handleOfflineDeletion]);

    // Simplified create and update functions for the app level
    const createCar = useCallback((formData, carData) => {
        console.log('App: Create car called');
        
        if (isOnline && serverAvailable) {
            console.log('App: Online mode - using server creation');
            return axios.post(`${config.API_URL}/api/cars`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })
            .then(response => {
                console.log('App: Server creation successful', response.data);
                
                // Update local cache with the new car
                try {
                    const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                    cachedData.cars.push(response.data);
                    localStorage.setItem('cachedCars', JSON.stringify(cachedData));
                } catch (error) {
                    console.error('App: Error updating cache', error);
                }
                
                return response;
            })
            .catch(error => {
                console.error('App: Error creating car on server', error);
                return handleOfflineCreation(carData);
            });
        } else {
            console.log('App: Offline mode - using offline creation');
            return handleOfflineCreation(carData);
        }
    }, [isOnline, serverAvailable]);

    // Helper function for offline car creation
    const handleOfflineCreation = useCallback((carData) => {
        // Generate a temporary ID (negative to avoid conflicts with server IDs)
        const tempId = -Math.floor(Math.random() * 10000);
        
        // Create a temporary car object with the temp ID
        const tempCar = {
            ...carData,
            id: tempId,
            _isTemp: true, // Flag to identify as temporary
        };
        
        // Add to offline queue
        addToOfflineQueue({
            type: 'CREATE',
            data: carData,
            tempId: tempId,
            timestamp: new Date().toISOString()
        });
        
        // Update local cache
        try {
            const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
            cachedData.cars.push(tempCar);
            localStorage.setItem('cachedCars', JSON.stringify(cachedData));
        } catch (error) {
            console.error('App: Error updating cache for offline car', error);
        }
        
        return Promise.resolve({ data: tempCar });
    }, []);

    const updateCar = useCallback((id, formData) => {
        console.log(`App: Update car called with ID: ${id}`);

        if (isOnline && serverAvailable) {
            console.log('App: Online mode - using server update');
            return axios.put(`${config.API_URL}/api/cars/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })
            .then(response => {
                console.log('App: Server update successful', response.data);

                // Update local cache with the updated car
                try {
                    const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                    cachedData.cars = cachedData.cars.map(car => car.id === id ? response.data : car);
                    localStorage.setItem('cachedCars', JSON.stringify(cachedData));
                } catch (error) {
                    console.error('App: Error updating cache', error);
                }

                return response;
            })
            .catch(error => {
                console.error('App: Error updating car on server', error);
                return handleOfflineUpdate(id, formData);
            });
        } else {
            console.log('App: Offline mode - using offline update');
            return handleOfflineUpdate(id, formData);
        }
    }, [isOnline, serverAvailable]);

    const handleOfflineUpdate = useCallback((id, formData) => {
        // Convert FormData to a plain object for offline storage
        const updatedData = {};
        formData.forEach((value, key) => {
            updatedData[key] = value;
        });

        // Update local cache
        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
        cachedData.cars = cachedData.cars.map(car => car.id === id ? { ...car, ...updatedData, _isTemp: true } : car);
        localStorage.setItem('cachedCars', JSON.stringify(cachedData));

        // Add to offline queue
        addToOfflineQueue({
            type: 'UPDATE',
            id,
            data: updatedData,
        });

        return Promise.resolve({ data: { ...updatedData, id, _isTemp: true } });
    }, []);
    
    const fetchCars = useCallback(() => {
        console.log('App: Fetch cars called');
        
        // Add detailed debugging for server availability
        console.log(`App: Current network status - Online: ${isOnline}, Server Available: ${serverAvailable}`);
        
        // Add a server availability check that logs detailed information
        const checkWithDebug = () => {
            console.log(`App: Performing debug check to API endpoint: ${config.API_URL}/api/cars`);
            
            return axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`)
                .then(response => {
                    console.log(`App: Server responded successfully with status ${response.status}`);
                    console.log('App: First car in response:', response.data.cars && response.data.cars[0] ? 
                        JSON.stringify(response.data.cars[0]) : 'No cars in response');
                    return true;
                })
                .catch(error => {
                    console.error(`App: Server check failed with error:`, error);
                    console.log(`App: Error details - ${error.message}`);
                    
                    // Log more details about the error
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        console.error(`App: Server responded with status ${error.response.status}`);
                        console.error('App: Response headers:', JSON.stringify(error.response.headers));
                        console.error('App: Response data:', JSON.stringify(error.response.data));
                    } else if (error.request) {
                        // The request was made but no response was received
                        console.error('App: No response received from server');
                        console.error('App: Request details:', JSON.stringify(error.request));
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.error('App: Error setting up request:', error.message);
                    }
                    
                    return false;
                });
        };
        
        // Run the debug check
        if (isOnline) {
            checkWithDebug().then(available => {
                console.log(`App: Debug check result - Server available: ${available}`);
                setServerAvailable(available);
            });
        } else {
            console.log('App: Not checking server as device is offline');
        }
        
        // Implementation would typically go here - simplified for now
    }, [isOnline, serverAvailable]);

    // Create the context value with WebSocket info
    const carOperations = useMemo(() => ({
        createCar,
        updateCar,
        deleteCar,
        fetchCars,
        websocket: websocket.current,
        lastWebSocketMessage,
        wsConnectionStatus
    }), [createCar, updateCar, deleteCar, fetchCars, lastWebSocketMessage, wsConnectionStatus]);
    
    console.log('App: Context operations defined:', {
        createCar: typeof createCar === 'function',
        updateCar: typeof updateCar === 'function',
        deleteCar: typeof deleteCar === 'function',
        fetchCars: typeof fetchCars === 'function',
        websocketConnected: websocket.current?.readyState === WebSocket.OPEN
    });

    return (
        <CarOperationsContext.Provider value={carOperations}>
            <Router>
                <Navbar wsStatus={wsConnectionStatus} />
                <Routes>
                    <Route path="/" element={<CarShop />} />
                    <Route path="/CarDetail/:id" element={<CarDetail />} />
                    <Route path="/AddCar" element={<AddCar />} />
                    <Route path="/UpdateCar/:id" element={<UpdateCar />} />
                </Routes>   
                <Footer />
            </Router>
        </CarOperationsContext.Provider>
    );
}

export default App;
