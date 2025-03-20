import React, { useState } from "react";
import "./CarList.css";
import { Link } from "react-router-dom";

const itemsPerPage = 8;

const CarList = ({ cars, selectedMakes, selectedFuel, minPrice, maxPrice, searchBar }) => {
    console.log("Selected Makes in CarList:", selectedMakes); // Debugging line


    const filteredCars = selectedMakes.length
        ? cars.filter((car) => selectedMakes.includes(car.make))
        : cars;

    const filteredCars2 = selectedFuel.length
        ? filteredCars.filter((car) => selectedFuel.includes(car.fuelType))
        : filteredCars;
    const filteredCars3 = minPrice
        ? filteredCars2.filter((car) => car.price >= minPrice)
        : filteredCars2;
    const filteredCars4 = maxPrice
        ? filteredCars3.filter((car) => car.price <= maxPrice)
        : filteredCars3;

    // Filter cars based on search bar input
    const filteredCars5 = searchBar
        ? filteredCars4.filter(
            (car) =>    // Check if the search bar input is included in the car make, model, or keywords
                car.make.toLowerCase().includes(searchBar.toLowerCase()) ||     // Convert both strings to lowercase for case-insensitive comparison
                car.model.toLowerCase().includes(searchBar.toLowerCase()) ||    // Convert both strings to lowercase for case-insensitive comparison
                car.keywords.toLowerCase().includes(searchBar.toLowerCase())    // Convert both strings to lowercase for case-insensitive comparison
        )   // Filter cars based on search bar input    
        : filteredCars4;    // If the search bar is empty, return the original list of cars
    

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredCars5.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const selectedCars = filteredCars5.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div>
            <div className="car-list">
                {selectedCars.length === 0 ? (
                    <div class="centered-div">
                    <div class="no-cars-message">
                        <h2>No cars available with the current filters</h2>
                        <p>Try adjusting your search criteria or check back later.</p>
                    </div>
                </div>
                
                ) : (
                    selectedCars.map((car) => (
                        <div key={car.id} className="car-card">
                            <Link to={`/CarDetail/${car.id}`} className="detail-link">
                                <img className="car-img" src={car.img} alt={car.model} />
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
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        className={currentPage === index + 1 ? "active" : ""}
                        onClick={() => goToPage(index + 1)}
                    >
                        {index + 1}
                    </button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default CarList;
