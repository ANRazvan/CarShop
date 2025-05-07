import React, { memo, useEffect, useState } from "react";
import "./CarList.css";
import { Link } from "react-router-dom";
import config from "./config.js";

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
    setSortMethod,
    isOffline,
    createCar,
    updateCar,
    deleteCar,
    disableSortAndFilter
}) => {
    // Add a local timeout for loading states
    const [localLoadingTimeout, setLocalLoadingTimeout] = useState(null);
    
    // Setup a fail-safe for loading state
    useEffect(() => {
        if (loading) {
            const timeout = setTimeout(() => {
                console.log("CarList: Local loading timeout triggered");
                // We don't modify the parent's loading state directly 
                // but we can render our own loading-free UI
                setLocalLoadingTimeout(true);
            }, 5000); // 5 seconds timeout
            
            return () => clearTimeout(timeout);
        } else {
            setLocalLoadingTimeout(false);
        }
    }, [loading]);
    
    // Add debugging for props
    useEffect(() => {
        console.log("CarList rendered with:", { 
            carsCount: cars?.length, 
            loading, 
            currentPage, 
            totalPages,
            isOffline
        });
    }, [cars, loading, currentPage, totalPages, isOffline]);

    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = event.target.value === "unlimited" ? Infinity : parseInt(event.target.value);
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

    const handleDelete = (carId) => {
        if (window.confirm("Are you sure you want to delete this car?")) {
            deleteCar(carId)
                .then((response) => {
                    // Check if we're offline by looking at the response message
                    if (response?.data?.message?.includes('offline') || 
                        response?.data?.message?.includes('marked for deletion')) {
                        alert("Car has been removed from local view and will be deleted from the server when you're back online.");
                    } else {
                        // Normal online deletion
                        console.log("Car deleted successfully on server");
                    }
                })
                .catch(error => {
                    console.error("Error deleting car:", error);
                    alert("Failed to delete car");
                });
        }
    };

    const handleUpdate = (carId, updatedData) => {
        if (window.confirm("Are you sure you want to update this car?")) {
            updateCar(carId, updatedData)
                .then(() => {
                    console.log("Car updated successfully");
                    alert("Car updated successfully!");
                })
                .catch(error => {
                    console.error("Error updating car:", error);
                    alert("Failed to update car");
                });
        }
    };

    // Check if cars is undefined or null and handle it
    if (!cars) {
        return <div className="car-list-error">Error: No cars data available</div>;
    }

    return (
        <div>
            {isOffline && (
                <div className="offline-indicator">
                    <span className="offline-icon">⚠️</span>
                    <span>Working in offline mode</span>
                </div>
            )}
            
            <div className="controls-wrapper">
                <div className="controls">
                    <div className="control-item">
                        <label htmlFor="itemsPerPage">Items per page:</label>
                        <select 
                            id="itemsPerPage"
                            value={itemsPerPage === Infinity ? "unlimited" : itemsPerPage} 
                            onChange={handleItemsPerPageChange}
                            className={disableSortAndFilter ? "disabled-appearance" : ""}
                        >
                            <option value={4}>4</option>
                            <option value={8}>8</option>
                            <option value={12}>12</option>
                            <option value={16}>16</option>
                            <option value="unlimited">Unlimited</option>
                        </select>
                    </div>
                    
                    <div className="control-item">
                        <label htmlFor="sortMethod">Sort by:</label>
                        <select 
                            id="sortMethod"
                            value={sortMethod} 
                            onChange={handleSortMethodChange}
                            disabled={disableSortAndFilter}
                        >
                            <option value="">Default</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="year-asc">Year (Old to New)</option>
                            <option value="year-desc">Year (New to Old)</option>
                        </select>
                        
                        {disableSortAndFilter && (
                            <div className="filter-disabled-message">
                                Sorting is disabled in offline mode
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="car-list">
                {(loading && !localLoadingTimeout) ? (
                    <div className="car-list-loading">
                        <div className="spinner"></div>
                        <p>Loading cars...</p>
                        <p className="loading-details">Please wait while we retrieve the car data</p>
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
                        <div key={car.id} className={`car-card ${car._isTemp ? 'temp-item' : ''}`}>
                            <Link to={`/CarDetail/${car.id}`} className="detail-link">
                                <img
                                    className="car-img"
                                    src={car.img ? 
                                        (car.img.startsWith('data:') 
                                            ? car.img // Use Base64 data directly
                                            : car.img.startsWith('http') 
                                                ? car.img 
                                                : `${config.UPLOADS_PATH}${car.img}`) 
                                        : '/placeholder.jpeg'}
                                    alt={car.model}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null; // Prevent infinite loop
                                        e.target.src = '/placeholder.jpeg'; // Use local placeholder image
                                    }}
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

            {!disableSortAndFilter && (
                <div className="pagination-controls">
                    <div className="pagination">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loading}>
                            Previous
                        </button>
                        {(() => {
                            const pages = [];
                            const maxPagesToShow = 3; // Number of pages to show on each side
                            
                            // Always show first page
                            if (totalPages > 0) {
                                pages.push(
                                    <button
                                        key={1}
                                        className={currentPage === 1 ? "active" : ""}
                                        onClick={() => goToPage(1)}
                                        disabled={loading}
                                    >
                                        1
                                    </button>
                                );
                            }
                            
                            // If there are many pages, add ellipsis after page 2
                            if (currentPage > maxPagesToShow + 1) {
                                pages.push(<span key="ellipsis-1" className="pagination-ellipsis">...</span>);
                            } else if (totalPages > 2) {
                                // Show page 2 if we're close to the beginning
                                pages.push(
                                    <button
                                        key={2}
                                        className={currentPage === 2 ? "active" : ""}
                                        onClick={() => goToPage(2)}
                                        disabled={loading}
                                    >
                                        2
                                    </button>
                                );
                            }
                            
                            // Pages around current page
                            for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
                                // Only add if not too close to the beginning or end
                                if ((i > 2 && i < currentPage - 1) || (i < totalPages - 1 && i > currentPage + 1)) {
                                    continue;
                                }
                                
                                pages.push(
                                    <button
                                        key={i}
                                        className={currentPage === i ? "active" : ""}
                                        onClick={() => goToPage(i)}
                                        disabled={loading}
                                    >
                                        {i}
                                    </button>
                                );
                            }
                            
                            // Add ellipsis before last two pages if needed
                            if (currentPage < totalPages - maxPagesToShow) {
                                pages.push(<span key="ellipsis-2" className="pagination-ellipsis">...</span>);
                            }
                            
                            // Always show second-to-last page if there are enough pages
                            if (totalPages > 2) {
                                // Don't show if we already included it in the central section
                                if (totalPages - 1 > currentPage + 1) {
                                    pages.push(
                                        <button
                                            key={totalPages - 1}
                                            className={currentPage === totalPages - 1 ? "active" : ""}
                                            onClick={() => goToPage(totalPages - 1)}
                                            disabled={loading}
                                        >
                                            {totalPages - 1}
                                        </button>
                                    );
                                }
                            }
                            
                            // Always show last page if there's more than one page
                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        className={currentPage === totalPages ? "active" : ""}
                                        onClick={() => goToPage(totalPages)}
                                        disabled={loading}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }
                            
                            return pages;
                        })()}
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Then wrap it with memo
const CarList = memo(CarListComponent);

export default CarList;
