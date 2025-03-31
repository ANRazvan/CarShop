import React, { useState, useEffect } from 'react';
import networkStatusService from '../services/NetworkStatusService';
import offlineStorageService from '../services/OfflineStorageService';
import './NetworkStatusBar.css';

const NetworkStatusBar = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isServerAvailable: true
  });
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatusService.addStatusListener(status => {
      setNetworkStatus(status);
    });
    
    // Initialize pending operations count
    setPendingOperations(offlineStorageService.getPendingOperationsCount());
    
    // Check pending operations count every 2 seconds
    const interval = setInterval(() => {
      setPendingOperations(offlineStorageService.getPendingOperationsCount());
    }, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  const handleSyncClick = async () => {
    if (!networkStatus.isOnline || !networkStatus.isServerAvailable) {
      return;
    }
    
    setIsSyncing(true);
    try {
      await offlineStorageService.syncPendingOperations();
      setPendingOperations(offlineStorageService.getPendingOperationsCount());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // If everything is fine and no pending operations, don't show anything
  if (networkStatus.isOnline && networkStatus.isServerAvailable && pendingOperations === 0) {
    return null;
  }
  
  return (
    <div className={`network-status-bar ${!networkStatus.isOnline ? 'offline' : !networkStatus.isServerAvailable ? 'server-down' : ''}`}>
      {!networkStatus.isOnline && (
        <div className="status-message">
          <span className="status-icon">📶</span>
          <span>You are offline. Changes will be saved locally.</span>
        </div>
      )}
      
      {networkStatus.isOnline && !networkStatus.isServerAvailable && (
        <div className="status-message">
          <span className="status-icon">🖥️</span>
          <span>Server is unavailable. Changes will be saved locally.</span>
        </div>
      )}
      
      {pendingOperations > 0 && (
        <div className="sync-container">
          <span>{pendingOperations} pending change{pendingOperations !== 1 ? 's' : ''}</span>
          {networkStatus.isOnline && networkStatus.isServerAvailable && (
            <button 
              className="sync-button" 
              onClick={handleSyncClick}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync now'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkStatusBar;
