import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import CarList from './CarList';

// Mock the Statistics component since we're only testing CarList
jest.mock('./Statistics.jsx', () => {
  return function MockedStatistics() {
    return <div data-testid="statistics-component">Statistics Component</div>;
  };
});

describe('CarList Component', () => {
  // Sample mock data
  const mockCars = [
    { id: 1, make: 'Toyota', model: 'Camry', year: 2020, price: 25000, keywords: 'sedan family', img: 'toyota.jpg', fuelType: 'Gasoline' },
    { id: 2, make: 'Honda', model: 'Accord', year: 2019, price: 23000, keywords: 'sedan reliable', img: 'honda.jpg', fuelType: 'Hybrid' },
    { id: 3, make: 'Tesla', model: 'Model 3', year: 2021, price: 45000, keywords: 'electric luxury', img: 'tesla.jpg', fuelType: 'Electric' },
    { id: 4, make: 'Ford', model: 'F-150', year: 2018, price: 35000, keywords: 'truck powerful', img: 'ford.jpg', fuelType: 'Diesel' },
    { id: 5, make: 'BMW', model: 'X5', year: 2022, price: 60000, keywords: 'SUV luxury', img: 'bmw.jpg', fuelType: 'Gasoline' },
    { id: 6, make: 'Audi', model: 'A4', year: 2020, price: 40000, keywords: 'sedan premium', img: 'audi.jpg', fuelType: 'Hybrid' },
    { id: 7, make: 'Mercedes', model: 'C-Class', year: 2021, price: 50000, keywords: 'sedan luxury', img: 'mercedes.jpg', fuelType: 'Gasoline' },
    { id: 8, make: 'Chevrolet', model: 'Bolt', year: 2022, price: 38000, keywords: 'electric compact', img: 'chevy.jpg', fuelType: 'Electric' },
    { id: 9, make: 'Subaru', model: 'Outback', year: 2019, price: 28000, keywords: 'wagon awd', img: 'subaru.jpg', fuelType: 'Gasoline' },
  ];

  // Helper function to render component with router
  const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders the component correctly with default values', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Check if statistics component is rendered
    expect(screen.getByTestId('statistics-component')).toBeInTheDocument();
    
    // Check if controls are rendered
    expect(screen.getByText('Items per page:')).toBeInTheDocument();
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    
    // Check if default of 8 cars are displayed (or less if mockCars has less than 8)
    const displayCount = Math.min(8, mockCars.length);
    const carElements = screen.getAllByRole('heading', { level: 3 }); // Make headings
    expect(carElements.length).toBe(displayCount);
    
    // Check if pagination is rendered
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('filters cars by make correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={['Toyota', 'Honda']} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Only Toyota and Honda cars should be displayed
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
    expect(screen.queryByText('Tesla')).not.toBeInTheDocument();
    expect(screen.queryByText('Ford')).not.toBeInTheDocument();
  });

  test('filters cars by fuel type correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={['Electric']} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Only Electric cars should be displayed
    expect(screen.getByText('Tesla')).toBeInTheDocument();
    expect(screen.getByText('Chevrolet')).toBeInTheDocument();
    expect(screen.queryByText('Toyota')).not.toBeInTheDocument();
    expect(screen.queryByText('Honda')).not.toBeInTheDocument();
  });

  test('filters cars by price range correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={40000} 
        maxPrice={55000} 
        searchBar="" 
      />
    );
    
    // Only cars within the price range should be displayed
    expect(screen.getByText('Tesla')).toBeInTheDocument();
    expect(screen.getByText('Audi')).toBeInTheDocument();
    expect(screen.getByText('Mercedes')).toBeInTheDocument();
    expect(screen.queryByText('Toyota')).not.toBeInTheDocument();
    expect(screen.queryByText('BMW')).not.toBeInTheDocument(); // 60000 is above range
  });

  test('searches cars by keywords correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="luxury" 
      />
    );
    
    // Only cars with "luxury" in make, model, or keywords should be displayed
    expect(screen.getByText('Tesla')).toBeInTheDocument();
    expect(screen.getByText('BMW')).toBeInTheDocument();
    expect(screen.getByText('Mercedes')).toBeInTheDocument();
    expect(screen.queryByText('Toyota')).not.toBeInTheDocument();
  });

  test('sorts cars by price ascending correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Change sort method to price-asc
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
    
    // Get all car cards
    const prices = screen.getAllByText(/\$\d+/);
    
    // Check if prices are in ascending order
    const values = prices.map(price => parseInt(price.textContent.replace('$', ''), 10));
    const sortedValues = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sortedValues);
  });

  test('sorts cars by price descending correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Change sort method to price-desc
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'price-desc' } });
    
    // Get all car cards
    const prices = screen.getAllByText(/\$\d+/);
    
    // Check if prices are in descending order
    const values = prices.map(price => parseInt(price.textContent.replace('$', ''), 10));
    const sortedValues = [...values].sort((a, b) => b - a);
    expect(values).toEqual(sortedValues);
  });

  test('sorts cars by year ascending correctly', () => {
    // For this test, we need to ensure the year is visible in the component
    // The actual implementation might need some adjustment if year isn't displayed
    
    renderWithRouter(
      <CarList 
        cars={mockCars.map(car => ({ ...car, model: `${car.model} ${car.year}` }))} // Add year to model to make it visible
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Change sort method to year-asc
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'year-asc' } });
    
    // Check order by extracting years from model text
    const models = screen.getAllByRole('heading', { level: 4 });
    const years = models.map(model => parseInt(model.textContent.match(/\d{4}/)[0], 10));
    
    // Verify years are in ascending order
    const sortedYears = [...years].sort((a, b) => a - b);
    expect(years).toEqual(sortedYears);
  });

  test('sorts cars by year descending correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars.map(car => ({ ...car, model: `${car.model} ${car.year}` }))} // Add year to model to make it visible
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Change sort method to year-desc
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'year-desc' } });
    
    // Check order by extracting years from model text
    const models = screen.getAllByRole('heading', { level: 4 });
    const years = models.map(model => parseInt(model.textContent.match(/\d{4}/)[0], 10));
    
    // Verify years are in descending order
    const sortedYears = [...years].sort((a, b) => b - a);
    expect(years).toEqual(sortedYears);
  });

  test('changes items per page correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Default should show 8 items
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(Math.min(8, mockCars.length));
    
    // Change items per page to 4
    const itemsPerPageSelect = screen.getByLabelText('Items per page:');
    fireEvent.change(itemsPerPageSelect, { target: { value: '4' } });
    
    // Now should show 4 items
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBe(4);
  });

  test('pagination works correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Change items per page to 4 to ensure we have multiple pages
    const itemsPerPageSelect = screen.getByLabelText('Items per page:');
    fireEvent.change(itemsPerPageSelect, { target: { value: '4' } });
    
    // First page should be active
    const firstPageButton = screen.getByText('1');
    expect(firstPageButton).toHaveClass('active');
    
    // Click next page
    fireEvent.click(screen.getByText('Next'));
    
    // Second page should now be active
    const secondPageButton = screen.getByText('2');
    expect(secondPageButton).toHaveClass('active');
    
    // Previous button should now work
    fireEvent.click(screen.getByText('Previous'));
    
    // First page should be active again
    expect(firstPageButton).toHaveClass('active');
  });

  test('displays message when no cars match filters', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={['Porsche']} // No Porsche in our mock data
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Should show no cars message
    expect(screen.getByText('No cars available with the current filters')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search criteria or check back later.')).toBeInTheDocument();
  });

  test('applies correct price category class to car cards', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Get all car cards
    const carCards = document.querySelectorAll('.car-card');
    
    // Check if each car has exactly one price category class
    carCards.forEach(card => {
      const hasLowPrice = card.classList.contains('low-price');
      const hasMediumPrice = card.classList.contains('medium-price');
      const hasHighPrice = card.classList.contains('high-price');
      
      // Card should have exactly one price category class
      expect(hasLowPrice || hasMediumPrice || hasHighPrice).toBe(true);
      expect((hasLowPrice ? 1 : 0) + (hasMediumPrice ? 1 : 0) + (hasHighPrice ? 1 : 0)).toBe(1);
    });
    
    // Verify price categories are assigned correctly
    // BMW X5 at $60000 should be high-price
    const bmwCard = screen.getByText('BMW').closest('.car-card');
    expect(bmwCard).toHaveClass('high-price');
    
    // Honda Accord at $23000 should be low-price
    const hondaCard = screen.getByText('Honda').closest('.car-card');
    expect(hondaCard).toHaveClass('low-price');
  });

  test('renders links to car detail pages correctly', () => {
    renderWithRouter(
      <CarList 
        cars={mockCars} 
        selectedMakes={[]} 
        selectedFuel={[]} 
        minPrice={0} 
        maxPrice={0} 
        searchBar="" 
      />
    );
    
    // Check if links to detail pages are rendered with correct paths
    const links = document.querySelectorAll('a.detail-link');
    links.forEach((link, index) => {
      // Index + 1 because our mock data IDs start from 1
      expect(link.getAttribute('href')).toBe(`/CarDetail/${mockCars[index].id}`);
    });
  });
});