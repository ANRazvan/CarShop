import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "./config.js";
import { useAuth } from "./hooks/useAuth";
import CarCard from "./CarCard.jsx";
import CarOperationsContext from './CarOperationsContext.jsx';
import "./CarList.css"; // Reuse the CarList styles

const MyCars = () => {    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                console.log('MyCars: Token retrieved:', token ? 'Present' : 'Missing');
                console.log('MyCars: Making request to:', `${config.API_URL}/api/cars/my-cars`);
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
    };

    if (!isAuthenticated()) {
        return (
            <div className="car-list">
                <div className="centered-div">
                    <div className="no-cars-message">
                        <h2>Please log in to view your cars</h2>
                        <p>You need to be logged in to see your personal car collection.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="car-list">
                <div className="car-list-loading">
                    <div className="spinner"></div>
                    <p>Loading your cars...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="car-list">
                <div className="centered-div">
                    <div className="no-cars-message">
                        <h2>Error</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="car-list">
            <div className="my-cars-header">
                <h1>My Cars</h1>
                <p>Welcome back, {currentUser?.username}! Here are your cars.</p>
                {cars.length > 0 && (
                    <p className="cars-count">You have {cars.length} car{cars.length !== 1 ? 's' : ''} in your collection.</p>
                )}
            </div>

            {cars.length === 0 ? (
                <div className="centered-div">
                    <div className="no-cars-message">
                        <h2>No cars found</h2>
                        <p>You haven't added any cars yet. Start by adding your first car!</p>                        <button 
                            className="add-car-btn" 
                            onClick={() => navigate('/AddCar')}
                        >
                            Add Your First Car
                        </button>
                    </div>
                </div>
            ) : (
                <div className="car-list-container">
                    <div className="car-cards">
                        {cars.map((car) => (
                            <CarCard
                                key={car.id}
                                car={car}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                                isOffline={false}
                                showOwnerActions={true} // Show edit/delete buttons since these are user's cars
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCars;
