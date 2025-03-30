import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Statistics from './Statistics';

describe('Statistics Component', () => {
  const mockCars = [
    { id: 1, make: 'Toyota', model: 'Camry', year: 2020, price: 25000 },
    { id: 2, make: 'Honda', model: 'Accord', year: 2019, price: 23000 },
    { id: 3, make: 'Tesla', model: 'Model 3', year: 2021, price: 45000 },
    { id: 4, make: 'Ford', model: 'F-150', year: 2018, price: 35000 },
    { id: 5, make: 'BMW', model: 'X5', year: 2022, price: 60000 }
  ];

  test('renders statistics correctly with car data', () => {
    render(<Statistics cars={mockCars} />);
    
    // Check if all statistic labels are rendered
    expect(screen.getByText('Most Expensive:')).toBeInTheDocument();
    expect(screen.getByText('Average Price:')).toBeInTheDocument();
    expect(screen.getByText('Least Expensive:')).toBeInTheDocument();
    
    // Check if values are correctly calculated and displayed
    expect(screen.getByText('$60000')).toBeInTheDocument(); // Max price
    expect(screen.getByText('$23000')).toBeInTheDocument(); // Min price
    
    // Calculate expected average
    const avgPrice = mockCars.reduce((sum, car) => sum + car.price, 0) / mockCars.length;
    expect(screen.getByText(`$${avgPrice.toFixed(2)}`)).toBeInTheDocument();
  });

  test('renders nothing when cars array is empty', () => {
    const { container } = render(<Statistics cars={[]} />);
    
    // Container should be empty
    expect(container.firstChild).toBeNull();
    
    // Statistics elements should not be in the document
    expect(screen.queryByText('Most Expensive:')).not.toBeInTheDocument();
    expect(screen.queryByText('Average Price:')).not.toBeInTheDocument();
    expect(screen.queryByText('Least Expensive:')).not.toBeInTheDocument();
  });


  test('has correct CSS classes for styling', () => {
    render(<Statistics cars={mockCars} />);
    
    // Check container class
    const container = screen.getByText('Most Expensive:').closest('.statistics');
    expect(container).toHaveClass('statistics');
    
    // Check individual stat item classes
    const statItems = document.querySelectorAll('.stat-item');
    expect(statItems.length).toBe(3);
    
    // Check price value classes
    expect(document.querySelector('.max-price')).toHaveTextContent('$60000');
    expect(document.querySelector('.avg-price')).toHaveTextContent('$37600.00');
    expect(document.querySelector('.min-price')).toHaveTextContent('$23000');
  });

  test('handles cars with zero price correctly', () => {
    const carsWithZeroPrice = [
      ...mockCars,
      { id: 6, make: 'Free', model: 'Car', year: 2020, price: 0 }
    ];
    render(<Statistics cars={carsWithZeroPrice} />);
    
    // Min price should be 0
    expect(screen.getByText('$0')).toBeInTheDocument();
    
    // Max price should still be 60000
    expect(screen.getByText('$60000')).toBeInTheDocument();
    
    // Calculate expected average
    const avgPrice = carsWithZeroPrice.reduce((sum, car) => sum + car.price, 0) / carsWithZeroPrice.length;
    expect(screen.getByText(`$${avgPrice.toFixed(2)}`)).toBeInTheDocument();
  });

  test('handles negative prices correctly (if possible in the app)', () => {
    const carsWithNegativePrice = [
      ...mockCars,
      { id: 6, make: 'Discount', model: 'Car', year: 2020, price: -5000 }
    ];
    render(<Statistics cars={carsWithNegativePrice} />);
    
    // Min price should be -5000
    expect(screen.getByText('$-5000')).toBeInTheDocument();
    
    // Max price should still be 60000
    expect(screen.getByText('$60000')).toBeInTheDocument();
    
    // Calculate expected average
    const avgPrice = carsWithNegativePrice.reduce((sum, car) => sum + car.price, 0) / carsWithNegativePrice.length;
    expect(screen.getByText(`$${avgPrice.toFixed(2)}`)).toBeInTheDocument();
  });
});