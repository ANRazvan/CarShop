import React, { useState } from "react";
import "./AddCar.css";

const AddCar = ({cars, setcars}) => {
    const [car, setCar] = useState({
        make: "",
        model: "",
        price: "",
        fuelType: "",
        description: "",
        keywords:"",
        image: "",
    });

    const handleChange = (e) => {
        setCar({ ...car, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setCar({ ...car, image: reader.result });  // Save the base64 image data to the state
            };

            reader.readAsDataURL(file);  // Read the file as a data URL
        }
    };

    const handleSubmit = () => {
        console.log("Car Added:", car);
        // Add the new car to the list of cars
        setcars([...cars, car]);  // Spread the existing cars and add the new car
    };

    return (
        <div className="add-car-container">
            <h2>Add a new car</h2>
            <div className="input-group">
                <input type="text" name="make" placeholder="Make" value={car.make} onChange={handleChange} />
                <input type="text" name="model" placeholder="Model" value={car.model} onChange={handleChange} />
                <input type="number" name="price" placeholder="Price" value={car.price} onChange={handleChange} />
                <select name="fuelType" value={car.fuelType} onChange={handleChange}>
                    <option value="">Select Fuel Type</option>
                    <option value="Gas">Gas</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                </select>
            </div>

            <div className="image-preview">
                <img src={car.image} alt={`Image uploaded`} />
                <input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>

            <textarea
                name="description"
                placeholder="Enter description..."
                value={car.description}
                onChange={handleChange}
            ></textarea>

            <div className="button-group">
                <button className="add-image">Add Image</button>
                <button className="add-car" onClick={handleSubmit}>Add car</button>
                <button className="cancel">Cancel</button>
            </div>
        </div>
    );
};

export default AddCar;
