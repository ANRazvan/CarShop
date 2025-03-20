import React from 'react';
import { useParams } from 'react-router-dom'; 
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom'; 
import { useNavigate } from 'react-router-dom';
import './CarDetail.css';

const CarDetail = ({ cars, setcars }) => {
const CarDetail = ({ cars, setcars }) => {
    const { id } = useParams(); // Get car ID from URL
    const car = cars.find(car => car.id === parseInt(id)); // Find the car by ID
    const navigate = useNavigate(); // Get navigate function
    const navigate = useNavigate(); // Get navigate function

    if (!car) {
        return <p>Car not found</p>; // If no car is found, show this message
    }

    // Delete car function
    const handleDelete = () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this car?");
        if (confirmDelete) {
            // Delete the car from the cars list
            setcars(cars.filter(c => c.id !== car.id)); // Update the cars list by removing the car
            navigate('/'); // Redirect to home page or another page after deletion
        }
    };

    // Update car function
    const handeUpdate = () => {
        navigate(`/update/${id}`); // Redirect to the update page with the car ID
    };

    // Delete car function
    const handleDelete = () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this car?");
        if (confirmDelete) {
            // Delete the car from the cars list
            setcars(cars.filter(c => c.id !== car.id)); // Update the cars list by removing the car
            navigate('/'); // Redirect to home page or another page after deletion
        }
    };

    return (
        <div className="car-container">
            <div className="car-main">
                <img
                    src={`/${car.img}`}
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
                        <Link to={`/UpdateCar/${car.id}`} className="update-link">
                        <button className="update">Update</button>  
                        </Link>
                        <button className="delete" onClick={handleDelete}>Delete</button>
                        <button className="edit">Edit</button>
                    </div>
                </div>
            </div>

            <div className="description">
                <h3>Description</h3>
                <p>{car.description}</p>
            </div>

            <div className="related-products">
                <h3>Related products</h3>
                <div className="related-list">
                    {cars
                        .filter(p => p.id !== car.id && p.make === car.make) // Filter by make and exclude the current car
                        .slice(0, 4) // Limit to a maximum of 4 related cars
                        .map((related) => (
                            <div key={related.id} className="related-item">
                                <img src={`/${related.img}`} alt={`${related.make} ${related.model}`} className="related-image" />
                                <p className="related-title">{related.make} {related.model}</p>
                                <p className="related-subtitle">{related.keywords}</p>
                                <p className="price">${related.price}</p>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default CarDetail;
