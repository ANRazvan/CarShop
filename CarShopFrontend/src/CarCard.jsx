import React, { useState } from "react";
import "./CarList.css"; // Using the same CSS file as CarList
import { Link, useNavigate } from "react-router-dom";
import config from "./config.js";
import { useCart } from "./CartContext";
import { useAuth } from "./hooks/useAuth";

const CarCard = ({ car, onDelete, onUpdate, isOffline }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCar, setEditedCar] = useState({ ...car });
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  // Display a placeholder image if the car image is not available
  const imageUrl = car.img || "/placeholder.jpeg";

  const handleCardClick = () => {
    navigate(`/cars/${car.id}`);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedCar({ ...car });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedCar({ ...editedCar, [name]: value });
  };

  const handleSave = () => {
    onUpdate(car.id, editedCar);
    setIsEditing(false);
  };
  const handleDelete = () => {
    onDelete(car.id);
  };
  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking the button
    
    if (!isAuthenticated()) {
      alert('Please log in to add items to your cart');
      return;
    }

    // Check if user is trying to add their own car
    if (currentUser && car.userId === currentUser.id) {
      alert('You cannot add your own car to the cart');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(car.id);
      alert('Car added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.message || 'Failed to add car to cart');
    } finally {
      setAddingToCart(false);
    }
  };
  return (
    <div 
      className={`car-card ${car._isTemp ? "car-card-temp" : ""}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {isEditing ? (
        <div className="car-card-editing">
          <div className="edit-field">
            <label>Make:</label>
            <input
              type="text"
              name="make"
              value={editedCar.make}
              onChange={handleChange}
            />
          </div>
          <div className="edit-field">
            <label>Model:</label>
            <input
              type="text"
              name="model"
              value={editedCar.model}
              onChange={handleChange}
            />
          </div>
          <div className="edit-field">
            <label>Year:</label>
            <input
              type="number"
              name="year"
              value={editedCar.year}
              onChange={handleChange}
            />
          </div>
          <div className="edit-field">
            <label>Price:</label>
            <input
              type="number"
              name="price"
              value={editedCar.price}
              onChange={handleChange}
              step="1000"
            />
          </div>
          <div className="edit-field">
            <label>Fuel Type:</label>
            <select
              name="fuelType"
              value={editedCar.fuelType}
              onChange={handleChange}
            >
              <option value="Gasoline">Gasoline</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div className="card-actions">
            <button onClick={handleSave} className="edit-button">Save</button>
            <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="car-image">
            <img src={imageUrl} alt={`${car.make} ${car.model}`} />
            {car._isTemp && <div className="temp-badge">Offline</div>}
          </div>
          <div className="car-info">            
            <h3>{car.make} {car.model}</h3>
            <p>Year: {car.year}</p>
            <p>Price: ${car.price?.toLocaleString()}</p>
            <p>Fuel Type: {car.fuelType}</p>
            {car.owner && <p className="car-owner">Owner: {car.owner.username}</p>}            
            <div className="card-actions">
              {isAuthenticated() && currentUser?.id !== car.userId && (
                <button 
                  onClick={handleAddToCart} 
                  className="cart-button"
                  disabled={addingToCart || isOffline}
                  title="Add to cart"
                >
                  {addingToCart ? '⏳' : '🛒'} {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              )}
              {/* <button onClick={handleEdit} className="edit-button" disabled={isOffline}>Edit</button> */}
              {/* <button onClick={handleDelete} className="delete-button">Delete</button> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CarCard;
