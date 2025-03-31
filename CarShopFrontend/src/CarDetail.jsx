import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CarDetail.css';

const CarDetail = () => {
    const { id } = useParams(); // Get car ID from URL
    const navigate = useNavigate(); // Get navigate function
    const [car, setCar] = useState(null); // State to store car details
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state

    useEffect(() => {
        // Fetch car details from the server
        axios.get(`http://localhost:5000/api/cars/${id}`)
            .then((response) => {
                setCar(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching car details:", error);
                setError("Car not found");
                setLoading(false);
            });
    }, [id]);

    const handleDelete = () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this car?");
        if (confirmDelete) {
            axios.delete(`http://localhost:5000/api/cars/${id}`)
                .then(() => {
                    // No need to update local state, just redirect
                    alert("Car deleted successfully!");
                    navigate('/'); // Redirect to the home page
                })
                .catch((error) => {
                    console.error("Error deleting car:", error);
                    alert("Failed to delete car.");
                });
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
