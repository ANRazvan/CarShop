import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarList from './CarList';

const mockCars = [
  {
    id: 1,
    make: 'Mazda',
    model: '6',
    year: '2019',
    keywords: '1.5 Diesel 130Cp 2019',
    description: 'A stylish and sporty sedan with a 1.5L diesel engine.',
    fuelType: 'Diesel',
    price: 18209,
    img: 'mazda.jpg',
  },
  {
    id: 2,
    make: 'Toyota',
    model: 'Corolla',
    year: '2020',
    keywords: '1.8 Hybrid 2020',
    description: 'A reliable and fuel-efficient sedan with a 1.8L hybrid engine.',
    fuelType: 'Hybrid',
    price: 20000,
    img: 'toyota.jpg',
  },
  {
    id: 3,
    make: 'Honda',
    model: 'Civic',
    year: '2018',
    keywords: '2.0 Petrol 2018',
    description: 'A compact car with a 2.0L petrol engine.',
    fuelType: 'Petrol',
    price: 15000,
    img: 'honda.jpg',
  },
];

test('renders a simple component', () => {
  render(<div>Hello, world!</div>);
  expect(screen.getByText('Hello, world!')).toBeInTheDocument();
});

test('sorts cars by price in ascending order', () => {
  render(
    <CarList
      cars={mockCars}
      selectedMakes={[]}
      selectedFuel={[]}
      minPrice={0}
      maxPrice={Infinity}
      searchBar=""
    />
  );

  // Select the sort method
  fireEvent.change(screen.getByLabelText(/Sort by:/i), { target: { value: 'price-asc' } });

  // Check if the cars are sorted by price in ascending order
  const carPrices = screen.getAllByText(/\$\d+/).map(price => parseInt(price.textContent.replace('$', '')));
  expect(carPrices).toEqual([15000, 18209, 20000]);
});

