import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';
import config from './config.js';

const BrandOperationsContext = createContext();

export function BrandOperationsProvider({ children }) {
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [brandError, setBrandError] = useState(null);
  const [brands, setBrands] = useState([]);
  const [totalBrands, setTotalBrands] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [countries, setCountries] = useState([]);

  // Fetch brands with optional filtering and pagination
  const fetchBrands = useCallback(async (params = {}) => {
    try {
      setLoadingBrands(true);
      setBrandError(null);
      
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        itemsPerPage: params.itemsPerPage || 10,
        ...params
      }).toString();
      
      const response = await axios.get(`${config.API_URL}/api/brands?${queryParams}`);
      
      setBrands(response.data.brands);
      setTotalBrands(response.data.totalBrands);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      if (response.data.countries) {
        setCountries(response.data.countries);
      }
      
      return response.data;
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrandError(error.message || 'Failed to fetch brands');
      throw error;
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  // Fetch a single brand by ID
  const fetchBrandById = useCallback(async (id) => {
    try {
      setLoadingBrands(true);
      setBrandError(null);
      
      const response = await axios.get(`${config.API_URL}/api/brands/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching brand with ID ${id}:`, error);
      setBrandError(error.message || `Failed to fetch brand with ID ${id}`);
      throw error;
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  // Create a new brand
  const createBrand = useCallback(async (brandData) => {
    try {
      setLoadingBrands(true);
      setBrandError(null);
      
      // Use FormData for file uploads
      let formData;
      if (brandData instanceof FormData) {
        formData = brandData;
      } else {
        formData = new FormData();
        Object.entries(brandData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
      }
      
      const response = await axios.post(`${config.API_URL}/api/brands`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh brands list after creating a new one
      fetchBrands();
      
      return response.data;
    } catch (error) {
      console.error("Error creating brand:", error);
      setBrandError(error.response?.data?.errors?.[0] || error.message || 'Failed to create brand');
      throw error;
    } finally {
      setLoadingBrands(false);
    }
  }, [fetchBrands]);

  // Update an existing brand
  const updateBrand = useCallback(async (id, brandData) => {
    try {
      setLoadingBrands(true);
      setBrandError(null);
      
      // Use FormData for file uploads
      let formData;
      if (brandData instanceof FormData) {
        formData = brandData;
      } else {
        formData = new FormData();
        Object.entries(brandData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
      }
      
      const response = await axios.put(`${config.API_URL}/api/brands/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh brands list after update
      fetchBrands();
      
      return response.data;
    } catch (error) {
      console.error(`Error updating brand with ID ${id}:`, error);
      setBrandError(error.response?.data?.errors?.[0] || error.message || `Failed to update brand with ID ${id}`);
      throw error;
    } finally {
      setLoadingBrands(false);
    }
  }, [fetchBrands]);

  // Delete a brand
  const deleteBrand = useCallback(async (id) => {
    try {
      setLoadingBrands(true);
      setBrandError(null);
      
      const response = await axios.delete(`${config.API_URL}/api/brands/${id}`);
      
      // Refresh brands list after deletion
      fetchBrands();
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting brand with ID ${id}:`, error);
      
      // Handle the specific case where a brand has associated cars
      if (error.response?.status === 400 && 
          (error.response?.data?.error?.includes('cars associated') || 
           error.response?.data?.carCount)) {
        const carCount = error.response?.data?.carCount || 'multiple';
        const errorMessage = `Cannot delete this brand because it has ${carCount} cars associated with it`;
        setBrandError(errorMessage);
        throw new Error(errorMessage);
      } else {
        // General error handling
        setBrandError(error.response?.data?.error || error.message || `Failed to delete brand with ID ${id}`);
        throw error;
      }
    } finally {
      setLoadingBrands(false);
    }
  }, [fetchBrands]);

  // Get cars for a specific brand
  const getBrandCars = useCallback(async (id, params = {}) => {
    try {
      setLoadingBrands(true);
      setBrandError(null);
      
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        itemsPerPage: params.itemsPerPage || 10,
        ...params
      }).toString();
      
      const response = await axios.get(`${config.API_URL}/api/brands/${id}/cars?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cars for brand with ID ${id}:`, error);
      setBrandError(error.message || `Failed to fetch cars for brand with ID ${id}`);
      throw error;
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  const value = {
    brands,
    totalBrands,
    totalPages,
    currentPage,
    countries,
    loadingBrands,
    brandError,
    fetchBrands,
    fetchBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    getBrandCars
  };

  return (
    <BrandOperationsContext.Provider value={value}>
      {children}
    </BrandOperationsContext.Provider>
  );
}

export default BrandOperationsContext;