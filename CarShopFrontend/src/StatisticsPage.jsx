import React from 'react';
import Statistics from './Statistics';
import './Statistics.css';

const StatisticsPage = () => {
  return (
    <div className="statistics-page-container">
      <div className="statistics-page-header">
        <h1>Car Market Analytics</h1>
        <p>Advanced statistics and data visualization for our car inventory</p>
      </div>
      <Statistics />
    </div>
  );
};

export default StatisticsPage;