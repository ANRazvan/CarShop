import React from 'react';
import './Statistics.css';

const Statistics = ({ cars }) => {
  if (cars.length === 0) return null;

  const prices = cars.map(car => car.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  return (
    <div className="statistics">
      <div className="stat-item">
        <span>Most Expensive:</span>
        <span className="max-price">${maxPrice}</span>
      </div>
      <div className="stat-item">
        <span>Average Price:</span>
        <span className="avg-price">${avgPrice.toFixed(2)}</span>
      </div>
      <div className="stat-item">
        <span>Least Expensive:</span>
        <span className="min-price">${minPrice}</span>
      </div>
    </div>
  );
};

export default Statistics;