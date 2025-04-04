import React, { memo } from "react";
import "./CarList.css";
import { Link } from "react-router-dom";
import Statistics from "./Statistics.jsx";

// Define the component first
const CarListComponent = ({ 
    cars, 
    loading,
    currentPage, 
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    sortMethod,
    setSortMethod
}) => {
    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = parseInt(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const handleSortMethodChange = (event) => {
        setSortMethod(event.target.value);
        setCurrentPage(1); // Reset to first page when changing sort method
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div>
            <Statistics cars={cars} />
            <div className="controls">
                <label>
                    Items per page:
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={16}>16</option>
                    </select>
                </label>
                <label>
                    Sort by:
                    <select value={sortMethod} onChange={handleSortMethodChange}>
                        <option value="">None</option>
                        <option value="price-asc">Price (Low to High)</option>
                        <option value="price-desc">Price (High to Low)</option>
                        <option value="year-asc">Year (Old to New)</option>
                        <option value="year-desc">Year (New to Old)</option>
                    </select>
                </label>
            </div>

            <div className="car-list">
                {loading ? (
                    <div className="car-list-loading">
                        <div className="spinner"></div>
                        <p>Loading cars...</p>
                    </div>
                ) : cars.length === 0 ? (
                    <div className="centered-div">
                        <div className="no-cars-message">
                            <h2>No cars available</h2>
                            <p>Try adjusting your search criteria or check back later.</p>
                        </div>
                    </div>
                ) : (
                    cars.map((car) => (
                        <div key={car.id} className="car-card">
                            <Link to={`/CarDetail/${car.id}`} className="detail-link">
                                <img
                                    className="car-img"
                                    src={`http://localhost:5000/uploads/${car.img}`}
                                    alt={car.model}
                                    loading="lazy"
                                />
                                <h3>{car.make}</h3>
                                <h4>{car.model}</h4>
                                <p>{car.keywords}</p>
                                <p className="price">${car.price}</p>
                            </Link>
                        </div>
                    ))
                )}
            </div>

            <div className="pagination">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading}>
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        className={currentPage === index + 1 ? "active" : ""}
                        onClick={() => goToPage(index + 1)}
                        disabled={loading}
                    >
                        {index + 1}
                    </button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                    Next
                </button>
            </div>
        </div>
    );
};

// Then wrap it with memo
const CarList = memo(CarListComponent);

export default CarList;
