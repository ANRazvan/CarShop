import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CarDetail from './CarDetail.jsx';
import '@testing-library/jest-dom';

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
];

test('renders CarDetail component', () => {
  render(
    <MemoryRouter initialEntries={['/CarDetail/1']}>
      <Routes>
        <Route path="/CarDetail/:id" element={<CarDetail cars={mockCars} setcars={() => {}} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText(/Mazda 6/i)).toBeInTheDocument();
  expect(screen.getByText(/1.5 Diesel 130Cp 2019/i)).toBeInTheDocument();
  expect(screen.getByText(/\$18209/i)).toBeInTheDocument();
  expect(screen.getByText(/A stylish and sporty sedan with a 1.5L diesel engine./i)).toBeInTheDocument();
});

test('renders "Car not found" when car ID is invalid', () => {
  render(
    <MemoryRouter initialEntries={['/CarDetail/999']}>
      <Routes>
        <Route path="/CarDetail/:id" element={<CarDetail cars={mockCars} setcars={() => {}} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText(/Car not found/i)).toBeInTheDocument();
});

test('calls handleDelete when delete button is clicked', () => {
  const handleDelete = jest.fn();
  window.confirm = jest.fn().mockImplementation(() => true); // Mock window.confirm to always return true

  render(
    <MemoryRouter initialEntries={['/CarDetail/1']}>
      <Routes>
        <Route path="/CarDetail/:id" element={<CarDetail cars={mockCars} setcars={() => {}} handleDelete1={handleDelete} />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByText(/Delete/i));
  expect(handleDelete).toHaveBeenCalledTimes(1);
});

test('navigates to update page when update button is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/CarDetail/1']}>
        <Routes>
          <Route path="/CarDetail/:id" element={<CarDetail cars={mockCars} setcars={() => {}} />} />
          <Route path="/UpdateCar/:id" element={<div>Update Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  
    fireEvent.click(screen.getByText(/Update/i));
    expect(screen.getByText(/Update Page/i)).toBeInTheDocument();
  });