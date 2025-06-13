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
import MyCars from './MyCars.jsx';
import Cart from './Cart.jsx';
import CarOperationsContext from './CarOperationsContext.jsx';
// Import brand-related components
import BrandList from './BrandList.jsx';
import BrandDetail from './BrandDetail.jsx';
import AddBrand from './AddBrand.jsx';
import StatisticsPage from './StatisticsPage.jsx';  
import UpdateBrand from './UpdateBrand.jsx';
import { BrandOperationsProvider } from './BrandOperationsContext.jsx';
// Import auth and user monitoring components
import Login from './Login.jsx';
import UserMonitor from './UserMonitor.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { CartProvider } from './CartContext.jsx';
import AuthDebug from './AuthDebug.jsx';
import SessionHandler from './SessionHandler.jsx';
import Security from './Security.jsx';
// Import database performance component
import IndexPerformance from './IndexPerformance.jsx';
import AIChatWidget from './AIChatWidget.jsx';
import config from "./config.js";
import { getAuthToken, setAuthToken, initializeAuth } from './utils/authToken';

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
    const [wsConnectionStatus, setWsConnectionStatus] = useState('disconnected');    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Use the auth token utility instead of local variable
    useEffect(() => {
        // Initialize auth token and set it in axios headers
        const authToken = getAuthToken();
        if (authToken) {
            console.log("App: Initializing authentication with existing token");
            setAuthToken(authToken);
        } else {
            console.log("App: No authentication token found on app start");
        }
        setIsAuthenticated(!!authToken);
    }, []);

      // Check if server is available
    const checkServerAvailability = useCallback(() => {
        console.log("App: Checking server availability...");
        axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`)
            .then(() => {
                console.log("App: Server availability check: SERVER IS AVAILABLE");
                if (!serverAvailable) {
                    console.log("App: Server status changed: OFFLINE → ONLINE");
                    
                    // If server becomes available and we have pending offline changes, try to sync them
                    const queue = getOfflineQueue();
                    if (isOnline && queue && queue.length > 0) {
                        console.log(`App: Found ${queue.length} operations to sync now that server is available`);
                    }
                }
                setServerAvailable(true);
            })
            .catch((error) => {
                console.error("App: Server unavailable:", error);
                if (serverAvailable) {
                    console.log("App: Server status changed: ONLINE → OFFLINE");
                }
                setServerAvailable(false);
            });
    }, [serverAvailable, isOnline]);
      // Network status event listeners
    useEffect(() => {
        const handleOnline = () => {
            console.log("App: Browser reported network is now online");
            setIsOnline(true);
            checkServerAvailability();
            
            // Reconnect WebSocket when coming online
            if (websocket.current?.readyState !== WebSocket.OPEN) {
                connectWebSocket();
            }
        };        const handleOffline = () => {
            console.log("App: Browser reported network is now offline");
            setIsOnline(false);
            
            // Close WebSocket when going offline
            if (websocket.current) {
                websocket.current.close();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Set up periodic server availability checks every 30 seconds
        const intervalId = setInterval(() => {
            console.log("App: Performing periodic server availability check");
            checkServerAvailability();
        }, 30000);        // Initial check
        checkServerAvailability();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            
            // Clear the interval to prevent memory leaks
            clearInterval(intervalId);
            
            // Close WebSocket connection on component unmount
            if (websocket.current) {
                websocket.current.close();
            }
        };
    }, [checkServerAvailability]);
      // More robust server availability check specifically for CRUD operations
    const checkWithDebug = useCallback(async () => {
        console.log("App: Running robust availability check for CRUD operations");
        try {
            const response = await axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`, {
                timeout: 10000 // Increased timeout for Docker environment
            });
            
            console.log("App: Server is responsive:", response.status);
            return true;
        } catch (error) {
            console.error("App: Server check failed:", error.message);
            return false;
        }
    }, []);

    // Periodic server status check for operations
    useEffect(() => {
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
        console.log(`App: Handling offline deletion for car ID: ${id}`);
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
    }, []);    // Define delete car function that will be available everywhere
    
