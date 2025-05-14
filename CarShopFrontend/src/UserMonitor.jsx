import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import './UserMonitor.css';
import config from './config';

const UserMonitor = () => {
  const [monitoredUsers, setMonitoredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [stats, setStats] = useState(null);
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
      
      const response = await fetch(`${config.API_URL}/api/monitoring/monitored`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch monitored users');
      }
      
      const data = await response.json();
      setMonitoredUsers(data);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching monitored users:', error);
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
      
      const response = await fetch(`${config.API_URL}/api/monitoring/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
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
      
      const response = await fetch(`${config.API_URL}/api/monitoring/logs/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user logs');
      }
      
      const data = await response.json();
      setUserLogs(data);
    } catch (error) {
      console.error('Error fetching user logs:', error);
    }
  };
  
  // Update monitored user status
  const updateUserStatus = async (id, status) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${config.API_URL}/api/monitoring/monitored/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }
      
      // Refresh monitored users list
      fetchMonitoredUsers();
    } catch (error) {
      setError(error.message);
      console.error('Error updating user status:', error);
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
                  </div>
                  <div className="user-actions">
                    <button 
                      className="resolve-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateUserStatus(item.id, 'resolved');
                      }}
                    >
                      Mark Resolved
                    </button>
                    <button 
                      className="false-positive-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateUserStatus(item.id, 'false_positive');
                      }}
                    >
                      False Positive
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
