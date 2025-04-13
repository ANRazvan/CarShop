import React, { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
import Chart from 'chart.js/auto';
import axios from 'axios';
import './Charts.css'; // Import the Charts CSS
import config from './config.js';

const Charts = () => {
  const [cars, setCars] = useState([]); // State to store cars from the server
  const [availableImages, setAvailableImages] = useState([]); // Store available images
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch cars from the server 
  useEffect(() => {
    axios
      .get(`${config.API_URL}/api/cars`)
      .then((response) => {
        const carsData = response.data.cars || [];
        setCars(carsData);
        updateCharts(carsData);
        
        // Extract unique image names from the existing cars
        const uniqueImages = [...new Set(carsData.map(car => car.img))];
        setAvailableImages(uniqueImages.filter(img => img)); // Filter out any undefined/null values
        
        // If no images found, set a default fallback
        if (uniqueImages.length === 0) {
          setAvailableImages(['mazda1.jpg']);
        }
      })
      .catch((error) => {
        console.error('Error fetching cars:', error);
        // Set a default image if API fails
        setAvailableImages(['mazda1.jpg']);
      });
  }, []);

  // Function to update charts based on cars data
  const updateCharts = (cars) => {
    const prices = cars.map((car) => car.price);
    const years = cars.map((car) => car.year);
    const fuelTypes = cars.reduce((acc, car) => {
      acc[car.fuelType] = (acc[car.fuelType] || 0) + 1;
      return acc;
    }, {});

    const newLineData = prices.slice(-7); // Last 7 prices
    const newBarData = calculateYearIntervals(years, 5); // Group years into 5-year intervals
    const newPieData = Object.values(fuelTypes);

    setLineData(newLineData);
    setBarData(newBarData);
    setPieData(newPieData);
  };

  // Function to generate a new car and send it to the server
  const generateCar = () => {
    // Select a random image from the available images
    const randomImg = availableImages[Math.floor(Math.random() * availableImages.length)];
    
    const newCar = {
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.date.past(70, new Date('2030')).getFullYear(), // Generate realistic years
      keywords: faker.vehicle.type(),
      description: faker.lorem.sentence(),
      fuelType: faker.helpers.arrayElement(['Diesel', 'Gasoline', 'Hybrid', 'Electric']), // Use realistic fuel types
      price: faker.number.int({ min: 10000, max: 50000 }),
      img: randomImg, // Use a randomly selected existing image
    };

    axios
      .post(`${config.API_URL}/api/cars`, newCar)
      .then((response) => {
        const updatedCars = [...cars, response.data];
        setCars(updatedCars);
        updateCharts(updatedCars);
      })
      .catch((error) => {
        console.error('Error adding car:', error);
      });
  };

  // Handle real-time car generation
  useEffect(() => {
    let interval;
    if (isGenerating && availableImages.length > 0) {
      interval = setInterval(() => {
        generateCar();
      }, 5000); // Generate a new car every 2 seconds
    }

    return () => clearInterval(interval);
  }, [isGenerating, cars, availableImages]);

  const toggleGeneration = () => {
    setIsGenerating(!isGenerating);
  };

  // Function to calculate year intervals
  const calculateYearIntervals = (years, intervalSize) => {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const intervals = [];

    for (let start = Math.floor(minYear / intervalSize) * intervalSize; start <= maxYear; start += intervalSize) {
      const end = start + intervalSize - 1;
      const count = years.filter((year) => year >= start && year <= end).length;
      intervals.push({ range: `${start}-${end}`, count });
    }

    return intervals;
  };

  const lineChartData = {
    labels: ['1', '2', '3', '4', '5', '6', '7'],
    datasets: [
      {
        label: 'Car Prices',
        data: lineData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  };

  const barChartData = {
    labels: barData.map((interval) => interval.range), // Use year intervals as labels
    datasets: [
      {
        label: 'Car Years',
        data: barData.map((interval) => interval.count), // Use counts for each interval
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(cars.reduce((acc, car) => {
      acc[car.fuelType] = (acc[car.fuelType] || 0) + 1;
      return acc;
    }, {})),
    datasets: [
      {
        label: 'Fuel Types',
        data: pieData,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)', // Red
          'rgba(54, 162, 235, 0.2)', // Blue
          'rgba(255, 206, 86, 0.2)', // Yellow
          'rgba(75, 192, 192, 0.2)', // Green
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)', // Red
          'rgba(54, 162, 235, 1)', // Blue
          'rgba(255, 206, 86, 1)', // Yellow
          'rgba(75, 192, 192, 1)', // Green
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h2>Real-Time Charts</h2>
      <div className="generatebuttoncontainer">
        <button className="generatebutton" onClick={toggleGeneration}>
          {isGenerating ? 'Stop Generating Cars' : 'Start Generating Cars'}
        </button>
        <div className="image-info">
        </div>
      </div>
      <div className="chart-container">
        <div className="chart">
          <Line data={lineChartData} />
        </div>
        <div className="chart">
          <Bar data={barChartData} />
        </div>
        <div className="chart">
          <Pie data={pieChartData} />
        </div>
      </div>
    </div>
  );
};

export default Charts;