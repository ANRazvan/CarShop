import React, { useEffect, useState } from 'react';
import CheckboxList from './CheckboxList.jsx';
import './Sidebar.css';
import { Link } from "react-router-dom";
import axios from 'axios';
import config from './config.js';

const Sidebar = ({ filters, onFilterChange, disabled }) => {
    // Available makes and fuel types from the server
    const [makes, setMakes] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);
    
    // Fetch available makes and fuel types from the general cars endpoint
    useEffect(() => {
        axios.get(`${config.API_URL}/api/cars`)
            .then((response) => {
                if (response.data && response.data.cars) {
                    // Extract unique makes from the cars array
                    const uniqueMakes = [...new Set(response.data.cars.map(car => car.make))];
                    console.log('Makes extracted from API:', uniqueMakes);
                    setMakes(uniqueMakes);
                    
                    // Extract unique fuel types from the cars array
                    const uniqueFuelTypes = [...new Set(response.data.cars.map(car => car.fuelType))];
                    console.log('Fuel types extracted from API:', uniqueFuelTypes);
                    setFuelTypes(uniqueFuelTypes);
                } else {
                    // Fallback to default values if API doesn't return cars
                    setMakes(["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]);
                    setFuelTypes(["Diesel", "Gasoline", "Hybrid", "Electric"]);
                }
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
                // Fallback to default values if API fails
                setMakes(["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]);
                setFuelTypes(["Diesel", "Gasoline", "Hybrid", "Electric"]);
            });
    }, []);

    const handleMakeChange = (newSelectedMakes) => {
        onFilterChange('makes', newSelectedMakes);
    };

    const handleFuelTypeChange = (newSelectedFuelTypes) => {
        onFilterChange('fuelTypes', newSelectedFuelTypes);
    };

    const handleMinPriceChange = (e) => {
        onFilterChange('minPrice', e.target.value);
    };

    const handleMaxPriceChange = (e) => {
        onFilterChange('maxPrice', e.target.value);
    };

    const handleSearchChange = (e) => {
        onFilterChange('searchTerm', e.target.value);
    };

    return (
        <div className="sidebar-container">
            {/* Always-enabled Add Car button */}
            <Link to="/AddCar" className="add-car-link">
                <button className="add-car always-enabled">Add new car</button>
            </Link>
            
            <div className={`sidebar-filters ${disabled ? 'disabled' : ''}`}>
                <input 
                    className="search" 
                    type="text" 
                    placeholder="Search" 
                    value={filters.searchTerm}
                    onChange={handleSearchChange}
                    disabled={disabled}
                />
                <CheckboxList
                    title="Make"
                    items={makes}
                    selectedItems={filters.makes}
                    onChange={handleMakeChange}
                    disabled={disabled}
                />
                <CheckboxList
                    title="Fuel Type"
                    items={fuelTypes}
                    selectedItems={filters.fuelTypes}
                    onChange={handleFuelTypeChange}
                    disabled={disabled}
                />
                <h4>Price Interval</h4>
                <div className="MinMaxPrice">
                    <input
                        className="priceInterval"
                        type="number"
                        placeholder="Min price"
                        value={filters.minPrice}
                        onChange={handleMinPriceChange}
                        disabled={disabled}
                    />
                    <input
                        className="priceInterval"
                        type="number"
                        placeholder="Max price"
                        value={filters.maxPrice}
                        onChange={handleMaxPriceChange}
                        disabled={disabled}
                    />
                </div>
                
                {disabled && (
                    <div className="offline-filters-message">
                        Filtering is limited in offline mode
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;