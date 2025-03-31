import React, { useEffect, useState } from 'react';
import CheckboxList from './CheckboxList.jsx';
import './Sidebar.css';
import { Link } from "react-router-dom";
import axios from 'axios';

const Sidebar = ({ filters, onFilterChange }) => {
    // Available makes from the server
    const [makes, setMakes] = useState([]);
    
    // Fetch available makes from the general cars endpoint
    useEffect(() => {
        axios.get('http://localhost:5000/api/cars')
            .then((response) => {
                if (response.data && response.data.makes) {
                    console.log('Makes from API:', response.data.makes);
                    setMakes(response.data.makes);
                } else {
                    // Fallback to default makes if API doesn't return makes
                    setMakes(["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]);
                }
            })
            .catch((error) => {
                console.error('Error fetching makes:', error);
                // Fallback to default makes if API fails
                setMakes(["Mazda", "Volkswagen", "BMW", "Mercedes", "Audi"]);
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
        <div className="sidebar">
            <Link to="/AddCar">
                <button className="add-car">Add new car</button>
            </Link>
            <input 
                className="search" 
                type="text" 
                placeholder="Search" 
                value={filters.searchTerm}
                onChange={handleSearchChange}
            />
            <CheckboxList
                title="Make"
                items={makes}
                selectedItems={filters.makes}
                onChange={handleMakeChange}
            />
            <CheckboxList
                title="Fuel Type"
                items={["Diesel", "Gasoline", "Hybrid", "Electric"]}
                selectedItems={filters.fuelTypes}
                onChange={handleFuelTypeChange}
            />
            <h4>Price Interval</h4>
            <div className="MinMaxPrice">
                <input
                    className="priceInterval"
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice}
                    onChange={handleMinPriceChange}
                />
                <input
                    className="priceInterval"
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice}
                    onChange={handleMaxPriceChange}
                />
            </div>
        </div>
    );
};

export default Sidebar;