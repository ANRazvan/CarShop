import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import BrandOperationsContext from './BrandOperationsContext';
import config from './config.js';
import './BrandDetail.css';

const BrandDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchBrandById, getBrandCars, deleteBrand } = useContext(BrandOperationsContext);
  
  const [brand, setBrand] = useState(null);
  const [cars, setCars] = useState([]);
  const [totalCars, setTotalCars] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const loadBrandDetails = async () => {
      try {
        setLoading(true);
        const brandData = await fetchBrandById(id);
        setBrand(brandData);
        
        // Load the first page of cars for this brand
        loadBrandCars(1);
      } catch (error) {
        console.error('Error loading brand details:', error);
        setError('Failed to load brand details. Please try again.');
        setLoading(false);
      }
    };
    
    loadBrandDetails();
  }, [id, fetchBrandById]);
  
  const loadBrandCars = async (page) => {
    try {
      const result = await getBrandCars(id, { page, itemsPerPage: 5 });
      setCars(result.cars);
      setTotalCars(result.totalCars);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error loading brand cars:', error);
      setError('Failed to load cars for this brand.');
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadBrandCars(newPage);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await deleteBrand(id);
        navigate('/brands');
      } catch (error) {
        if (error.response && error.response.data && error.response.data.carCount) {
          alert(`Cannot delete this brand because it has ${error.response.data.carCount} cars associated with it.`);
        } else {
          alert('Failed to delete brand: ' + (error.response?.data?.error || error.message));
        }
        setIsDeleting(false);
      }
    }
  };
  
  if (loading) return <div className="loading-container">Loading brand details...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!brand) return <div className="not-found-container">Brand not found</div>;
  
  return (
    <div className="brand-detail-container">
      <div className="brand-detail-header">
        <h2>{brand.name}</h2>
        <div className="brand-actions">
          <Link to={`/brands/${brand.id}/edit`} className="edit-brand-btn">Edit Brand</Link>
          <button 
            onClick={handleDelete} 
            className="delete-brand-btn"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Brand'}
          </button>
          <Link to="/brands" className="back-btn">Back to Brands</Link>
        </div>
      </div>
      
      <div className="brand-detail-content">
        <div className="brand-info">
          <div className="brand-logo">
            {brand.logo ? (
              <img 
                src={`${config.UPLOADS_PATH}logos/${brand.logo}`} 
                alt={`${brand.name} Logo`}
                onError={(e) => { e.target.src = '/placeholder.jpeg'; }}
              />
            ) : (
              <div className="no-logo">No Logo</div>
            )}
          </div>
          
          <div className="brand-meta">
            <div className="info-item">
              <span className="label">Country:</span>
              <span className="value">{brand.country}</span>
            </div>
            
            <div className="info-item">
              <span className="label">Founded:</span>
              <span className="value">{brand.foundedYear}</span>
            </div>
            
            <div className="info-item">
              <span className="label">Cars in Database:</span>
              <span className="value">{totalCars}</span>
            </div>
          </div>
        </div>
        
        <div className="brand-description">
          <h3>About {brand.name}</h3>
          <p>{brand.description}</p>
        </div>
        
        <div className="brand-cars-section">
          <h3>{brand.name} Cars</h3>
          
          {cars.length > 0 ? (
            <>
              <div className="car-list">
                {cars.map(car => (
                  <Link key={car.id} to={`/cars/${car.id}`} className="car-item">
                    <div className="car-image">
                      {car.img ? (
                        <img 
                          src={`${config.UPLOADS_PATH}${car.img}`} 
                          alt={`${car.make} ${car.model}`}
                          onError={(e) => { e.target.src = '/placeholder.jpeg'; }}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="car-details">
                      <h4>{car.model}</h4>
                      <p>Year: {car.year}</p>
                      <p>Price: ${car.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-cars-message">
              No cars found for this brand.
              <Link to="/add-car" className="add-car-link">Add a Car</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandDetail;