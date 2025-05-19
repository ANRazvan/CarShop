import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import config from './config';
import './IndexPerformance.css';

const IndexPerformance = () => {
  const [indicesEnabled, setIndicesEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [indicesData, setIndicesData] = useState(null);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    withIndices: [],
    withoutIndices: [],
    current: []
  });
  const [testRunning, setTestRunning] = useState(false);
  const { getAuthToken } = useAuth();

  useEffect(() => {
    fetchIndicesStatus();
  }, []);

  // Fetch current indices status
  const fetchIndicesStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${config.API_URL}/api/statistics/indices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch indices status: ${response.status}`);
      }
      
      const data = await response.json();
      setIndicesData(data);
      setIndicesEnabled(data.enabled);
    } catch (error) {
      console.error('Error fetching indices status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle indices
  const toggleIndices = async () => {
    setLoading(true);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const newStatus = !indicesEnabled;
      
      const response = await fetch(
        `${config.API_URL}/api/statistics/indices/toggle?enable=${newStatus}`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to toggle indices: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Indices toggled:', data);
      
      setIndicesEnabled(newStatus);
      
      // Refresh status
      fetchIndicesStatus();
    } catch (error) {
      console.error('Error toggling indices:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Run a performance test
  const runPerformanceTest = async () => {
    setTestRunning(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // First test with current setting
      const startTimeCurrent = performance.now();
      const responseCurrent = await fetch(
        `${config.API_URL}/api/statistics/cars`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const endTimeCurrent = performance.now();
      const durationCurrent = endTimeCurrent - startTimeCurrent;
      
      if (!responseCurrent.ok) {
        throw new Error(`Test failed: ${responseCurrent.status}`);
      }
      
      // Enable indices for first test
      await fetch(
        `${config.API_URL}/api/statistics/indices/toggle?enable=true`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Test with indices
      const startTimeWithIndices = performance.now();
      const responseWithIndices = await fetch(
        `${config.API_URL}/api/statistics/cars`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const endTimeWithIndices = performance.now();
      const durationWithIndices = endTimeWithIndices - startTimeWithIndices;
      
      if (!responseWithIndices.ok) {
        throw new Error(`Test with indices failed: ${responseWithIndices.status}`);
      }
      
      // Disable indices for second test
      await fetch(
        `${config.API_URL}/api/statistics/indices/toggle?enable=false`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Test without indices
      const startTimeWithoutIndices = performance.now();
      const responseWithoutIndices = await fetch(
        `${config.API_URL}/api/statistics/cars`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const endTimeWithoutIndices = performance.now();
      const durationWithoutIndices = endTimeWithoutIndices - startTimeWithoutIndices;
      
      if (!responseWithoutIndices.ok) {
        throw new Error(`Test without indices failed: ${responseWithoutIndices.status}`);
      }
      
      // Reset to original setting
      await fetch(
        `${config.API_URL}/api/statistics/indices/toggle?enable=${indicesEnabled}`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update performance data
      setPerformanceData(prev => ({
        withIndices: [...prev.withIndices, durationWithIndices],
        withoutIndices: [...prev.withoutIndices, durationWithoutIndices],
        current: [...prev.current, durationCurrent]
      }));
      
      // Refresh status
      fetchIndicesStatus();
    } catch (error) {
      console.error('Error running performance test:', error);
      setError(error.message);
    } finally {
      setTestRunning(false);
    }
  };

  // Calculate averages
  const calculateAverage = (arr) => {
    if (!arr.length) return 0;
    return arr.reduce((sum, time) => sum + time, 0) / arr.length;
  };

  const averageWithIndices = calculateAverage(performanceData.withIndices);
  const averageWithoutIndices = calculateAverage(performanceData.withoutIndices);
  const averageCurrent = calculateAverage(performanceData.current);
  
  // Calculate improvement percentage
  const calculateImprovement = () => {
    if (!averageWithIndices || !averageWithoutIndices) return 0;
    return ((averageWithoutIndices - averageWithIndices) / averageWithoutIndices) * 100;
  };
  
  const improvement = calculateImprovement();

  return (
    <div className="index-performance-container">
      <h2>Database Index Performance Testing</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="index-status-panel">
        <h3>Database Indices Status</h3>
        
        {loading ? (
          <p>Loading indices status...</p>
        ) : (
          <>
            <div className="status-indicator">
              <span className="status-label">Indices are currently:</span>
              <span className={`status-value ${indicesEnabled ? 'enabled' : 'disabled'}`}>
                {indicesEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            
            <button 
              className={`toggle-button ${indicesEnabled ? 'disable' : 'enable'}`}
              onClick={toggleIndices}
              disabled={loading}
            >
              {loading ? 'Processing...' : indicesEnabled ? 'Disable Indices' : 'Enable Indices'}
            </button>
            
            {indicesData && indicesData.indices && (
              <div className="indices-list">
                <h4>Available Indices ({indicesData.indices.length})</h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Table</th>
                        <th>Index Name</th>
                        <th>Definition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indicesData.indices.map((idx, index) => (
                        <tr key={index}>
                          <td>{idx.tablename}</td>
                          <td>{idx.indexname}</td>
                          <td><code>{idx.indexdef}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="performance-test-panel">
        <h3>Performance Testing</h3>
        <p>Run a test to see the performance difference with and without indices.</p>
        
        <button 
          className="test-button"
          onClick={runPerformanceTest}
          disabled={testRunning}
        >
          {testRunning ? 'Testing...' : 'Run Performance Test'}
        </button>
        
        {performanceData.withIndices.length > 0 && (
          <div className="results-panel">
            <h4>Test Results</h4>
            
            <div className="performance-metrics">
              <div className={`metric-card ${indicesEnabled ? 'active' : ''}`}>
                <h5>With Indices</h5>
                <div className="metric-value">{averageWithIndices.toFixed(2)} ms</div>
                <div className="tests-count">({performanceData.withIndices.length} tests)</div>
              </div>
              
              <div className={`metric-card ${!indicesEnabled ? 'active' : ''}`}>
                <h5>Without Indices</h5>
                <div className="metric-value">{averageWithoutIndices.toFixed(2)} ms</div>
                <div className="tests-count">({performanceData.withoutIndices.length} tests)</div>
              </div>
              
              <div className="metric-card improvement">
                <h5>Improvement</h5>
                <div className={`metric-value ${improvement > 0 ? 'positive' : 'negative'}`}>
                  {improvement.toFixed(2)}%
                </div>
                <div className="improvement-label">
                  {improvement > 0 ? 'Faster with indices' : 'Faster without indices'}
                </div>
              </div>
            </div>
            
            <div className="performance-chart">
              <h5>Response Time Comparison</h5>
              <div className="chart-wrapper">
                <div
                  className="chart-bar with-indices"
                  style={{width: `${(averageWithIndices / Math.max(averageWithIndices, averageWithoutIndices)) * 100}%`}}
                >
                  <span className="bar-label">With Indices</span>
                  <span className="bar-value">{averageWithIndices.toFixed(2)} ms</span>
                </div>
                <div
                  className="chart-bar without-indices"
                  style={{width: `${(averageWithoutIndices / Math.max(averageWithIndices, averageWithoutIndices)) * 100}%`}}
                >
                  <span className="bar-label">Without Indices</span>
                  <span className="bar-value">{averageWithoutIndices.toFixed(2)} ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="info-panel">
        <h3>About Database Indices</h3>
        <p>
          Database indices are data structures that improve the speed of data retrieval operations
          on database tables. They work like the index in a book, allowing the database to find data
          without having to scan the entire table.
        </p>
        <p>
          <strong>With indices:</strong> Queries can quickly locate the exact rows needed using the index.
        </p>
        <p>
          <strong>Without indices:</strong> The database must perform a full table scan, checking every row.
        </p>
        <p>
          For large datasets (like this application with over 100,000 records), indices can dramatically
          improve query performance, often by orders of magnitude.
        </p>
      </div>
    </div>
  );
};

export default IndexPerformance;
