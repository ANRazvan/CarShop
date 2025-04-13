import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddCar.css";
import config from "./config.js";
import CarOperationsContext from "./CarOperationsContext.jsx";

const AddCar = () => {
    const { createCar } = useContext(CarOperationsContext);
    const [car, setCar] = useState({
        make: "",
        model: "",
        year: "",
        keywords: "",
        description: "",
        price: "",
        fuelType: "",
        img: null, // Store the image file
    });

    const [errors, setErrors] = useState({}); // State for error messages
    const navigate = useNavigate(); // Get navigate function

    const validateForm = () => {
        let newErrors = {};
        if (!car.make.trim()) newErrors.make = "Make is required.";
        if (!car.model.trim()) newErrors.model = "Model is required.";
        if (!car.year || car.year < 1886 || car.year > new Date().getFullYear()) 
            newErrors.year = "Enter a valid year.";
        if (!car.price || car.price <= 0) newErrors.price = "Enter a valid price.";
        if (!car.description.trim()) newErrors.description = "Description is required.";
        if (!car.img) newErrors.img = "Image is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Returns true if no errors
    };

    const handleChange = (e) => {
        setCar({ ...car, [e.target.name]: e.target.value });
        setErrors(prevErrors => ({ ...prevErrors, [e.target.name]: "" })); // Clear errors on change
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prevErrors => ({ ...prevErrors, img: "Only JPG and PNG files are allowed." }));
                return;
            }

            // Validate file size (max 2MB)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors(prevErrors => ({ ...prevErrors, img: "Image size must be less than 2MB." }));
                return;
            }

            setCar({ ...car, img: file }); // Store the file
            setErrors(prevErrors => ({ ...prevErrors, img: "" })); // Clear image errors
        }
    };

    const removeImage = () => {
        setCar(prevCar => ({ ...prevCar, img: null }));
        setErrors(prevErrors => ({ ...prevErrors, img: "Image is required." }));
    };

    const handleSubmit = () => {
        // Validate the form first
        if (!validateForm()) {
            return; // Don't proceed if validation fails
        }
        
        const formData = new FormData();
        formData.append("make", car.make);
        formData.append("model", car.model);
        formData.append("year", car.year);
        formData.append("keywords", car.keywords);
        formData.append("description", car.description);
        formData.append("fuelType", car.fuelType);
        formData.append("price", car.price);
        
        let imgFile = null;
        if (car.img) {
            // Store the actual file for offline use
            imgFile = car.img;
            formData.append("image", car.img);
        }

        // Check if we're online and server is available
        const isOnline = navigator.onLine;
        // We'll need to check server availability or pass it as a prop
        
        // Use createCar from context
        if (createCar) {
            createCar(formData, {
                make: car.make,
                model: car.model,
                year: car.year,
                keywords: car.keywords,
                description: car.description,
                fuelType: car.fuelType,
                price: car.price,
                img: imgFile, // Store actual file or image data
                _isTemp: !isOnline, // Mark as temporary if offline
            })
            .then((response) => {
                console.log("Car added successfully:", response.data);
                navigate('/'); // Redirect to home page after successful addition
            })
            .catch((error) => {
                console.error("Error adding car:", error);
                setErrors(prev => ({ ...prev, submit: "Failed to add car. Please try again." }));
            });
        } else {
            // Fallback if context function not available
            axios.post(`${config.API_URL}/api/cars`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((response) => {
                console.log("Car added successfully:", response.data);
                navigate('/'); // Redirect to home page after successful addition
            })
            .catch((error) => {
                console.error("Error adding car:", error);
                setErrors(prev => ({ ...prev, submit: "Failed to add car. Please try again." }));
            });
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
        <div className="add-car-container">
            <h2>Add a new car</h2>
            <div className="input-group">
                <input type="text" name="make" placeholder="Make" value={car.make} onChange={handleChange} />
                {errors.make && <p className="error">{errors.make}</p>}

                <input type="text" name="model" placeholder="Model" value={car.model} onChange={handleChange} />
                {errors.model && <p className="error">{errors.model}</p>}

                <input type="number" name="year" placeholder="Year" value={car.year} onChange={handleChange} />
                {errors.year && <p className="error">{errors.year}</p>}

                <input type="text" name="keywords" placeholder="Keywords" value={car.keywords} onChange={handleChange} />

                <input type="number" name="price" placeholder="Price" value={car.price} onChange={handleChange} />
                {errors.price && <p className="error">{errors.price}</p>}

                <select name="fuelType" value={car.fuelType} onChange={handleChange}>
                    <option value="">Select Fuel Type</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                </select>
            </div>

            <div className="image-preview">
                {car.img ? (
                    <>
                        <img src={URL.createObjectURL(car.img)} alt="Uploaded Car" />
                        <button className="remove-image" onClick={removeImage}>Remove Image</button>
                    </>
                ) : (
                    <>
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                        {errors.img && <p className="error">{errors.img}</p> }
                    </>
                )}
            </div>

            <textarea
                name="description"
                placeholder="Enter description..."
                value={car.description}
                onChange={handleChange}
            ></textarea>
            {errors.description && <p className="error">{errors.description}</p>}

            {errors.submit && <p className="error submit-error">{errors.submit}</p>}

            <div className="button-group">
                <button className="add-car" onClick={handleSubmit}>Add Car</button>
                <button className="cancel" onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default AddCar;
