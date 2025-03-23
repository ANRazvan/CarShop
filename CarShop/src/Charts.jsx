import React, { useEffect, useState } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
import Chart from 'chart.js/auto';
import './Charts.css'; // Import the Charts CSS

const getRandomImage = (cars) => {
  const images = cars.map(car => car.img);
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

const Charts = ({ cars, setCars }) => {
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        const newCarId = cars.length > 0 ? Math.max(...cars.map(car => car.id)) + 1 : 1;
        const newCar = {
          id: newCarId,
          make: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          year: faker.date.past(10).getFullYear(),
          keywords: faker.vehicle.type(),
          description: faker.lorem.sentence(),
          fuelType: faker.vehicle.fuel(),
          price: faker.number.int({ min: 10000, max: 50000 }),
          img: getRandomImage(cars),
        };

        setCars(prevCars => [...prevCars, newCar]);

        // Update charts based on the updated cars state
        const prices = [...cars, newCar].map(car => car.price);
        const years = [...cars, newCar].map(car => car.year);
        const fuelTypes = [...cars, newCar].reduce((acc, car) => {
          acc[car.fuelType] = (acc[car.fuelType] || 0) + 1;
          return acc;
        }, {});

        const newLineData = prices.slice(-7); // Last 7 prices
        const newBarData = years.slice(-5); // Last 5 years
        const newPieData = Object.values(fuelTypes);

        setLineData(newLineData);
        setBarData(newBarData);
        setPieData(newPieData);
      }, 2000); // Update every 2 seconds
    }

    return () => clearInterval(interval);
  }, [isGenerating, cars, setCars]);

  const toggleGeneration = () => {
    setIsGenerating(!isGenerating);
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
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        label: 'Car Years',
        data: barData,
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
        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h2>Real-Time Charts</h2>
      <div className="generatebuttoncontainer">
        <button className='generatebutton' onClick={toggleGeneration}>
          {isGenerating ? 'Stop Generating Cars' : 'Start Generating Cars'}
        </button>
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