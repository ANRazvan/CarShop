const request = require('supertest');
const express = require('express');
const cors = require('cors');
const carRoutes = require('../routes/cars');
const { carsData } = require('../controllers/carController');

// Create a test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/cars', carRoutes);

describe('Car API Integration Tests', () => {
  // Test GET /api/cars endpoint
  describe('GET /api/cars', () => {
    test('should return paginated cars list', async () => {
      const response = await request(app).get('/api/cars');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cars');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage');
    });

    test('should filter cars by make', async () => {
      // Assume at least one Toyota exists in your test data
      const make = 'Toyota';
      const response = await request(app).get(`/api/cars?make=${make}`);
      
      expect(response.status).toBe(200);
      expect(response.body.cars.every(car => car.make === make)).toBe(true);
    });
  });

  // Test GET /api/cars/:id endpoint
  describe('GET /api/cars/:id', () => {
    test('should return a specific car by ID', async () => {
      // Get the first car from the data or use a known ID
      const carId = carsData.cars[0].id;
      const response = await request(app).get(`/api/cars/${carId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', carId);
    });

    test('should return 404 for non-existent car ID', async () => {
      const nonExistentId = 9999;
      const response = await request(app).get(`/api/cars/${nonExistentId}`);
      
      expect(response.status).toBe(404);
    });
  });

  // Test POST /api/cars endpoint (without image upload)
  describe('POST /api/cars', () => {
    test('should create a new car', async () => {
      const newCar = {
        make: 'Test Make',
        model: 'Test Model',
        year: '2023',
        fuelType: 'Electric',
        price: '30000',
        description: 'Test description'
      };
      
      const response = await request(app)
        .post('/api/cars')
        .send(newCar);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.make).toBe(newCar.make);
    });

    test('should reject invalid car data', async () => {
      const invalidCar = {
        // Missing required fields
        make: 'Test Make'
      };
      
      const response = await request(app)
        .post('/api/cars')
        .send(invalidCar);
      
      expect(response.status).toBe(400);
    });
  });

  // Test PUT and DELETE endpoints
  describe('PUT /api/cars/:id', () => {
    test('should update an existing car', async () => {
      const carId = carsData.cars[0].id;
      const updates = { 
        price: 25000,
        description: 'Updated description',
        make: carsData.cars[0].make,    // Include required fields
        model: carsData.cars[0].model,
        year: carsData.cars[0].year,
        fuelType: carsData.cars[0].fuelType
      };
      
      const response = await request(app)
        .put(`/api/cars/${carId}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.price).toBe(updates.price);
      expect(response.body.description).toBe(updates.description);
    });
  });

  describe('DELETE /api/cars/:id', () => {
    test('should delete a car', async () => {
      // Use the last car to avoid affecting other tests
      const carIndex = carsData.cars.length - 1;
      const carId = carsData.cars[carIndex].id;
      
      const response = await request(app)
        .delete(`/api/cars/${carId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Car deleted successfully');
    });
  });
});