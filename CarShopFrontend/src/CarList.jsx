import React, { memo, useEffect, useState, useRef, useCallback } from "react";
import "./CarList.css";
import { Link } from "react-router-dom";
import config from "./config.js";
import InfiniteScroller from "./InfiniteScroller.jsx";
import { FixedSizeList as List } from 'react-window';
import CarCard from './CarCard.jsx';

// Define the component first
const CarListComponent = ({ 
    cars, 
    loading,
    currentPage, 
    setCurrentPage,
    totalPages,
    totalCars, // Added missing prop
    itemsPerPage,
    setItemsPerPage,
    sortMethod,
    setSortMethod,
    isOffline,
    createCar,
    updateCar,
    deleteCar,
    disableSortAndFilter,
    fetchInfiniteScrollCars // Add the infinite scroll fetch function
}) => {
    // Add a local timeout for loading states
    const [localLoadingTimeout, setLocalLoadingTimeout] = useState(null);
    
    // State for infinite scrolling - simplified with new component
    const [useInfiniteScroll, setUseInfiniteScroll] = useState(itemsPerPage === Infinity);
    const [infiniteScrollPage, setInfiniteScrollPage] = useState(1);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    
    // Track the total loaded items to determine when we've reached the end
    const totalLoadedItems = useRef(0);
    const batchSize = 16; // Ensure consistent batch size
    
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
    
    // Simplified infinite scroll state management
    useEffect(() => {
        // Never use Infinity for itemsPerPage, use a more reasonable value
        if (itemsPerPage === Infinity) {
            // Instead of setting page to 1 and loading everything
            // Just activate infinite scroll mode but keep batch loading
            setUseInfiniteScroll(true);
            setInfiniteScrollPage(1);
            setAllItemsLoaded(false);
            totalLoadedItems.current = 0;
            
            // Initial load for infinite scroll with exactly batchSize items
            setTimeout(() => {
                fetchInfiniteScrollCars(1, false, batchSize);
            }, 0);
        } else {
            setUseInfiniteScroll(false);
        }
    }, [itemsPerPage, fetchInfiniteScrollCars]);
    
    // Handle loading more items - simplified callback for InfiniteScroller
    const handleLoadMore = useCallback(() => {
        if (loading || allItemsLoaded) return;
        
        const nextPage = infiniteScrollPage + 1;
        console.log(`CarList: Loading page ${nextPage} with batch size ${batchSize}`);
        setInfiniteScrollPage(nextPage);
        fetchInfiniteScrollCars(nextPage, true, batchSize);
    }, [infiniteScrollPage, loading, allItemsLoaded, fetchInfiniteScrollCars]);
    
    // Check if all items have been loaded based on response from server
    useEffect(() => {
        if (useInfiniteScroll && !loading) {
            // Update total loaded items count
            totalLoadedItems.current = cars.length;
            
            // Check if we have fewer cars than expected for current page
            const expectedItemCount = infiniteScrollPage * batchSize;
            if (cars.length > 0 && cars.length < expectedItemCount && infiniteScrollPage > 1) {
                console.log(`CarList: All items loaded - have ${cars.length}, expected ${expectedItemCount}`);
                setAllItemsLoaded(true);
            }
            
            // Or if we've loaded all pages according to server
            if (infiniteScrollPage >= totalPages && totalPages > 0) {
                console.log(`CarList: All pages loaded - current: ${infiniteScrollPage}, total: ${totalPages}`);
                setAllItemsLoaded(true);
            }
        }
    }, [cars, useInfiniteScroll, infiniteScrollPage, totalPages, loading]);
    
    // Add debugging for props
    useEffect(() => {
        console.log("CarList rendered with:", { 
            carsCount: cars?.length, 
            loading, 
            currentPage, 
            totalPages,
            isOffline,
            useInfiniteScroll,
            infiniteScrollPage,
            allItemsLoaded
        });
    }, [cars, loading, currentPage, totalPages, isOffline, useInfiniteScroll, infiniteScrollPage, allItemsLoaded]);

    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = event.target.value === "unlimited" ? Infinity : parseInt(event.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
        
        // Reset infinite scroll state when changing items per page
        if (newItemsPerPage === Infinity) {
            setInfiniteScrollPage(1);
            setAllItemsLoaded(false);
            totalLoadedItems.current = 0;
        }
    };      const handleSortMethodChange = (event) => {
        const newSortMethod = event.target.value;
        console.log(`Changing sort method to: ${newSortMethod}`);
        setSortMethod(newSortMethod);
        // Reset to first page when changing sort method
        if (useInfiniteScroll) {
            setInfiniteScrollPage(1);
            setAllItemsLoaded(false);
            totalLoadedItems.current = 0;
        } else {
            setCurrentPage(1);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };    
    const handleDelete = (carId) => {
        if (window.confirm("Are you sure you want to delete this car?")) {
            // First try a forced immediate deletion
            console.log("CarList: Attempting immediate delete for car ID:", carId);
            
            deleteCar(carId, true) // true forces immediate deletion attempt
                .then((response) => {
                    if (response?.data?.message?.includes('offline') || 
                        response?.data?.message?.includes('marked for deletion')) {
                        console.log("CarList: Car queued for deletion:", response?.data?.message);
                        alert("Car has been removed from local view and will be deleted from the server when you're back online.");
                    } else {
                        // Normal online deletion
                        console.log("CarList: Car deleted successfully on server");
                        
                        // Note: No need to manually filter the car out here since we'll get a WebSocket event
                        // that will trigger the state update in the CarShop component
                    }
                })
                .catch(error => {
                    console.error("CarList: Error deleting car:", error);
                    alert("Failed to delete car: " + (error.message || "Unknown error"));
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
            
            <div className="controls">
                <div className="control-item">
                    <label htmlFor="itemsPerPage">Items per page:</label>
                    <select 
                        value={itemsPerPage === Infinity ? "infinite" : itemsPerPage}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "infinite") {
                                setItemsPerPage(Infinity); // This will trigger our modified useEffect
                            } else {
                                setItemsPerPage(Number(value));
                            }
                        }}
                        >
                        <option value="8">8 per page</option>
                        <option value="16">16 per page</option>
                        <option value="32">32 per page</option>
                        <option value="infinite">Infinite scroll</option>
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
            <div className="car-list-container">
                {(loading && !localLoadingTimeout && cars.length === 0) ? (
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
                ) : (                    useInfiniteScroll ? (                        <div className="car-list">
                            <div className="car-cards">
                                {cars
                                    .filter((car, index, array) => 
                                        array.findIndex(c => c.id === car.id) === index
                                    )
                                    .map((car) => (
                                    <CarCard
                                        car={car}
                                        key={`car-${car.id}-${car.updatedAt || car.createdAt || Date.now()}`}
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                        isOffline={isOffline}
                                    />
                                ))}
                            </div>
                            
                            <InfiniteScroller
                                hasMore={!allItemsLoaded}
                                loading={loading}
                                onLoadMore={handleLoadMore}
                                batchSize={batchSize}
                                endMessage={<p>You've seen all {totalCars} cars!</p>}
                            />
                        </div>
                    ) : (                        <div className="car-list">
                            <div className="car-cards">
                                {cars
                                    .filter((car, index, array) => 
                                        array.findIndex(c => c.id === car.id) === index
                                    )
                                    .map((car) => (
                                    <CarCard
                                        car={car}
                                        key={`car-${car.id}-${car.updatedAt || car.createdAt || Date.now()}`}
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                        isOffline={isOffline}
                                    />
                                ))}
                            </div>
                        </div>
                    )                )}
                
                {/* Pagination is handled within the conditional blocks above */}
            </div>

            {/* Show pagination only when not using infinite scroll */}
            {!useInfiniteScroll && !disableSortAndFilter && (
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
