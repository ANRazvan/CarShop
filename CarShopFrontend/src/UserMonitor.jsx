import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import './UserMonitor.css';
import config from './config';
import axios from 'axios';

const UserMonitor = () => {
  const [monitoredUsers, setMonitoredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [stats, setStats] = useState(null);
  const [processingIds, setProcessingIds] = useState([]); // Track which user IDs are being processed
  const { isAdmin, getAuthToken } = useAuth();
    // Fetch monitored users on component mount
  useEffect(() => {
    fetchMonitoredUsers();
    fetchUserStats();
  }, []);
  
  // Fetch monitored users
  const fetchMonitoredUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('Fetching monitored users...');
      
      const response = await axios.get(`${config.API_URL}/api/monitoring/monitored`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      });
      
      console.log(`Fetched ${response.data.length} monitored users`);
      setMonitoredUsers(response.data);
    } catch (error) {
      console.error('Error fetching monitored users:', error);
      
      let errorMessage = 'Failed to fetch monitored users';
      if (error.response) {
        errorMessage = error.response.data?.message || 
          `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response received from server. Check your network connection.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
    // Fetch user activity stats
  const fetchUserStats = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log('Fetching user activity stats...');
      
      const response = await fetch(`${config.API_URL}/api/monitoring/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' // Add this to match CORS allowedHeaders
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || 'Failed to fetch user stats';
        } catch (e) {
          errorMessage = `Failed to fetch user stats: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('User activity stats fetched successfully');
      setStats(data);    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };
  
  // Fetch user logs
  const fetchUserLogs = async (userId) => {
    setSelectedUserId(userId);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`Fetching logs for user ID: ${userId}`);
      
      const response = await fetch(`${config.API_URL}/api/monitoring/logs/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' // Add this to match CORS allowedHeaders
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || 'Failed to fetch user logs';
        } catch (e) {
          errorMessage = `Failed to fetch user logs: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} logs for user ID: ${userId}`);
      setUserLogs(data);
    } catch (error) {
      console.error('Error fetching user logs:', error);    }
  };
  
  // Update monitored user status
  const updateUserStatus = async (id, status) => {
    try {
      // Add this ID to the processing list
      setProcessingIds(prev => [...prev, id]);
      
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      console.log(`Updating user ${id} status to ${status}`);
      
      // Create a test request first to see if the server is responding
      try {
        const testResponse = await fetch(`${config.API_URL}/api/cars?page=1&limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`Server test ping response status: ${testResponse.status}`);
      } catch (e) {
        console.error('Error in test request:', e);
      }
      
      // Actual request using XMLHttpRequest for better debugging
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PATCH', `${config.API_URL}/api/monitoring/monitored/${id}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 15000; // 15 second timeout
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`Success: ${xhr.responseText}`);
            // Refresh monitored users list
            fetchMonitoredUsers();
            // Show success message
            alert(`User status successfully updated to "${status}"`);
            resolve(xhr.responseText);
          } else {
            console.error(`Error ${xhr.status}: ${xhr.responseText}`);
            setError(`Server returned error: ${xhr.status}`);
            alert(`Error ${xhr.status}: ${xhr.responseText || 'Unknown error'}`);
            reject(new Error(`Server returned ${xhr.status}`));
          }
        };
        
        xhr.onerror = function() {
          console.error("Network Error");
          setError("Network Error - Could not connect to server");
          alert("Network Error - Could not connect to server");
          reject(new Error("Network Error"));
        };
        
        xhr.ontimeout = function() {
          console.error("Request timed out");
          setError("Request timed out - Server took too long to respond");
          alert("Request timed out - Server took too long to respond");
          reject(new Error("Timeout"));
        };
        
        const data = JSON.stringify({ status });
        console.log(`Sending data: ${data}`);
        xhr.send(data);
      }).catch(error => {
        console.error('Error in XMLHttpRequest:', error);
      }).finally(() => {
        // Remove this ID from the processing list whether successful or not
        setProcessingIds(prev => prev.filter(processId => processId !== id));
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      
      // Format error message
      let errorMessage = 'Failed to update status: ' + error.message;
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
      
      // Remove this ID from the processing list
      setProcessingIds(prev => prev.filter(processId => processId !== id));
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  if (!isAdmin()) {
    return (
      <div className="user-monitor-container">
        <h2>Access Denied</h2>
        <p>You need administrator privileges to access this page.</p>
      </div>
    );
  }
  
  return (
    <div className="user-monitor-container">
      <h2>User Monitoring Dashboard</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="monitor-grid">
        <div className="monitored-users-panel">
          <h3>Monitored Users ({monitoredUsers.length})</h3>
          
          {loading ? (
            <p>Loading users...</p>
          ) : monitoredUsers.length === 0 ? (
            <p>No monitored users found.</p>
          ) : (
            <div className="user-list">
              {monitoredUsers.map((item) => (
                <div 
                  key={item.id} 
                  className={`user-item ${selectedUserId === item.userId ? 'selected' : ''}`}
                  onClick={() => fetchUserLogs(item.userId)}
                >
                  <div className="user-item-header">
                    <span className="username">{item.user.username}</span>
                    <span className={`status-badge ${item.status}`}>{item.status}</span>
                  </div>
                  <p className="reason">{item.reason}</p>
                  <div className="user-item-details">
                    <span>Actions: {item.actionsCount}</span>
                    <span>Detected: {formatTimestamp(item.firstDetected)}</span>
                  </div>                  <div className="user-actions">
                    <button 
                      className="resolve-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Mark user "${item.user.username}" as resolved?`)) {
                          updateUserStatus(item.id, 'resolved');
                        }
                      }}
                      disabled={processingIds.includes(item.id)}
                      title="Mark this case as resolved (legitimate but addressed)"
                    >
                      {processingIds.includes(item.id) ? 'Processing...' : 'Mark Resolved'}
                    </button>
                    <button 
                      className="false-positive-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Mark user "${item.user.username}" as false positive?`)) {
                          updateUserStatus(item.id, 'false_positive');
                        }
                      }}
                      disabled={processingIds.includes(item.id)}
                      title="Mark this case as a false positive (not actually suspicious)"
                    >
                      {processingIds.includes(item.id) ? 'Processing...' : 'False Positive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="user-logs-panel">
          <h3>User Activity Logs</h3>
          
          {selectedUserId ? (
            userLogs.length > 0 ? (
              <div className="logs-list">
                {userLogs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span className={`log-action ${log.action.toLowerCase()}`}>
                        {log.action}
                      </span>
                      <span className="log-timestamp">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="log-entity">
                      {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                    </p>
                    <p className="log-details">
                      {log.details && (
                        <details>
                          <summary>Details</summary>
                          <pre>{log.details}</pre>
                        </details>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No logs found for this user.</p>
            )
          ) : (
            <p>Select a user to view their activity logs.</p>
          )}
        </div>
      </div>
      
      {stats && (
        <div className="stats-panel">
          <h3>Activity Overview (Last 24 Hours)</h3>
          <div className="stats-grid">
            <div className="stats-card">
              <h4>Actions by Type</h4>
              <div className="actions-chart">
                {stats.recentActivity.map((item) => (
                  <div key={item.action} className="chart-item">
                    <div className="chart-label">{item.action}</div>
                    <div 
                      className={`chart-bar ${item.action.toLowerCase()}`}
                      style={{ width: `${Math.min(item.count * 5, 100)}%` }}
                    >
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="stats-card">
              <h4>Most Active Users</h4>
              <div className="active-users">
                {stats.mostActiveUsers.map((item) => (
                  <div key={item.userId} className="active-user-item">
                    <span className="user-name">
                      {item.user.username}
                      <span className={`role-badge ${item.user.role}`}>
                        {item.user.role}
                      </span>
                    </span>
                    <span className="action-count">{item.actionCount} actions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="simulation-panel">
        <h3>Test Suspicious Activity</h3>
        <p>For demonstration purposes, you can simulate suspicious activity to test the monitoring system.</p>
        <button 
          className="simulate-button"
          onClick={() => {
            // Call backend API to simulate suspicious activity
            fetch(`${config.API_URL}/api/monitoring/simulate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                action: 'CREATE',
                count: 15
              })
            })
            .then(response => {
              if (!response.ok) return response.json().then(err => { throw new Error(err.message) });
              return response.json();
            })
            .then(() => {
              alert('Suspicious activity simulated. Check the monitored users list in a few seconds.');
              // Refresh after a short delay to allow the monitoring system to process the activity
              setTimeout(() => {
                fetchMonitoredUsers();
                fetchUserStats();
              }, 5000);
            })
            .catch(error => {
              setError(error.message);
              console.error('Error simulating activity:', error);
            });
          }}
        >
          Simulate Suspicious Activity
        </button>
      </div>
    </div>
  );
};

export default UserMonitor;
