import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import carService from "./services/CarService";
import "./AddCar.css";

const UpdateCar = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [car, setCar] = useState(null);
    const [errors, setErrors] = useState({});
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
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setCar({ ...car, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
            if (!allowedTypes.includes(file.type)) {
                setErrors({ ...errors, img: "Only JPG and PNG files are allowed." });
                return;
            }

            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors({ ...errors, img: "Image size must be less than 2MB." });
                return;
            }

            const imageUrl = URL.createObjectURL(file);
            setCar({ ...car, img: imageUrl });
            setErrors({ ...errors, img: "" });
        }
    };

    const removeImage = () => {
        setCar((prevCar) => ({ ...prevCar, img: "" }));
        setErrors({ ...errors, img: "Image is required." });
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            await carService.updateCar(id, car);
            alert("Car updated successfully!");
            navigate('/');
        } catch (error) {
            console.error("Error updating car:", error);
            alert("Update saved locally and will sync when you're back online.");
            navigate('/');
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="add-car-container">
            <h2>Update Car Details</h2>
            <div className="input-group">
                <input
                    type="text"
                    name="make"
                    placeholder="Make"
                    value={car.make}
                    onChange={handleChange}
                />
                {errors.make && <p className="error">{errors.make}</p>}

                <input
                    type="text"
                    name="model"
                    placeholder="Model"
                    value={car.model}
                    onChange={handleChange}
                />
                {errors.model && <p className="error">{errors.model}</p>}

                <input
                    type="number"
                    name="year"
                    placeholder="Year"
                    value={car.year}
                    onChange={handleChange}
                />
                {errors.year && <p className="error">{errors.year}</p>}

                <select name="fuelType" value={car.fuelType} onChange={handleChange}>
                    <option value="">Select Fuel Type</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Gas">Gas</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                </select>

                <input
                    type="text"
                    name="keywords"
                    placeholder="Keywords"
                    value={car.keywords}
                    onChange={handleChange}
                />

                <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={car.price}
                    onChange={handleChange}
                />
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
                <button className="add-car" onClick={handleSubmit}>Update Car</button>
                <button className="cancel" onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default UpdateCar;
