import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from "axios";
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import CarShop from './CarShop.jsx'
import CarDetail from './CarDetail.jsx'
import AddCar from "./AddCar.jsx";
import UpdateCar from './UpdateCar.jsx';
import CarOperationsContext from './CarOperationsContext.jsx';

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
    
    // Check if server is available
    const checkServerAvailability = useCallback(() => {
        axios.get('http://localhost:5000/api/cars?page=1&itemsPerPage=1')
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
        };

        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkServerAvailability();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkServerAvailability]);
    
    // Helper function for offline deletion
    const handleOfflineDeletion = useCallback((id) => {
        // Convert id to string for consistent comparison
        const idStr = String(id);
        
        // Update local cache
        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
        cachedData.cars = cachedData.cars.filter(car => String(car.id) !== idStr);
        localStorage.setItem('cachedCars', JSON.stringify(cachedData));
        
        // Add to offline queue
        addToOfflineQueue({
            type: 'DELETE',
            id: idStr
        });
        
        // Also update deletedCarsRegistry for additional verification
        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
        if (!deletedCarsRegistry.includes(idStr)) {
            deletedCarsRegistry.push(idStr);
            localStorage.setItem('deletedCarsRegistry', JSON.stringify(deletedCarsRegistry));
        }
        
        return Promise.resolve({ data: { message: 'Car deleted successfully' } });
    }, []);
    
    // Define delete car function that will be available everywhere
    const deleteCar = useCallback((id) => {
        console.log(`App: Delete car called with ID: ${id}`);
        
        // Ensure id is consistently a string
        const idStr = String(id);
        
        if (isOnline && serverAvailable) {
            console.log(`App: Online mode - using server deletion for ID: ${idStr}`);
            return axios.delete(`http://localhost:5000/api/cars/${idStr}`)
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
                        const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
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
            return axios.post('http://localhost:5000/api/cars', formData, {
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

    const updateCar = useCallback((id, data) => {
        console.log(`App: Update car called with ID: ${id}`);
        // Implementation would go here - simplified for now
        return Promise.resolve({ data: {} });
    }, []);
    
    const fetchCars = useCallback(() => {
        console.log('App: Fetch cars called');
        // Implementation would go here - simplified for now
    }, []);

    // Create the context value
    const carOperations = useMemo(() => ({
        createCar,
        updateCar,
        deleteCar,
        fetchCars
    }), [createCar, updateCar, deleteCar, fetchCars]);
    
    console.log('App: Context operations defined:', {
        createCar: typeof createCar === 'function',
        updateCar: typeof updateCar === 'function',
        deleteCar: typeof deleteCar === 'function',
        fetchCars: typeof fetchCars === 'function'
    });

    return (
        <CarOperationsContext.Provider value={carOperations}>
            <Router>
                <Navbar />
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
