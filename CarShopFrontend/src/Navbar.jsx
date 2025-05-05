import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import config from "./config.js";
import axios from "axios";

// Helper function to get offline queue
const getOfflineQueue = () => {
    const queue = localStorage.getItem('offlineOperationsQueue');
    return queue ? JSON.parse(queue) : [];
};

const Navbar = ({ wsStatus = 'disconnected' }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [serverAvailable, setServerAvailable] = useState(true);
    const [syncStatus, setSyncStatus] = useState(null);

    // Check if server is available
    const checkServerAvailability = () => {
        axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`)
            .then(() => {
                setServerAvailable(true);
            })
            .catch(() => {
                setServerAvailable(false);
            });
    };

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

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getStatusText = (status) => {
        switch (status) {
            case 'connected': return 'Live updates active';
            case 'disconnected': return 'Live updates offline';
            case 'error': return 'Connection error';
            case 'connecting': return 'Connecting...';
            default: return 'Offline mode';
        }
    };

    const toggleDropdown = (dropdown) => {
        if (activeDropdown === dropdown) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(dropdown);
        }
    };

    // Function to handle sync of offline changes
    const syncOfflineChanges = () => {
        setSyncStatus('Syncing in progress...');
        
        // Perform actual sync operation by calling the backend
        const queue = getOfflineQueue();
        if (queue.length > 0) {
            const processQueue = async () => {
                // Process the queue items one by one
                let successCount = 0;
                let failCount = 0;
                
                for (const item of queue) {
                    try {
                        console.log(`Processing queue item: ${item.type} for ID ${item.id}`);
                        
                        if (item.type === 'DELETE') {
                            await axios.delete(`${config.API_URL}/api/cars/${item.id}`);
                            successCount++;
                        } else if (item.type === 'UPDATE') {
                            await axios.put(`${config.API_URL}/api/cars/${item.id}`, item.data);
                            successCount++;
                        } else if (item.type === 'CREATE') {
                            // Handle create operation
                            const formData = new FormData();
                            for (const key in item.data) {
                                formData.append(key, item.data[key]);
                            }
                            await axios.post(`${config.API_URL}/api/cars`, formData);
                            successCount++;
                        }
                    } catch (error) {
                        console.error(`Error processing queue item: ${error}`);
                        failCount++;
                    }
                }
                
                // Clear the queue after processing
                localStorage.removeItem('offlineOperationsQueue');
                
                // Also update any temporary styling on cached cars
                const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
                if (cachedData && cachedData.cars) {
                    cachedData.cars = cachedData.cars.map(car => ({
                        ...car,
                        _isTemp: false
                    }));
                    localStorage.setItem('cachedCars', JSON.stringify(cachedData));
                }
                
                setSyncStatus(`Sync completed: ${successCount} successful, ${failCount} failed`);
                setTimeout(() => setSyncStatus(null), 3000);
                
                // Reload to refresh data
                window.location.reload();
            };
            
            processQueue();
        } else {
            setSyncStatus('No changes to sync');
            setTimeout(() => setSyncStatus(null), 2000);
        }
    };

    // Function to clear the deletedCarsRegistry
    const clearDeletedCarsRegistry = () => {
        localStorage.removeItem('deletedCarsRegistry');
        console.log('Navbar: Deleted cars registry cleared');
        setSyncStatus('Restored all cars');
        setTimeout(() => setSyncStatus(null), 2000);
        
        // Reload the page to refresh content
        window.location.reload();
    };
    
    // Function to clear the offline queue
    const clearOfflineQueue = () => {
        localStorage.removeItem('offlineOperationsQueue');
        console.log('Navbar: Offline operations queue cleared');
        
        // Also update any temporary styling on cached cars
        const cachedData = JSON.parse(localStorage.getItem('cachedCars') || '{"cars":[]}');
        if (cachedData && cachedData.cars) {
            cachedData.cars = cachedData.cars.map(car => ({
                ...car,
                _isTemp: false // Remove all temp flags
            }));
            localStorage.setItem('cachedCars', JSON.stringify(cachedData));
        }
        
        setSyncStatus('All pending changes cleared');
        setTimeout(() => setSyncStatus(null), 2000);
        
        // Reload the page to refresh content
        window.location.reload();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close dropdown after clicking a menu item
    const handleMenuItemClick = () => {
        setActiveDropdown(null);
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-container">
                    <div className="nav-left">
                        <Link to="/" className="navbar-logo">
                            CarMarket
                        </Link>
                        <div className="websocket-status">
                            <span className={`status-indicator ${wsStatus}`}></span>
                            <span className="status-text">
                                {getStatusText(wsStatus)}
                            </span>
                        </div>
                    </div>
                    <div className="nav-right" ref={dropdownRef}>
                        <Link to="/" className="nav-link">Home</Link>
                        
                        <div className="dropdown">
                            <button 
                                className={`dropdown-toggle ${activeDropdown === 'cars' ? 'active' : ''}`} 
                                onClick={() => toggleDropdown('cars')}
                            >
                                Cars 
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {activeDropdown === 'cars' && (
                                <div className="dropdown-menu">
                                    <Link to="/" className="dropdown-item" onClick={handleMenuItemClick}>
                                        View All Cars
                                    </Link>
                                    <Link to="/add-car" className="dropdown-item" onClick={handleMenuItemClick}>
                                        Add New Car
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="dropdown">
                            <button 
                                className={`dropdown-toggle ${activeDropdown === 'brands' ? 'active' : ''}`} 
                                onClick={() => toggleDropdown('brands')}
                            >
                                Brands 
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {activeDropdown === 'brands' && (
                                <div className="dropdown-menu">
                                    <Link to="/brands" className="dropdown-item" onClick={handleMenuItemClick}>
                                        View All Brands
                                    </Link>
                                    <Link to="/add-brand" className="dropdown-item" onClick={handleMenuItemClick}>
                                        Add New Brand
                                    </Link>
                                </div>
                            )}
                        </div>
                        {/* Add buttons for sync and restore functionality */}
                        {getOfflineQueue().length > 0 && (
                            <>
                                <button className="sync-button" onClick={syncOfflineChanges}>
                                    Sync Now ({getOfflineQueue().length})
                                </button>
                                <button className="reset-button" onClick={clearOfflineQueue} title="Clear all pending changes">
                                    Skip Changes
                                </button>
                            </>
                        )}
                        <button className="restore-button" onClick={clearDeletedCarsRegistry} title="Restore any cars you've deleted locally">
                            Restore All Cars
                        </button>
                    </div>
                </div>
            </nav>

            {/* Sync Status Message */}
            {syncStatus && (
                <div className="sync-status">
                    {syncStatus}
                </div>
            )}
        </>
    );
};

export default Navbar;