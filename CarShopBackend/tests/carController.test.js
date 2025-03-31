const { 
  getCars, 
  getCarById,
  filterCars,
  validateCarData,
  carsData 
} = require('../controllers/carController');

describe('Car Controller Unit Tests', () => {
  // Test validateCarData function
  describe('validateCarData', () => {
    test('should validate a correct car object', () => {
      const validCar = {
        make: 'Toyota',
        model: 'Corolla',
        year: '2022',
        fuelType: 'Gasoline',
        price: 25000,
        img: 'car.jpg'
      };
      
      const result = validateCarData(validCar);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should reject invalid car data', () => {
      const invalidCar = {
        make: '',
        model: 'Corolla',
        year: 'abc',
        fuelType: 'Steam',
        price: -5000
      };
      
      const result = validateCarData(invalidCar);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    test('should validate required fields', () => {
      const requiredFields = ['make', 'model', 'year', 'price'];
      
      requiredFields.forEach(field => {
        const carData = {
          make: 'Toyota',
          model: 'Corolla',
          year: '2022',
          fuelType: 'Gasoline',
          price: 25000,
          description: 'A reliable sedan'
        };
        
        // Set the field to an empty value
        if (field === 'price') {
          carData[field] = '';
        } else {
          carData[field] = '';
        }
        
        const result = validateCarData(carData);
        expect(result.valid).toBe(false);
        // Check if any error message contains the field name
        const hasFieldError = result.errors.some(
          error => error.toLowerCase().includes(field.toLowerCase())
        );
        expect(hasFieldError).toBe(true);
      });
    });
  });

  // Test filterCars function
  describe('filterCars', () => {
    test('should filter cars by make', () => {
      const mockCars = [
        { id: 1, make: 'Toyota', model: 'Corolla', price: 20000 },
        { id: 2, make: 'Honda', model: 'Civic', price: 22000 },
        { id: 3, make: 'Toyota', model: 'Camry', price: 25000 }
      ];
      
      const result = filterCars({ cars: mockCars, make: 'Toyota' });
      expect(result.length).toBe(2);
      expect(result.every(car => car.make === 'Toyota')).toBe(true);
    });

    test('should filter cars by price range', () => {
      const mockCars = [
        { id: 1, make: 'Toyota', model: 'Corolla', price: 20000 },
        { id: 2, make: 'Honda', model: 'Civic', price: 22000 },
        { id: 3, make: 'Toyota', model: 'Camry', price: 25000 }
      ];
      
      const result = filterCars({ 
        cars: mockCars, 
        minPrice: 21000, 
        maxPrice: 23000 
      });
      
      expect(result.length).toBe(1);
      expect(result[0].model).toBe('Civic');
    });
  });
});