const performDirectDelete = useCallback((idStr) => {
    console.log(`App: Performing direct server deletion for car ID: ${idStr}`);
    const token = getAuthToken();
    console.log(`App: Using auth token: ${token ? 'Present' : 'Missing'}`);
    
    // Make sure auth token is set in axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return axios.delete(`${config.API_URL}/api/cars/${idStr}`, {
        // Add specific timeout to ensure we don't hang indefinitely
        timeout: 5000,
        headers: {
            // Simplified headers to avoid CORS issues
            'Cache-Control': 'no-cache'
            // Authorization header is set globally by axios defaults
        }
    })
        .then(response => {
            console.log('App: Server delete successful:', response.status);
            
            // Update local cache
            try {
                const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                cachedData.cars = cachedData.cars.filter(car => String(car.id) !== idStr);
                localStorage.setItem('cachedCars', JSON.stringify(cachedData));
            } catch (error) {
                console.error('App: Error updating cache', error);
            }
            
            // Also update deletedCarsRegistry to ensure UI consistency
            const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
            if (!deletedCarsRegistry.includes(idStr)) {
                deletedCarsRegistry.push(idStr);
                localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
            }
            
            // Remove any pending delete operations for this ID from the queue
            const offlineQueue = getOfflineQueue();
            const updatedQueue = offlineQueue.filter(op => 
                !(op.type === 'DELETE' && String(op.id) === idStr)
            );
            
            if (updatedQueue.length !== offlineQueue.length) {
                console.log(`App: Removed ${offlineQueue.length - updatedQueue.length} pending delete operations for car ${idStr}`);
                setOfflineQueue(updatedQueue);
            }
            
            return response;
        })
        .catch(error => {
            console.error('App: Error deleting car from server', error);
            
            // Check if this is a 404 error (car already deleted)
            if (error.response && error.response.status === 404) {
                console.log(`App: Car with ID ${idStr} not found (404) - considering deletion successful`);
                // Update deletedCarsRegistry to ensure UI consistency
                const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                if (!deletedCarsRegistry.includes(idStr)) {
                    deletedCarsRegistry.push(idStr);
                    localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
                }
                // Return a success response
                return {
                    status: 200,
                    data: { message: 'Car not found or already deleted' }
                };
            }
            
            // If server communication fails for other reasons, fall back to offline queue
            return handleOfflineDeletion(idStr);
        });
}, [handleOfflineDeletion]);

    

// Fixed deleteCar and performDirectDelete functions

