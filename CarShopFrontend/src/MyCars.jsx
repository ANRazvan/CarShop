import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "./config.js";
import { useAuth } from "./hooks/useAuth";
import CarCard from "./CarCard.jsx";
import CarOperationsContext from './CarOperationsContext.jsx';
import "./MyCars.css"; // Use dedicated MyCars styles

const MyCars = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('newest'); // Add sorting state
    const [filterBy, setFilterBy] = useState('all'); // Add filtering state
    const { currentUser, isAuthenticated, getAuthToken } = useAuth();
    const { deleteCar, updateCar } = useContext(CarOperationsContext);
    const navigate = useNavigate();    // Check if user is authenticated
    useEffect(() => {
        console.log('MyCars: Auth check - isAuthenticated:', isAuthenticated());
        if (!isAuthenticated()) {
            console.log('MyCars: User not authenticated, redirecting to login');
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    // Fetch user's cars
    useEffect(() => {
        if (!isAuthenticated()) return;        const fetchMyCars = async () => {
            try {
                setLoading(true);
                const token = getAuthToken();
                console.log('MyCars: Token retrieved:', token ? 'Present' : 'Missing');                console.log('MyCars: Making request to:', `${config.API_URL}/api/cars/my-cars`);
                const response = await axios.get(`${config.API_URL}/api/cars/my-cars`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('MyCars: API response:', response.data);
                setCars(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching my cars:', error);
                if (error.response?.status === 401) {
                    setError('Authentication required. Please log in again.');
                    navigate('/login');
                } else {
                    setError('Failed to load your cars. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };        fetchMyCars();
    }, [isAuthenticated, navigate, getAuthToken]);

    // Handle car deletion
    const handleDelete = async (carId) => {
        if (!window.confirm('Are you sure you want to delete this car?')) {
            return;
        }

        try {
            await deleteCar(carId);
            // Remove the deleted car from the local state
            setCars(prevCars => prevCars.filter(car => car.id !== carId));
        } catch (error) {
            console.error('Error deleting car:', error);
            alert('Failed to delete car. Please try again.');
        }
    };    // Handle car update
    const handleUpdate = (carId) => {
        navigate(`/UpdateCar/${carId}`);
    };    // Add sorting function
    const sortCars = (carsToSort, sortMethod) => {
        return [...carsToSort].sort((a, b) => {
            switch (sortMethod) {
                case 'newest':
                    return new Date(b.createdAt || b.year) - new Date(a.createdAt || a.year);
                case 'oldest':
                    return new Date(a.createdAt || a.year) - new Date(b.createdAt || b.year);
                case 'price-high':
                    return parseFloat(b.price || 0) - parseFloat(a.price || 0);
                case 'price-low':
                    return parseFloat(a.price || 0) - parseFloat(b.price || 0);
                case 'name':
                    return `${a.brand?.name || a.make} ${a.model}`.localeCompare(`${b.brand?.name || b.make} ${b.model}`);
                default:
                    return 0;
            }
        });
    };

    // Add filtering function
    const filterCars = (carsToFilter, filterMethod) => {
        if (filterMethod === 'all') return carsToFilter;
        return carsToFilter.filter(car => {
            switch (filterMethod) {
                case 'electric':
                    return car.fuelType?.toLowerCase().includes('electric');
                case 'hybrid':
                    return car.fuelType?.toLowerCase().includes('hybrid');
                case 'gasoline':
                    return car.fuelType?.toLowerCase().includes('gasoline') || car.fuelType?.toLowerCase().includes('gas');
                case 'diesel':
                    return car.fuelType?.toLowerCase().includes('diesel');
                default:
                    return true;
            }
        });
    };

    // Process cars with sorting and filtering
    const processedCars = sortCars(filterCars(cars, filterBy), sortBy);

    if (!isAuthenticated()) {
        return (
            <div className="my-cars-container">
                <div className="error-state">
                    <div className="error-icon">🔒</div>
                    <h2>Please log in to view your cars</h2>
                    <p>You need to be logged in to see your personal car collection.</p>
                    <button 
                        className="add-first-car-btn"
                        onClick={() => navigate('/login')}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="my-cars-container">
                <div className="my-cars-loading">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading your cars...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-cars-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h2>Oops! Something went wrong</h2>
                    <p>{error}</p>
                    <button 
                        className="add-first-car-btn"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }    return (
        <div className="my-cars-container">
            {/* Header Section */}
            <div className="my-cars-header">
                <h1>My Car Collection</h1>
                <p className="welcome-message">Welcome back, {currentUser?.username}! 🚗</p>
                {cars.length > 0 && (
                    <p className="cars-count">
                        You have {cars.length} car{cars.length !== 1 ? 's' : ''} in your collection
                    </p>
                )}
            </div>            {/* Action Bar with Stats */}
            {cars.length > 0 && (
                <>
                    <div className="my-cars-actions">
                        <div className="my-cars-stats">
                            <div className="stat-item">
                                <span className="number">{processedCars.length}</span>
                                <span className="label">Showing Cars</span>
                            </div>
                            <div className="stat-item">
                                <span className="number">
                                    {cars.reduce((sum, car) => sum + parseFloat(car.price || 0), 0).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        maximumFractionDigits: 0
                                    })}
                                </span>
                                <span className="label">Total Value</span>
                            </div>
                            <div className="stat-item">
                                <span className="number">
                                    {new Set(cars.map(car => car.brand?.name || car.make)).size}
                                </span>
                                <span className="label">Brands</span>
                            </div>
                        </div>
                        <button 
                            className="add-car-button"
                            onClick={() => navigate('/AddCar')}
                        >
                            Add New Car
                        </button>
                    </div>

                    {/* Sorting and Filtering Controls */}
                    <div className="my-cars-controls">
                        <div className="control-group">
                            <label htmlFor="sortBy">Sort by:</label>
                            <select 
                                id="sortBy"
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="control-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="name">Name A-Z</option>
                            </select>
                        </div>
                        
                        <div className="control-group">
                            <label htmlFor="filterBy">Filter by fuel:</label>
                            <select 
                                id="filterBy"
                                value={filterBy} 
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="control-select"
                            >
                                <option value="all">All Types</option>
                                <option value="electric">Electric</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="gasoline">Gasoline</option>
                                <option value="diesel">Diesel</option>
                            </select>
                        </div>
                    </div>
                </>            )}

            {/* Cars Grid or Empty State */}
            {cars.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏎️</div>
                    <h2>No cars in your collection yet</h2>
                    <p>Start building your dream car collection by adding your first vehicle!</p>
                    <button 
                        className="add-first-car-btn" 
                        onClick={() => navigate('/AddCar')}
                    >
                        Add Your First Car
                    </button>
                </div>
            ) : (
                <div className="my-cars-grid">
                    {processedCars.map((car) => (
                        <div key={car.id} className="my-car-card">
                            <img 
                                className="car-image"
                                src={car.img || '/api/placeholder/350/220'}
                                alt={`${car.brand?.name || car.make} ${car.model}`}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/350x220/f0f0f0/999999?text=No+Image';
                                }}
                            />
                            <div className="car-content">
                                <h3 className="car-title">
                                    {car.brand?.name || car.make} {car.model}
                                </h3>
                                
                                <div className="car-details">
                                    <div className="detail-item">
                                        <span className="icon">📅</span>
                                        <span>{car.year}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="icon">⛽</span>
                                        <span>{car.fuelType}</span>
                                    </div>
                                </div>
                                
                                <div className="car-price">
                                    ${parseFloat(car.price || 0).toLocaleString()}
                                </div>
                                
                                <div className="car-actions">
                                    <button 
                                        className="action-btn view-btn"
                                        onClick={() => navigate(`/cars/${car.id}`)}
                                    >
                                        👁️ View
                                    </button>
                                    <button 
                                        className="action-btn edit-btn"
                                        onClick={() => handleUpdate(car.id)}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button 
                                        className="action-btn delete-btn"
                                        onClick={() => handleDelete(car.id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCars;
