import { createContext } from 'react';

// Create a context for car operations with empty functions that log when they're called
// This helps diagnose when the mock implementations are used instead of real ones
const CarOperationsContext = createContext({
    createCar: (...args) => {
        console.error("Mock createCar called - context not properly initialized", args);
        return Promise.resolve({});
    },
    updateCar: (...args) => {
        console.error("Mock updateCar called - context not properly initialized", args);
        return Promise.resolve({});
    },
    deleteCar: (...args) => {
        console.error("Mock deleteCar called - context not properly initialized", args);
        return Promise.resolve({});
    },
    fetchCars: (...args) => {
        console.error("Mock fetchCars called - context not properly initialized", args);
    },
});

export default CarOperationsContext;
