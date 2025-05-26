//Sidebar.jsx
import React, { useEffect, useState } from 'react';
import CheckboxList from './CheckboxList.jsx';
import './Sidebar.css';
import { Link } from "react-router-dom";
import axios from 'axios';
import config from './config.js';

const Sidebar = ({ filters, onFilterChange, disabled }) => {
    // Available brands and fuel types from the server
    const [brands, setBrands] = useState([]);
    const [fuelTypes, setFuelTypes] = useState([]);
    
    // Fetch available brands and fuel types from the API
    useEffect(() => {
        // First try to get brands from the dedicated brands endpoint
        axios.get(`${config.API_URL}/api/brands`)
            .then((response) => {
                if (response.data && response.data.brands) {
                    console.log('Brands fetched from brands API:', response.data.brands);
                    // Map the brand objects to a format compatible with the filter component
                    const formattedBrands = response.data.brands.map(brand => ({
                        id: brand.id,
                        name: brand.name
                    }));
                    setBrands(formattedBrands);
                }
            })
            .catch((error) => {
                console.error('Error fetching brands:', error);
                // Fall back to getting brands from the cars endpoint
                fetchBrandsFromCars();
            });

        // Get fuel types from cars endpoint
        axios.get(`${config.API_URL}/api/cars`)
            .then((response) => {
                if (response.data && response.data.fuelTypes) {
                    console.log('Fuel types from API:', response.data.fuelTypes);
                    setFuelTypes(response.data.fuelTypes);
                } else if (response.data && response.data.cars) {
                    // Extract unique fuel types from the cars array if direct property not available
                    const uniqueFuelTypes = [...new Set(response.data.cars.map(car => car.fuelType))];
                    console.log('Fuel types extracted from cars:', uniqueFuelTypes);
                    setFuelTypes(uniqueFuelTypes);
                } else {
                    // Fallback to default values
                    setFuelTypes(["Diesel", "Gasoline", "Hybrid", "Electric"]);
                }
            })
            .catch((error) => {
                console.error('Error fetching fuel types:', error);
                setFuelTypes(["Diesel", "Gasoline", "Hybrid", "Electric"]);
            });
    }, []);

    // Fallback function to get brands from the cars endpoint
    const fetchBrandsFromCars = () => {
        axios.get(`${config.API_URL}/api/cars`)
            .then((response) => {
                if (response.data && response.data.brands) {
                    console.log('Brands from cars API:', response.data.brands);
                    setBrands(response.data.brands);
                } else if (response.data && response.data.cars) {
                    // Try to extract brand info from cars if they have brand property
                    const brandsFromCars = [];
                    response.data.cars.forEach(car => {
                        if (car.brand && car.brand.id && car.brand.name) {
                            const existingBrand = brandsFromCars.find(b => b.id === car.brand.id);
                            if (!existingBrand) {
                                brandsFromCars.push({
                                    id: car.brand.id,
                                    name: car.brand.name
                                });
                            }
                        } else if (car.make) {
                            // Legacy support - use the make field if brand is not available
                            const existingBrand = brandsFromCars.find(b => b.name === car.make);
                            if (!existingBrand) {
                                brandsFromCars.push({
                                    id: brandsFromCars.length + 1, // Generate a temporary ID
                                    name: car.make
                                });
                            }
                        }
                    });
                    
                    console.log('Brands extracted from cars:', brandsFromCars);
                    setBrands(brandsFromCars);
                } else {
                    // Fallback to default values
                    setBrands([
                        { id: 1, name: "Toyota" },
                        { id: 2, name: "Honda" },
                        { id: 3, name: "Ford" },
                        { id: 4, name: "BMW" },
                        { id: 5, name: "Mercedes-Benz" }
                    ]);
                }
            })
            .catch((error) => {
                console.error('Error in fallback brand fetch:', error);
                // Fallback to default values
                setBrands([
                    { id: 1, name: "Toyota" },
                    { id: 2, name: "Honda" },
                    { id: 3, name: "Ford" },
                    { id: 4, name: "BMW" },
                    { id: 5, name: "Mercedes-Benz" }
                ]);
            });
    };

    const handleBrandChange = (selectedBrandIds) => {
        onFilterChange('makes', selectedBrandIds);
    };

    const handleFuelTypeChange = (newSelectedFuelTypes) => {
        onFilterChange('fuelTypes', newSelectedFuelTypes);
    };

    const handleMinPriceChange = (e) => {
        onFilterChange('minPrice', e.target.value);
    };

    const handleMaxPriceChange = (e) => {
        onFilterChange('maxPrice', e.target.value);
    };    const handleSearchChange = (e) => {
        console.log('Search input changed:', e.target.value);
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
                    title="Brand"
                    items={brands.map(brand => brand.name)}
                    selectedItems={filters.makes}
                    onChange={handleBrandChange}
                    disabled={disabled}
                    itemIds={brands.map(brand => brand.id.toString())}
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