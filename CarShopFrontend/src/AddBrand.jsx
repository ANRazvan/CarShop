import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandOperationsContext from './BrandOperationsContext';
import './AddBrand.css';

const AddBrand = () => {
  const navigate = useNavigate();
  const { createBrand } = useContext(BrandOperationsContext);

  const [brand, setBrand] = useState({
    name: '',
    country: '',
    foundedYear: '',
    description: ''
  });
  const [logo, setLogo] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!brand.name.trim()) newErrors.name = 'Brand name is required';
    if (!brand.country.trim()) newErrors.country = 'Country is required';
    
    if (!brand.foundedYear) {
      newErrors.foundedYear = 'Founded year is required';
    } else {
      const year = parseInt(brand.foundedYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        newErrors.foundedYear = `Year must be between 1800 and ${currentYear}`;
      }
    }

    if (!brand.description.trim()) newErrors.description = 'Description is required';
    
    // Logo validation
    if (!logo) {
      newErrors.logo = 'Logo image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBrand(prev => ({ ...prev, [name]: value }));
    
    // Clear the error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Logo must be less than 2MB' }));
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
        setErrors(prev => ({ ...prev, logo: 'Logo must be JPEG, PNG or SVG format' }));
        return;
      }

      setLogo(file);
      setErrors(prev => ({ ...prev, logo: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', brand.name);
      formData.append('country', brand.country);
      formData.append('foundedYear', brand.foundedYear);
      formData.append('description', brand.description);
      if (logo) {
        formData.append('logo', logo);
      }
      
      await createBrand(formData);
      
      alert('Brand added successfully!');
      navigate('/brands'); // Redirect to brands list
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        // Handle server validation errors
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.includes('name already exists')) {
            serverErrors.name = 'A brand with this name already exists';
          } else {
            serverErrors.submit = err;
          }
        });
        setErrors(prev => ({ ...prev, ...serverErrors }));
      } else {
        setErrors(prev => ({ 
          ...prev, 
          submit: error.message || 'Failed to create brand. Please try again.' 
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/brands'); // Go back to brands list
  };

  const countryOptions = [
    'Japan', 
    'Germany', 
    'USA', 
    'South Korea', 
    'Italy', 
    'France', 
    'United Kingdom',
    'China',
    'Sweden',
    'Spain',
    'India',
    'Czech Republic'
  ];

  return (
    <div className="add-brand-container">
      <h2>Add New Brand</h2>
      <form onSubmit={handleSubmit} className="brand-form">
        <div className="form-group">
          <label htmlFor="name">Brand Name <span className="required">*</span></label>
          <input
            type="text"
            id="name"
            name="name"
            value={brand.name}
            onChange={handleChange}
            placeholder="Enter brand name"
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="country">Country <span className="required">*</span></label>
          <select
            id="country"
            name="country"
            value={brand.country}
            onChange={handleChange}
          >
            <option value="">Select a country</option>
            {countryOptions.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {errors.country && <p className="error-message">{errors.country}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="foundedYear">Founded Year <span className="required">*</span></label>
          <input
            type="number"
            id="foundedYear"
            name="foundedYear"
            value={brand.foundedYear}
            onChange={handleChange}
            placeholder="Enter founded year"
            min="1800"
            max={new Date().getFullYear()}
          />
          {errors.foundedYear && <p className="error-message">{errors.foundedYear}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="logo">Logo <span className="required">*</span></label>
          <input
            type="file"
            id="logo"
            name="logo"
            onChange={handleLogoChange}
            accept="image/jpeg,image/png,image/jpg,image/svg+xml"
          />
          {errors.logo && <p className="error-message">{errors.logo}</p>}
          {logo && (
            <div className="logo-preview">
              <img src={URL.createObjectURL(logo)} alt="Logo Preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description <span className="required">*</span></label>
          <textarea
            id="description"
            name="description"
            value={brand.description}
            onChange={handleChange}
            placeholder="Enter brand description"
            rows="4"
          />
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Brand'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBrand;