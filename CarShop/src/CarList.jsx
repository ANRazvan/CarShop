import React, { useState } from "react";
import "./CarList.css";
import { Link } from "react-router-dom";
import Statistics from "./Statistics.jsx";

const CarList = ({ cars, selectedMakes, selectedFuel, minPrice, maxPrice, searchBar }) => {
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [sortMethod, setSortMethod] = useState("");

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(parseInt(event.target.value));
  };

  const handleSortMethodChange = (event) => {
    setSortMethod(event.target.value);
  };

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

  const filteredCars5 = searchBar
    ? filteredCars4.filter(
        (car) =>
          car.make.toLowerCase().includes(searchBar.toLowerCase()) ||
          car.model.toLowerCase().includes(searchBar.toLowerCase()) ||
          car.keywords.toLowerCase().includes(searchBar.toLowerCase())
      )
    : filteredCars4;

  const sortedCars = [...filteredCars5].sort((a, b) => {
    if (sortMethod === "price-asc") {
      return a.price - b.price;
    } else if (sortMethod === "price-desc") {
      return b.price - a.price;
    } else if (sortMethod === "year-asc") {
      return a.year - b.year;
    } else if (sortMethod === "year-desc") {
      return b.year - a.year;
    } else {
      return 0;
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedCars.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const selectedCars = sortedCars.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate price thresholds
  const prices = cars.map(car => car.price);
  const maxPriceValue = Math.max(...prices);
  const minPriceValue = Math.min(...prices);
  const lowPriceThreshold = minPriceValue + (maxPriceValue - minPriceValue) * 0.33;
  const mediumPriceThreshold = minPriceValue + (maxPriceValue - minPriceValue) * 0.66;

  // Determine the price category for each car
  const getPriceCategory = (price) => {
    if (price <= lowPriceThreshold) return "low-price";
    if (price <= mediumPriceThreshold) return "medium-price";
    return "high-price";
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
        {selectedCars.length === 0 ? (
          <div className="centered-div">
            <div className="no-cars-message">
              <h2>No cars available with the current filters</h2>
              <p>Try adjusting your search criteria or check back later.</p>
            </div>
          </div>
        ) : (
          selectedCars.map((car) => (
            <div key={car.id} className={`car-card ${getPriceCategory(car.price)}`}>
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
