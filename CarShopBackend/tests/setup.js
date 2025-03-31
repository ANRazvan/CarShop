// This will run before all tests
beforeAll(() => {
  // Make a backup of the cars data
  const carsData = require('../data/cars');
  global.originalCarsData = JSON.parse(JSON.stringify(carsData));
});

// This will run after all tests
afterAll(() => {
  // Restore original data
  const carsData = require('../data/cars');
  Object.assign(carsData, global.originalCarsData);
});

// Reset data between tests
afterEach(() => {
  const carsData = require('../data/cars');
  Object.assign(carsData, global.originalCarsData);
});