import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CarDetail.css';
import CarOperationsContext from './CarOperationsContext.jsx';

const CarDetail = () => {
    const { id } = useParams(); // Get car ID from URL
    const navigate = useNavigate(); // Get navigate function
    const [car, setCar] = useState(null); // State to store car details
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [isOnline, setIsOnline] = useState(navigator.onLine); // Online status
    const [serverAvailable, setServerAvailable] = useState(true); // Server availability

    // Get operations from context
    const operations = useContext(CarOperationsContext);
    const { deleteCar } = operations;

    // Log what we received from context to debug
    useEffect(() => {
        console.log('CarDetail: Context received:', {
            deleteCar: typeof operations.deleteCar === 'function',
            operations
        });
    }, [operations]);

    useEffect(() => {
        // Add online/offline event listeners
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Fetch car details from the server or cache
        const fetchCarDetails = async () => {
            setLoading(true);
            
            // Try to get from cache first
            const cachedData = localStorage.getItem('cachedCars');
            let cachedCar = null;
            
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                cachedCar = parsed.cars.find(c => c.id.toString() === id.toString());
            }
            
            // If online, try to get from server
            if (isOnline) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/cars/${id}`);
                    setCar(response.data);
                    setLoading(false);
                    setServerAvailable(true);
                } catch (error) {
                    console.error("Error fetching car details:", error);
                    setServerAvailable(false);
                    
                    // If server is down but we have cached data, use it
                    if (cachedCar) {
                        setCar(cachedCar);
                        setLoading(false);
                    } else {
                        setError("Car not found");
                        setLoading(false);
                    }
                }
            } else {
                // If offline and we have cached data, use it
                if (cachedCar) {
                    setCar(cachedCar);
                    setLoading(false);
                } else {
                    setError("You are offline and this car is not cached");
                    setLoading(false);
                }
            }
        };

        fetchCarDetails();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [id, isOnline]);

    const handleDelete = () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this car?");
        if (confirmDelete) {
            console.log(`Starting deletion process for car ID: ${id}`);
            
            if (typeof deleteCar !== 'function') {
                console.error("Delete car is not a function:", deleteCar);
                alert("Error: Delete function not available");
                return;
            }
            
            console.log("About to call deleteCar function");
            
            try {
                deleteCar(id)
                    .then(() => {
                        console.log("Delete operation completed");
                        alert("Car deleted successfully!");
                        navigate('/');
                    })
                    .catch((error) => {
                        console.error("Error in delete operation:", error);
                        alert("Failed to delete car.");
                    });
            } catch (error) {
                console.error("Exception during delete operation:", error);
                alert("An unexpected error occurred while trying to delete the car.");
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="car-container">
            {(!isOnline || !serverAvailable) && (
                <div className="offline-mode-indicator">
                    {!isOnline ? 'You are offline - Changes will be synced when you reconnect' : 
                               'Server is unavailable - Changes will be synced when the server is back'}
                </div>
            )}

            <div className="car-main">
                <img
                    src={car.img ? 
                        (car.img.startsWith('http') 
                            ? car.img 
                            : `http://localhost:5000/uploads/${car.img}`) 
                        : 'https://via.placeholder.com/800x600?text=No+Image'}
                    alt={`${car.make} ${car.model}`}
                    className="car-image"
                    onError={(e) => {
                        console.log("Image failed to load:", e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
                    }}
                />
                <div className="car-details">
                    <h1 className="car-title">{car.make} {car.model}</h1>
                    <p className="car-subtitle">{car.keywords}</p>
                    <h2 className="price">${car.price}</h2>
                    <div className="button-group">
                        <button className="add-to-cart">Add to cart</button>
                        <button className="delete" onClick={handleDelete}>Delete</button>
                        <button className="update" onClick={() => navigate(`/UpdateCar/${car.id}`)}>Update</button>
                    </div>
                </div>
            </div>

            <div className="description">
                <h3>Description</h3>
                <p>{car.description}</p>
            </div>
            
            {car._isTemp && (
                <div className="temp-indicator">
                    This car was added while offline and will be synchronized with the server when you reconnect.
                </div>
            )}
        </div>
    );
};

export default CarDetail;