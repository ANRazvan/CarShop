import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandOperationsContext from './BrandOperationsContext';
import './BrandList.css';

const BrandList = () => {
  const {
    brands,
    totalBrands,
    totalPages,
    currentPage,
    countries,
    loadingBrands,
    brandError,
    fetchBrands,
    deleteBrand,
  } = useContext(BrandOperationsContext);

  const [filters, setFilters] = useState({
    name: '',
    country: [],
    minFoundedYear: '',
    maxFoundedYear: '',
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'name',
    sortOrder: 'ASC',
  });

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch brands on component mount and when filters/sort/pagination change
  useEffect(() => {
    loadBrands();
  }, [currentPage, itemsPerPage, sortConfig]);

  // Load brands with current filters, sorting, and pagination
  const loadBrands = async () => {
    try {
      const params = {
        page: currentPage,
        itemsPerPage: itemsPerPage,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
        ...filters,
      };

      // Convert country array to comma-separated string if it's not empty
      if (filters.country && filters.country.length > 0) {
        params.country = filters.country.join(',');
      }

      await fetchBrands(params);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle country filter changes (multi-select)
  const handleCountryChange = (e) => {
    const { value, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      country: checked
        ? [...prev.country, value]
        : prev.country.filter((country) => country !== value),
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchBrands({
      page: 1, // Reset to first page when applying filters
      itemsPerPage,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      ...filters,
      country: filters.country.length > 0 ? filters.country.join(',') : undefined,
    });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      name: '',
      country: [],
      minFoundedYear: '',
      maxFoundedYear: '',
    });
    fetchBrands({
      page: 1,
      itemsPerPage,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
    });
  };

  // Handle sort change
  const handleSort = (field) => {
    setSortConfig((prev) => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      fetchBrands({
        page: newPage,
        itemsPerPage,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
        ...filters,
        country: filters.country.length > 0 ? filters.country.join(',') : undefined,
      });
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    fetchBrands({
      page: 1, // Reset to first page when changing items per page
      itemsPerPage: newItemsPerPage,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      ...filters,
      country: filters.country.length > 0 ? filters.country.join(',') : undefined,
    });
  };

  // Handle brand deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      setDeletingId(id);
      try {
        await deleteBrand(id);
      } catch (error) {
        if (error.response && error.response.data && error.response.data.carCount) {
          alert(`Cannot delete this brand because it has ${error.response.data.carCount} cars associated with it.`);
        } else {
          alert('Failed to delete brand: ' + (error.response?.data?.error || error.message));
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortConfig.sortBy === field) {
      return sortConfig.sortOrder === 'ASC' ? ' ↑' : ' ↓';
    }
    return '';
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 3; // Number of pages to show on each side
    
    // Always show first page
    if (totalPages > 0) {
      pages.push(1);
    }
    
    // If there are many pages, add ellipsis after page 2
    if (currentPage > maxPagesToShow + 1) {
      if (totalPages > 2) {
        pages.push('...');
      }
    } else if (totalPages > 2) {
      // Show page 2 if we're close to the beginning
      pages.push(2);
    }
    
    // Pages around current page
    for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
      // Only add if not too close to the beginning or end
      if ((i > 2 && i < currentPage - 1) || (i < totalPages - 1 && i > currentPage + 1)) {
        continue;
      }
      
      pages.push(i);
    }
    
    // Add ellipsis before last two pages if needed
    if (currentPage < totalPages - maxPagesToShow && totalPages > 3) {
      pages.push('...');
    }
    
    // Always show second-to-last page if there are enough pages
    if (totalPages > 2) {
      // Don't show if we already included it in the central section
      if (totalPages - 1 > currentPage + 1) {
        pages.push(totalPages - 1);
      }
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="brand-list-container">
      <div className="brand-list-header">
        <h2>Brands</h2>
        <div className="brand-actions">
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <Link to="/add-brand" className="add-brand-btn">Add New Brand</Link>
        </div>
      </div>

      {/* Filters section */}
      {showFilters && (
        <div className="brand-filters">
          <h3>Filter Brands</h3>
          <div className="filter-form">
            <div className="filter-row">
              <div className="filter-field">
                <label htmlFor="nameFilter">Brand Name</label>
                <input
                  type="text"
                  id="nameFilter"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Search by name..."
                />
              </div>
              
              <div className="filter-field">
                <label>Founded Year</label>
                <div className="year-range-inputs">
                  <input
                    type="number"
                    name="minFoundedYear"
                    value={filters.minFoundedYear}
                    onChange={handleFilterChange}
                    placeholder="Min Year"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="maxFoundedYear"
                    value={filters.maxFoundedYear}
                    onChange={handleFilterChange}
                    placeholder="Max Year"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-field countries-field">
                <label>Countries</label>
                <div className="country-checkboxes">
                  {countries.map(country => (
                    <label key={country} className="country-checkbox">
                      <input
                        type="checkbox"
                        value={country}
                        checked={filters.country.includes(country)}
                        onChange={handleCountryChange}
                      />
                      {country}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="filter-buttons">
              <button onClick={applyFilters} className="apply-filters-btn">Apply Filters</button>
              <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {brandError && <div className="error-message">{brandError}</div>}

      {/* Loading state */}
      {loadingBrands && <div className="loading-message">Loading brands...</div>}

      {/* Brands table */}
      {!loadingBrands && brands.length === 0 ? (
        <div className="no-brands-message">No brands found. Try clearing filters or add a new brand.</div>
      ) : (
        <>
          <table className="brands-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>
                  ID{renderSortIndicator('id')}
                </th>
                <th onClick={() => handleSort('name')}>
                  Name{renderSortIndicator('name')}
                </th>
                <th onClick={() => handleSort('country')}>
                  Country{renderSortIndicator('country')}
                </th>
                <th onClick={() => handleSort('foundedYear')}>
                  Founded Year{renderSortIndicator('foundedYear')}
                </th>
                <th>Cars</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(brand => (
                <tr key={brand.id} className={deletingId === brand.id ? 'deleting' : ''}>
                  <td>{brand.id}</td>
                  <td>
                    <div className="brand-name-cell">
                      {brand.logo && (
                        <img 
                          src={`${config.UPLOADS_PATH}logos/${brand.logo}`} 
                          alt={brand.name} 
                          className="brand-logo-thumbnail" 
                          onError={(e) => { e.target.src = '/placeholder.jpeg'; }}
                        />
                      )}
                      <span>{brand.name}</span>
                    </div>
                  </td>
                  <td>{brand.country}</td>
                  <td>{brand.foundedYear}</td>
                  <td>{brand.cars?.length || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/brands/${brand.id}`} className="view-btn">View</Link>
                      <Link to={`/brands/${brand.id}/edit`} className="edit-btn">Edit</Link>
                      <button 
                        onClick={() => handleDelete(brand.id)} 
                        className="delete-btn"
                        disabled={deletingId === brand.id}
                      >
                        {deletingId === brand.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="pagination-controls">
            <div className="pagination-info">
              Showing {brands.length} of {totalBrands} brands
            </div>
            <div className="items-per-page">
              <label htmlFor="itemsPerPage">Items per page:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="first-page-btn"
              >
                &laquo; First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="prev-page-btn"
              >
                &lt; Prev
              </button>
              
              {getPageNumbers().map(number => (
                number === '...' ? (
                  <span key={`ellipsis-${Math.random()}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={currentPage === number ? 'active page-number-btn' : 'page-number-btn'}
                  >
                    {number}
                  </button>
                )
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="next-page-btn"
              >
                Next &gt;
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="last-page-btn"
              >
                Last &raquo;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BrandList;