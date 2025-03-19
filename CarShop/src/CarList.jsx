
import React, { useState } from "react";
import "./CarList.css";
import {Link} from "react-router-dom";



const itemsPerPage = 8;

const CarList = ({ cars , selectedMakes }) => {
    console.log("Selected Makes in CarList:", selectedMakes); // Debugging line

    const filteredCars = selectedMakes.length
        ? cars.filter((car) => selectedMakes.includes(car.make))
        : cars;

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const selectedCars = filteredCars.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div>
            <div className="car-list">
                {selectedCars.map((car) => (
                    <div key={car.id} className="car-card">
                        <Link to={`/CarDetail/${car.id}`} className="detail-link"> {/* Link to car detail page */}
                            <img className="car-img" src={car.img} alt={car.model} />
                            <h3>{car.make}</h3>
                            <h4>{car.model}</h4>
                            <p>{car.keywords}</p>
                            <p className="price">${car.price}</p>
                        </Link>
                    </div>
                ))}
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