const deleteCar = useCallback((id, forceImmediate = false) => {
    console.log(`App: Delete car called with ID: ${id}, forceImmediate: ${forceImmediate}`);
    console.log(`App: Current connectivity status: Network ${isOnline ? "ONLINE" : "OFFLINE"}, Server ${serverAvailable ? "AVAILABLE" : "UNAVAILABLE"}`);
    
    // Force a server availability check if we're online but the server is marked as unavailable
    if (isOnline && !serverAvailable) {
        console.log("App: Network is online but server marked unavailable - checking server status now");
        checkServerAvailability();
    }
    
    // Ensure id is consistently a string
    const idStr = String(id);
    
    // First check if this car is already in the deletedCarsRegistry
    const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
    if (deletedCarsRegistry.includes(idStr) && !forceImmediate) {
        console.log(`App: Car with ID ${idStr} is already marked for deletion, skipping server call`);
        return Promise.resolve({ data: { message: 'Car already marked for deletion' } });
    }
    
    // Also check if it's already in the offline queue to avoid duplicates
    const offlineQueue = getOfflineQueue();
    const isInOfflineQueue = offlineQueue.some(op => 
        op.type === 'DELETE' && String(op.id) === idStr
    );
    
    if (isInOfflineQueue && !forceImmediate) {
        console.log(`App: Car with ID ${idStr} is already in deletion queue, skipping server call`);
        return Promise.resolve({ data: { message: 'Car already in deletion queue' } });
    }
    
    // If forceImmediate is true, always try direct deletion first
    if (forceImmediate) {
        console.log(`App: Force immediate deletion for ID: ${idStr}`);
        return performDirectDelete(idStr).catch(error => {
            console.error(`App: Forced deletion failed, falling back to queue: ${error.message}`);
            return handleOfflineDeletion(idStr);
        });
    }
      
    // If online, perform an immediate server check before deciding
    if (isOnline) {
        // Always perform a quick server check before delete to ensure server is available
        return checkWithDebug().then(available => {
            if (available) {
                console.log(`App: Server is available - proceeding with delete for ID: ${idStr}`);
                setServerAvailable(true); // Update the state for future operations
                return performDirectDelete(idStr);
            } else {
                console.log(`App: Server confirmed unavailable - using offline deletion`);
                setServerAvailable(false); // Update the state based on check
                return handleOfflineDeletion(idStr);
            }
        });
    } else {
        console.log(`App: Offline mode - using offline deletion for ID: ${idStr}`);
        return handleOfflineDeletion(idStr);
    }
}, [isOnline, serverAvailable, handleOfflineDeletion, checkWithDebug, performDirectDelete]);

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

    // Simplified create and update functions for the app level
    const createCar = useCallback((formData, carData) => {
        console.log('App: Create car called');
        
        // Get the current auth token for this request
        const token = getAuthToken();
        if (!token) {
            console.error("App: No auth token available for car creation");
            return Promise.reject(new Error("Authentication required"));
        }
        
        if (isOnline && serverAvailable) {
            console.log('App: Online mode - using server creation');
            return axios.post(`${config.API_URL}/api/cars`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`  // Explicitly set Authorization header
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
                return handleOfflineCreation(carData);            });
        } else {
            console.log('App: Offline mode - using offline creation');
            return handleOfflineCreation(carData);
        }    }, [isOnline, serverAvailable, handleOfflineCreation]);

    const updateCar = useCallback((id, formData) => {
        console.log(`App: Update car called with ID: ${id}`);        // Get the current auth token for this request
        const token = getAuthToken();
        if (!token) {
            console.error("App: No auth token available for car update");
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
            return Promise.reject(new Error("Authentication required. Please log in again."));
        }
        
        if (isOnline && serverAvailable) {
            console.log('App: Online mode - using server update');
            console.log('App: Using token:', token.substring(0, 10) + '...');
            
            return axios.put(`${config.API_URL}/api/cars/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`  // Explicitly set Authorization header
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
    }, [isOnline, serverAvailable]);    const handleOfflineUpdate = useCallback((id, formData) => {
        // Convert FormData to a plain object for offline storage
        const updatedData = {};
        if(formData instanceof FormData) {
            // Special handling for the image file in FormData
            formData.forEach((value, key) => {
                if (key === 'image' && value instanceof File) {
                    // For file objects, convert to base64 for offline storage
                    console.log("Handling offline image storage for file:", value.name);
                    
                    // In a real solution, we'd read the file and convert it to base64
                    // For now, set a flag to indicate an image was uploaded
                    updatedData.hasOfflineImageUpdate = true;
                    updatedData.offlineImageName = value.name;
                    
                    // This is a placeholder - in a production app, we would 
                    // convert the image to base64 with a FileReader
                } else if (key === 'keepExistingImage') {
                    // Special handling for the keep existing image flag
                    updatedData.keepExistingImage = value === 'true';
                    console.log("Setting keepExistingImage flag:", updatedData.keepExistingImage);
                } else {
                    updatedData[key] = value;
                }
            });
        } else if (typeof formData === 'object') {
            Object.keys(formData).forEach(key => {
                updatedData[key] = formData[key];
            });
        } else {
            console.error('Invalid formData format:', formData);
            return Promise.reject(new Error('Invalid formData format'));
        }
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
    });    return (
        <AuthProvider>
            <CartProvider>
                <CarOperationsContext.Provider value={carOperations}>
                    <BrandOperationsProvider>                    <Router>
                            <Navbar wsStatus={wsConnectionStatus} />
                            <SessionHandler />                        <Routes>
                                <Route path="/" element={<CarShop />} />
                                <Route path="/cars/:id" element={<CarDetail />} />
                                {/* Add an additional route that matches /CarDetail/:id pattern */}
                                <Route path="/CarDetail/:id" element={<CarDetail />} />
                                <Route path="/AddCar" element={<AddCar />} />
                                <Route path="/UpdateCar/:id" element={<UpdateCar />} />
                                <Route path="/mycars" element={<MyCars />} />
                                <Route path="/cart" element={<Cart />} />
                                
                                {/* Brand routes */}
                                <Route path="/brands" element={<BrandList />} />
                                <Route path="/brands/:id" element={<BrandDetail />} />
                                <Route path="/add-brand" element={<AddBrand />} />
                                <Route path="/brands/:id/edit" element={<UpdateBrand />} />
                                  {/* Statistics route */}
                                <Route path="/statistics" element={<StatisticsPage />} />
                                <Route path="/db-performance" element={<IndexPerformance />} />
                                  {/* Authentication and User Monitoring routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/user-monitor" element={<UserMonitor />} />
                                <Route path="/security" element={<Security />} />                        </Routes>   
                            <Footer />
                            {/* Authentication Debug Panel */}
                            <AuthDebug />
                            {/* AI Chat Widget */}
                            <AIChatWidget />
                        </Router>
                    </BrandOperationsProvider>
                </CarOperationsContext.Provider>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
