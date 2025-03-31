// CarShop.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar.jsx";
import CarList from "./CarList.jsx";
import Cover from "./Cover.jsx";
import "./CarShop.css";
import { useSearchParams } from "react-router-dom";
import carService from "./services/CarService";

// Utility function for debouncing
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const CarShop = () => {
    const [cars, setCars] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Consolidated filter state
    const [filters, setFilters] = useState({
        makes: [],
        fuelTypes: [],
        minPrice: '',
        maxPrice: '',
        searchTerm: ''
    });
    
    // Debounce the filters to prevent too many requests for text inputs
    const debouncedFilters = useDebounce(filters, 300);
    
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
    const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get("itemsPerPage") || "8"));
    const [sortMethod, setSortMethod] = useState('');

    // Memoize fetchCars to prevent unnecessary re-creation
    const fetchCars = useCallback(async () => {
        setLoading(true);
        
        const params = new URLSearchParams();
        
        params.append("page", currentPage.toString());
        params.append("itemsPerPage", itemsPerPage.toString());
        
        if (sortMethod) {
            const [field, direction] = sortMethod.split('-');
            params.append("sortBy", field);
            params.append("sortOrder", direction);
        }
        
        if (debouncedFilters.makes.length > 0) {
            params.append("make", debouncedFilters.makes.join(","));
        }
        
        if (debouncedFilters.fuelTypes.length > 0) {
            params.append("fuelType", debouncedFilters.fuelTypes.join(","));
        }
        
        if (debouncedFilters.minPrice) {
            params.append("minPrice", debouncedFilters.minPrice);
        }
        
        if (debouncedFilters.maxPrice) {
            params.append("maxPrice", debouncedFilters.maxPrice);
        }
        
        if (debouncedFilters.searchTerm) {
            params.append("searchBar", debouncedFilters.searchTerm);
        }
        
        // Update URL parameters silently (replace: true prevents adding history entries)
        setSearchParams(params, { replace: true });
        
        try {
            const data = await carService.getCars(Object.fromEntries(params));
            setCars(data.cars || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Error fetching cars:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, sortMethod, debouncedFilters, setSearchParams]);

    // Use the debounced filters in the effect dependency array
    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterType]: value
        }));
        setCurrentPage(1);
    };

    return (
        <div>
            <div className="main-content">
                <Cover />
                <div className="content">
                    <Sidebar 
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />
                    <CarList 
                        cars={cars}
                        loading={loading}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        sortMethod={sortMethod}
                        setSortMethod={setSortMethod}
                    />
                </div>
            </div>
        </div>
    );
};

export default CarShop;
