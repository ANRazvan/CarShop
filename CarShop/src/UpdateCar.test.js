import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate, useParams } from 'react-router-dom';
import UpdateCar from './UpdateCar';

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

describe('UpdateCar Component', () => {
  const mockSetCars = jest.fn();
  const mockNavigate = jest.fn();
  
  // Sample car data for testing
  const mockCars = [
    {
      id: 1,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      keywords: 'sedan, reliable',
      description: 'Excellent family car',
      price: 25000,
      img: 'toyota-camry.jpg',
      fuelType: 'Gas'
    },
    {
      id: 2,
      make: 'Tesla',
      model: 'Model 3',
      year: 2021,
      keywords: 'electric, fast',
      description: 'Modern electric car',
      price: 45000,
      img: 'tesla-model3.jpg',
      fuelType: 'Electric'
    }
  ];

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: '1' }); // Default to first car
    
    // Mock console.log and alert
    jest.spyOn(console, 'log').mockImplementation(() => {});
    window.alert = jest.fn();
  });

  test('renders the component with pre-filled data', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    expect(screen.getByText('Update Car Details')).toBeInTheDocument();
    
    // Check if fields are pre-filled with car data
    expect(screen.getByPlaceholderText('Make').value).toBe('Toyota');
    expect(screen.getByPlaceholderText('Model').value).toBe('Camry');
    expect(screen.getByPlaceholderText('Year').value).toBe('2020');
    expect(screen.getByPlaceholderText('Keywords').value).toBe('sedan, reliable');
    expect(screen.getByPlaceholderText('Price').value).toBe('25000');
    expect(screen.getByPlaceholderText('Enter description...').value).toBe('Excellent family car');
    
    // Check if the select dropdown has the correct value
    expect(screen.getByRole('combobox').value).toBe('Gas');
    
    // Check if the image is displayed
    expect(screen.getByAltText('Uploaded Car')).toBeInTheDocument();
    expect(screen.getByAltText('Uploaded Car').src).toContain('/toyota-camry.jpg');
    
    // Check for buttons
    expect(screen.getByRole('button', { name: 'Update Car' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Image' })).toBeInTheDocument();
  });



  test('updates state when input values change', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    const makeInput = screen.getByPlaceholderText('Make');
    fireEvent.change(makeInput, { target: { name: 'make', value: 'Honda' } });
    expect(makeInput.value).toBe('Honda');
    
    const modelInput = screen.getByPlaceholderText('Model');
    fireEvent.change(modelInput, { target: { name: 'model', value: 'Accord' } });
    expect(modelInput.value).toBe('Accord');
    
    const yearInput = screen.getByPlaceholderText('Year');
    fireEvent.change(yearInput, { target: { name: 'year', value: '2022' } });
    expect(yearInput.value).toBe('2022');
    
    const priceInput = screen.getByPlaceholderText('Price');
    fireEvent.change(priceInput, { target: { name: 'price', value: '30000' } });
    expect(priceInput.value).toBe('30000');
    
    const descInput = screen.getByPlaceholderText('Enter description...');
    fireEvent.change(descInput, { target: { name: 'description', value: 'Updated description' } });
    expect(descInput.value).toBe('Updated description');
    
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { name: 'fuelType', value: 'Hybrid' } });
    expect(selectElement.value).toBe('Hybrid');
  });

  test('validates form before submission', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Clear all fields
    fireEvent.change(screen.getByPlaceholderText('Make'), { target: { name: 'make', value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Model'), { target: { name: 'model', value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Year'), { target: { name: 'year', value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Price'), { target: { name: 'price', value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Enter description...'), { target: { name: 'description', value: '' } });
    
    // Remove image
    fireEvent.click(screen.getByRole('button', { name: 'Remove Image' }));
    
    // Try to submit
    fireEvent.click(screen.getByRole('button', { name: 'Update Car' }));
    
    // Check for validation errors
    expect(screen.getByText('Make is required.')).toBeInTheDocument();
    expect(screen.getByText('Model is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid year.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid price.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(screen.getByText('Image is required.')).toBeInTheDocument();
    
    // Verify that setcars was not called
    expect(mockSetCars).not.toHaveBeenCalled();
  });

  test('clears error message when input value changes', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Clear field and trigger validation
    fireEvent.change(screen.getByPlaceholderText('Make'), { target: { name: 'make', value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Car' }));
    
    expect(screen.getByText('Make is required.')).toBeInTheDocument();
    
    // Update field
    fireEvent.change(screen.getByPlaceholderText('Make'), { target: { name: 'make', value: 'Honda' } });
    
    // Error should be cleared
    expect(screen.queryByText('Make is required.')).not.toBeInTheDocument();
  });

  test('validates year is not in the future', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    const futureYear = new Date().getFullYear() + 1;
    fireEvent.change(screen.getByPlaceholderText('Year'), { target: { name: 'year', value: futureYear } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Update Car' }));
    
    expect(screen.getByText('Enter a valid year.')).toBeInTheDocument();
  });

  test('removes uploaded image when remove button is clicked', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Initially, image should be displayed
    expect(screen.getByAltText('Uploaded Car')).toBeInTheDocument();
    
    // Click remove button
    fireEvent.click(screen.getByRole('button', { name: 'Remove Image' }));
    
    // Image should be removed and file input should be shown
    expect(screen.queryByAltText('Uploaded Car')).not.toBeInTheDocument();
    expect(screen.getByText('Image is required.')).toBeInTheDocument();
    expect(screen.getByAcceptedFileTypes('image/*')).toBeInTheDocument();
  });

  test('handles image upload correctly', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Remove existing image first
    fireEvent.click(screen.getByRole('button', { name: 'Remove Image' }));
    
    // Upload new image
    const file = new File(['dummy content'], 'new-car.png', { type: 'image/png' });
    const fileInput = screen.getByAcceptedFileTypes('image/*');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(fileInput);
    
    // Should update the car state with the new image path
    return waitFor(() => {
      expect(screen.queryByText('Image is required.')).not.toBeInTheDocument();
    });
  });

  test('validates file type when uploading image', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Remove existing image first
    fireEvent.click(screen.getByRole('button', { name: 'Remove Image' }));
    
    // Upload invalid file type
    const invalidFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByAcceptedFileTypes('image/*');
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile]
    });
    
    fireEvent.change(fileInput);
    
    return waitFor(() => {
      expect(screen.getByText('Only JPG and PNG files are allowed.')).toBeInTheDocument();
    });
  });

  test('validates file size when uploading image', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Remove existing image first
    fireEvent.click(screen.getByRole('button', { name: 'Remove Image' }));
    
    // Create a mock file with size > 2MB
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByAcceptedFileTypes('image/*');
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile]
    });
    
    fireEvent.change(fileInput);
    
    return waitFor(() => {
      expect(screen.getByText('Image size must be less than 2MB.')).toBeInTheDocument();
    });
  });

  test('successfully updates car when form is valid', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    // Make some changes
    fireEvent.change(screen.getByPlaceholderText('Make'), { target: { name: 'make', value: 'Honda' } });
    fireEvent.change(screen.getByPlaceholderText('Model'), { target: { name: 'model', value: 'Accord' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Update Car' }));
    
    // Expect alert and navigation
    expect(window.alert).toHaveBeenCalledWith('Car updated successfully!');
    expect(mockSetCars).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
    
    // Check that the updated car data was passed to setcars
    const updatedCars = mockSetCars.mock.calls[0][0];
    const updatedCar = updatedCars.find(car => car.id === 1);
    expect(updatedCar.make).toBe('Honda');
    expect(updatedCar.model).toBe('Accord');
  });

  test('navigates back to home page when cancel button is clicked', () => {
    render(<UpdateCar cars={mockCars} setcars={mockSetCars} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

// Add a custom query to get file input by accept attribute
screen.getByAcceptedFileTypes = (acceptValue) => {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  for (const input of fileInputs) {
    if (input.getAttribute('accept') === acceptValue) {
      return input;
    }
  }
  throw new Error(`No file input with accept="${acceptValue}" found`);
};