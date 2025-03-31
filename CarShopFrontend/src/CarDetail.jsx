import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import carService from './services/CarService';
import './CarDetail.css';

const CarDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch car details using our service
        const fetchCar = async () => {
            try {
                const data = await carService.getCarById(id);
                if (data) {
                    setCar(data);
                } else {
                    setError("Car not found");
                }
            } catch (err) {
                console.error("Error fetching car details:", err);
                setError("Error loading car details");
            } finally {
                setLoading(false);
            }
        };
        
        fetchCar();
    }, [id]);

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this car?");
        if (confirmDelete) {
            try {
                await carService.deleteCar(id);
                alert("Car deleted successfully!");
                navigate('/');
            } catch (error) {
                console.error("Error deleting car:", error);
                alert("Car will be deleted when back online");
                navigate('/');
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="car-container">
            <div className="car-main">
                <img
                    src={`http://localhost:5000/uploads/${car.img}`}
                    alt={`${car.make} ${car.model}`}
                    className="car-image"
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
        </div>
    );
};

export default CarDetail;
