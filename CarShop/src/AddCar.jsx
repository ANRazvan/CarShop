import React, { useState } from "react";
import "./AddCar.css";
import { useNavigate } from "react-router-dom";

const AddCar = ({ id, cars, setcars }) => {
    const [car, setCar] = useState({
        make: "",
        model: "",
        year: "",
        keywords: "",
        description: "",
        price: "",
        img: "",
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

            const imageUrl = `/${file.name}`; // Assuming images are stored in public folder
            setCar({ ...car, img: imageUrl });
            setErrors({ ...errors, img: "" }); // Clear image errors
        }
    };

    const removeImage = () => {
        setCar((prevCar) => ({ ...prevCar, img: "" }));
        setErrors({ ...errors, img: "Image is required." });
    };

    const handleSubmit = () => {
        if (validateForm()) {
            console.log("Car Added:", car);
            setcars([...cars, car]);
            alert("Car successfully added!"); // Show success message
            setCar({
                make: "",
                model: "",
                year: "",
                keywords: "",
                description: "",
                price: "",
                img: "",
            }); // Reset form after submission
        }
        navigate('/');  
    };
    const handleCancel = () => {
        navigate('/');
    }

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
            </div>

            <div className="image-preview">
                {car.img ? (
                    <>
                        <img src={car.img} alt="Uploaded Car" />
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
                value={car.description}
                onChange={handleChange}
            ></textarea>
            {errors.description && <p className="error">{errors.description}</p>}

            <div className="button-group">
                <button className="add-car" onClick={handleSubmit}>Add Car</button>
                <button className="cancel"onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default AddCar;
