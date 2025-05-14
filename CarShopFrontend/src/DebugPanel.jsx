import React, { useState } from "react";
import axios from "axios";
import config from "./config.js";

// Helper function to get offline queue
const getOfflineQueue = () => {
    const queue = localStorage.getItem('offlineOperationsQueue');
    return queue ? JSON.parse(queue) : [];
};

const DebugPanel = ({
    isOnline,
    serverAvailable,
    lastServerCheck,
    setIsOnline,
    setServerAvailable,
    setLastServerCheck,
    checkServerAvailability,
    syncOfflineChanges,
    cars,
    deleteCar,
    refreshCars
}) => {
    const [expanded, setExpanded] = useState(false);
    const [lastDeleteResult, setLastDeleteResult] = useState(null);
    
    // Function to test delete operations with detailed logging
    const testDeleteOperation = async (id, forceMode = null) => {
        if (!id) {
            const randomCar = cars[Math.floor(Math.random() * cars.length)];
            id = randomCar ? randomCar.id : null;
            if (!id) {
                setLastDeleteResult({
                    success: false,
                    message: "No cars available to test deletion",
                    timestamp: new Date().toISOString()
                });
                return;
            }
        }
        
        console.log(`DebugPanel: Testing delete operation for car ID ${id} with forceMode=${forceMode}`);
        
        // Track the current online/server state
        const currentOnlineState = isOnline;
        const currentServerState = serverAvailable;
        
        try {
            // If forceMode is specified, override the current state temporarily
            if (forceMode === 'online') {
                console.log("DebugPanel: Forcing ONLINE mode for this test");
                // We're not changing the actual state variables to avoid re-renders
                // Instead, we'll override inside the local test function
                
                // Check with direct server call to verify it's truly available
                const serverCheck = await axios.get(`${config.API_URL}/api/cars?page=1&itemsPerPage=1`);
                console.log("DebugPanel: Direct server check result:", serverCheck.status);
            } else if (forceMode === 'offline') {
                console.log("DebugPanel: Forcing OFFLINE mode for this test");
            }
            
            // Use the context's deleteCar function directly
            console.log(`DebugPanel: Calling deleteCar with ID=${id}`);
            const result = await deleteCar(id);
            
            console.log("DebugPanel: Delete operation result:", result);
            
            // Check if the car was actually deleted from the server
            let serverVerification = "Not checked";
            if (currentOnlineState && currentServerState) {
                try {
                    // Try to fetch the car to see if it's really deleted
                    await axios.get(`${config.API_URL}/api/cars/${id}`);
                    // If we get here, the car still exists on the server
                    serverVerification = "Failed - Car still exists on server";
                } catch (error) {
                    if (error.response && error.response.status === 404) {
                        // 404 means the car is gone, which is what we want
                        serverVerification = "Success - Car confirmed deleted on server";
                    } else {
                        serverVerification = `Error checking - ${error.message}`;
                    }
                }
            }
            
            // Check if car is in the offline queue
            const offlineQueue = getOfflineQueue();
            const inQueue = offlineQueue.some(op => 
                op.type === 'DELETE' && op.id.toString() === id.toString()
            );
            
            // Check if car ID is in the deletedCarsRegistry
            const deletedCarsRegistry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
            const inRegistry = deletedCarsRegistry.includes(id.toString());
            
            setLastDeleteResult({
                success: true,
                id,
                result,
                timestamp: new Date().toISOString(),
                networkState: {
                    online: currentOnlineState,
                    serverAvailable: currentServerState,
                    forceMode
                },
                serverVerification,
                offlineStatus: {
                    inQueue,
                    inRegistry
                }
            });
            
            // Refresh UI to reflect changes
            refreshCars();
            
        } catch (error) {
            console.error("DebugPanel: Error in test delete operation:", error);
            setLastDeleteResult({
                success: false,
                id,
                error: error.message,
                timestamp: new Date().toISOString(),
                networkState: {
                    online: currentOnlineState,
                    serverAvailable: currentServerState,
                    forceMode
                }
            });
        }
    };
    
    if (!process.env.NODE_ENV === 'development') {
        return null;
    }
    
    return (
        <>
            {/* Floating button to open debug panel */}
            <button 
                onClick={() => setExpanded(!expanded)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1001,
                    padding: '8px 12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                {expanded ? 'Hide' : 'Show'} Debug Panel
            </button>
            
            {/* Full debug panel */}
            <div style={{
                position: 'fixed',
                bottom: expanded ? '20px' : '-500px', 
                right: '80px',
                width: '550px',
                backgroundColor: 'rgba(240, 240, 240, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                transition: 'bottom 0.3s ease-in-out',
                zIndex: 1000,
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                }}>
                    <h3 style={{ margin: 0 }}>Debug Panel</h3>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <h4>Network Status</h4>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        <div>
                            <strong>Browser Status:</strong>{' '}
                            <span style={{ color: isOnline ? 'green' : 'red' }}>
                                {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                            </span>
                        </div>
                        <div>
                            <strong>Server Status:</strong>{' '}
                            <span style={{ color: serverAvailable ? 'green' : 'red' }}>
                                {serverAvailable ? '🟢 AVAILABLE' : '🔴 UNAVAILABLE'}
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Last check: {lastServerCheck ? new Date(lastServerCheck).toLocaleTimeString() : 'Never'}
                    </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <h4>Test Delete Operations</h4>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => testDeleteOperation(null, null)}
                            style={{ padding: '5px 10px' }}
                        >
                            Test Delete (Normal)
                        </button>
                        <button 
                            onClick={() => testDeleteOperation(null, 'online')}
                            style={{ padding: '5px 10px' }}
                        >
                            Test Delete (Force Online)
                        </button>
                        <button 
                            onClick={() => testDeleteOperation(null, 'offline')}
                            style={{ padding: '5px 10px' }}
                        >
                            Test Delete (Force Offline)
                        </button>
                    </div>
                    
                    <div style={{ marginTop: '10px' }}>
                        <label>
                            <span style={{ marginRight: '5px' }}>Test with specific ID:</span>
                            <input 
                                type="text" 
                                placeholder="Car ID" 
                                style={{ width: '80px', marginRight: '10px' }}
                                id="debugDeleteId"
                            />
                        </label>
                        <button 
                            onClick={() => {
                                const id = document.getElementById('debugDeleteId').value;
                                if (id) testDeleteOperation(id);
                            }}
                            style={{ padding: '5px 10px' }}
                        >
                            Delete by ID
                        </button>
                    </div>
                    
                    {lastDeleteResult && (
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '8px', 
                            border: '1px solid #ddd', 
                            borderRadius: '5px',
                            backgroundColor: lastDeleteResult.success ? '#e6f7e6' : '#ffebeb' 
                        }}>
                            <h5 style={{ margin: '0 0 5px 0' }}>Last Delete Operation Result:</h5>
                            <div style={{ fontSize: '13px' }}>
                                <div><strong>Time:</strong> {new Date(lastDeleteResult.timestamp).toLocaleTimeString()}</div>
                                <div><strong>Status:</strong> {lastDeleteResult.success ? 'Success' : 'Failed'}</div>
                                {lastDeleteResult.id && <div><strong>Car ID:</strong> {lastDeleteResult.id}</div>}
                                {lastDeleteResult.networkState && (
                                    <div>
                                        <strong>Network:</strong> {lastDeleteResult.networkState.online ? 'Online' : 'Offline'}, 
                                        Server: {lastDeleteResult.networkState.serverAvailable ? 'Available' : 'Unavailable'}
                                        {lastDeleteResult.networkState.forceMode && 
                                            ` (Forced: ${lastDeleteResult.networkState.forceMode})`}
                                    </div>
                                )}
                                {lastDeleteResult.serverVerification && (
                                    <div><strong>Verification:</strong> {lastDeleteResult.serverVerification}</div>
                                )}
                                {lastDeleteResult.offlineStatus && (
                                    <div>
                                        <strong>Offline Status:</strong> 
                                        {lastDeleteResult.offlineStatus.inQueue ? ' In queue,' : ' Not in queue,'}
                                        {lastDeleteResult.offlineStatus.inRegistry ? ' In registry' : ' Not in registry'}
                                    </div>
                                )}
                                {lastDeleteResult.error && <div><strong>Error:</strong> {lastDeleteResult.error}</div>}
                            </div>
                        </div>
                    )}
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <h4>Network Controls</h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <button onClick={() => {
                            setIsOnline(true);
                            setServerAvailable(true);
                            setLastServerCheck(new Date().toISOString());
                        }}>
                            Force Online Mode
                        </button>
                        <button onClick={() => {
                            setServerAvailable(false);
                            setLastServerCheck(new Date().toISOString());
                        }}>
                            Force Offline Server
                        </button>
                        <button onClick={checkServerAvailability}>
                            Check Server Now
                        </button>
                    </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <h4>Offline Operations</h4>
                    <div>
                        <button onClick={syncOfflineChanges} style={{ marginRight: '10px' }}>
                            Sync Now
                        </button>
                    </div>
                    
                    <div style={{ marginTop: '10px' }}>
                        <h5 style={{ margin: '0 0 5px 0' }}>Queue Status:</h5>
                        {(() => {
                            const queue = getOfflineQueue();
                            if (queue.length === 0) return <div>Queue is empty</div>;
                            
                            return (
                                <>
                                    <div>{queue.length} operations pending</div>
                                    <details>
                                        <summary>View queue details</summary>
                                        <pre style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                                            {JSON.stringify(queue, null, 2)}
                                        </pre>
                                    </details>
                                </>
                            );
                        })()}
                    </div>
                    
                    <div style={{ marginTop: '10px' }}>
                        <h5 style={{ margin: '0 0 5px 0' }}>Deleted Cars Registry:</h5>
                        {(() => {
                            const registry = JSON.parse(localStorage.getItem('deletedCarsRegistry') || '[]');
                            if (registry.length === 0) return <div>Registry is empty</div>;
                            
                            return (
                                <>
                                    <div>{registry.length} cars marked as deleted</div>
                                    <details>
                                        <summary>View registry details</summary>
                                        <pre style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>
                                            {JSON.stringify(registry, null, 2)}
                                        </pre>
                                    </details>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DebugPanel;
