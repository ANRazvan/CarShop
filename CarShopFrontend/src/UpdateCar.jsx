import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AddCar.css";
import config from "./config.js";
import CarOperationsContext from './CarOperationsContext.jsx';
import { getDisplayUrl, revokeObjectUrl } from './utils/imageHelpers.js';

const UpdateCar = () => {
    const { id } = useParams(); // Get the car ID from the URL
    const navigate = useNavigate(); // Get navigate function
    const { updateCar } = useContext(CarOperationsContext);

    const [car, setCar] = useState(null); // State to store car details
    const [errors, setErrors] = useState({}); // State for error messages
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [isImageModified, setIsImageModified] = useState(false); // Track if image was modified

    useEffect(() => {
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
            if (navigator.onLine) {
                try {
                    const response = await axios.get(`${config.API_URL}/api/cars/${id}`);
                    setCar(response.data);
                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching car details from server:", error);

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
        
        // Cleanup function to revoke any object URLs
        return () => {
            if (car && car.img instanceof File) {
                revokeObjectUrl(URL.createObjectURL(car.img));
            }
        };
    }, [id]);

    const validateForm = () => {
        let newErrors = {};
        
        // Validate required fields
        if (!car.make?.trim()) newErrors.make = "Make is required.";
        if (!car.model?.trim()) newErrors.model = "Model is required.";
        if (!car.year || car.year < 1886 || car.year > new Date().getFullYear())
            newErrors.year = "Enter a valid year.";
        if (!car.price || car.price <= 0) newErrors.price = "Enter a valid price.";
        if (!car.description?.trim()) newErrors.description = "Description is required.";
        // Only validate img if it was removed (since we already have an image)
        if (isImageModified && !car.img) newErrors.img = "Image is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Returns true if no errors
    };

    const handleChange = (e) => {
        setCar({ ...car, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" }); // Clear errors on change
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (!allowedTypes.includes(file.type)) {
                setErrors({ ...errors, img: "Only JPG and PNG files are allowed." });
                return;
            }

            // Validate file size (max 2MB)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors({ ...errors, img: "Image size must be less than 2MB." });
                return;
            }

            // Store the actual file object
            setCar({ ...car, img: file });
            setIsImageModified(true);
            setErrors({ ...errors, img: "" }); // Clear image errors
        }
    };

    const removeImage = () => {
        setCar((prevCar) => ({ ...prevCar, img: null }));
        setIsImageModified(true);
        setErrors({ ...errors, img: "Image is required." });
    };  
    
    const handleSubmit = () => {
        if (!validateForm()) {
            return; // Don't proceed if validation fails
        }

        const formData = new FormData();
        
        // Append basic car details
        formData.append("make", car.make);
        formData.append("model", car.model);
        formData.append("year", car.year);
        formData.append("keywords", car.keywords || "");
        formData.append("description", car.description);
        formData.append("fuelType", car.fuelType);
        formData.append("price", car.price);
        
        // Include original brandId if it exists
        if (car.brandId) {
            formData.append("brandId", car.brandId);
        }

        // Handle image upload
        if (isImageModified && car.img instanceof File) {
            // If a new image is selected
            formData.append("image", car.img);
            console.log("Uploading new image:", car.img.name);
        } else if (car.img && !isImageModified) {
            // If using existing image, send the image ID/path
            // The backend will know to keep the existing image
            formData.append("keepExistingImage", "true");
            console.log("Keeping existing image");
        }

        console.log("Submitting car update with form data:", {
            id: car.id,
            make: car.make,
            model: car.model,
            hasImage: !!car.img,
            isNewImage: isImageModified && car.img instanceof File,
            formDataKeys: Array.from(formData.keys())
        });
        
        if (updateCar) {
            updateCar(car.id, formData)
                .then((response) => {
                    console.log("Car updated successfully:", response);
                    alert("Car updated successfully!");
                    navigate('/'); // Redirect to the home page
                })
                .catch((updateError) => {
                    console.error("Error updating car:", updateError);
                    
                    // Handle specific error types
                    if (updateError.response) {
                        // The request was made and the server responded with an error status
                        if (updateError.response.status === 401) {
                            setErrors(prev => ({ 
                                ...prev, 
                                submit: "Authentication error: You need to log in again." 
                            }));
                            alert("Your session has expired. Please log in again.");
                            navigate('/login'); // Redirect to login page
                            return;
                        } else if (updateError.response.status === 403) {
                            setErrors(prev => ({ 
                                ...prev, 
                                submit: "Permission denied: You don't have permission to update this car." 
                            }));
                            return;
                        }
                    }
                    
                    // Generic error handling
                    setErrors(prev => ({ 
                        ...prev, 
                        submit: "Failed to update car. Please try again." 
                    }));
                });
        } else {
            console.error("Update car function not available in context");
            setErrors(prev => ({ ...prev, submit: "Update functionality is not available." }));
        }
    };

    const handleCancel = () => {
        navigate('/'); // Cancel the update and go back to the home page
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!car) return <p>Car not found</p>;

    return (
        <div className="add-car-container">
            <h2>Update Car Details</h2>
            <div className="input-group">
                <input
                    type="text"
                    name="make"
                    placeholder="Make"
                    value={car.make || ""}
                    onChange={handleChange}
                />
                {errors.make && <p className="error">{errors.make}</p>}

                <input
                    type="text"
                    name="model"
                    placeholder="Model"
                    value={car.model || ""}
                    onChange={handleChange}
                />
                {errors.model && <p className="error">{errors.model}</p>}

                <input
                    type="number"
                    name="year"
                    placeholder="Year"
                    value={car.year || ""}
                    onChange={handleChange}
                />
                {errors.year && <p className="error">{errors.year}</p>}

                <select name="fuelType" value={car.fuelType || ""} onChange={handleChange}>
                    <option value="">Select Fuel Type</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                </select>

                <input
                    type="text"
                    name="keywords"
                    placeholder="Keywords"
                    value={car.keywords || ""}
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={car.price || ""}
                    onChange={handleChange}
                />
                {errors.price && <p className="error">{errors.price}</p>}
            </div>

            <div className="image-preview">
                {car.img ? (
                    <>                <img 
                            src={getDisplayUrl(car.img, 'https://www.shutterstock.com/shutterstock/photos/473088025/display_1500/stock-vector-car-logo-icon-emblem-design-vector-illustration-473088025.jpg')}
                            alt={`${car.make} ${car.model}`} 
                            onError={(e) => {
                                console.log("Image failed to load:", e.target.src);
                                e.target.onerror = null;
                                e.target.src = 'https://www.shutterstock.com/shutterstock/photos/473088025/display_1500/stock-vector-car-logo-icon-emblem-design-vector-illustration-473088025.jpg';
                            }}
                        />
                        <button className="remove-image" onClick={removeImage}>Remove Image</button>
                    </>
                ) : (
                    <>
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                        {errors.img && <p className="error">{errors.img}</p>}
                    </>
                )}
            </div>

            <textarea
                name="description"
                placeholder="Enter description..."
                value={car.description || ""}
                onChange={handleChange}
            ></textarea>
            {errors.description && <p className="error">{errors.description}</p>}

            {errors.submit && <p className="error submit-error">{errors.submit}</p>}

            <div className="button-group">
                <button className="add-car" onClick={handleSubmit}>Update Car</button>
                <button className="cancel" onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default UpdateCar;
