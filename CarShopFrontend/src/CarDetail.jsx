import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CarDetail.css';
import config from './config.js';
import CarOperationsContext from './CarOperationsContext.jsx';

const CarDetail = () => {
    const { id } = useParams(); // Get car ID from URL
    const navigate = useNavigate(); // Get navigate function
    const [car, setCar] = useState(null); // State to store car details
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [isOnline, setIsOnline] = useState(navigator.onLine); // Online status
    const [serverAvailable, setServerAvailable] = useState(true); // Server availability
    const [videoUploadProgress, setVideoUploadProgress] = useState(0); // For tracking upload progress
    const [isUploading, setIsUploading] = useState(false); // To show upload status
    const fileInputRef = useRef(null); // Reference to file input

    // Get operations from context
    const operations = useContext(CarOperationsContext);
    const { deleteCar } = operations;

    // Log what we received from context to debug
    useEffect(() => {
        console.log('CarDetail: Context received:', {
            deleteCar: typeof operations.deleteCar === 'function',
            operations
        });
    }, [operations]);

    useEffect(() => {
        // Add online/offline event listeners
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Fetch car details from the server or cache
        const fetchCarDetails = async () => {
            setLoading(true);
            
            // Try to get from cache first
            const cachedData = localStorage.getItem('cachedCars');
            let cachedCar = null;
            
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                cachedCar = parsed.cars.find(c => c.id.toString() === id.toString());
            }
            
            // If online, try to get from server
            if (isOnline) {
                try {
                    const response = await axios.get(`${config.API_URL}/api/cars/${id}`);
                    setCar(response.data);
                    setLoading(false);
                    setServerAvailable(true);
                } catch (error) {
                    console.error("Error fetching car details:", error);
                    setServerAvailable(false);
                    
                    // If server is down but we have cached data, use it
                    if (cachedCar) {
                        setCar(cachedCar);
                        setLoading(false);
                    } else {
                        setError("Car not found");
                        setLoading(false);
                    }
                }
            } else {
                // If offline and we have cached data, use it
                if (cachedCar) {
                    setCar(cachedCar);
                    setLoading(false);
                } else {
                    setError("You are offline and this car is not cached");
                    setLoading(false);
                }
            }
        };

        fetchCarDetails();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [id, isOnline]);

    const handleDelete = () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this car?");
        if (confirmDelete) {
            console.log(`Starting deletion process for car ID: ${id}`);
            
            if (typeof deleteCar !== 'function') {
                console.error("Delete car is not a function:", deleteCar);
                alert("Error: Delete function not available");
                return;
            }
            
            console.log("About to call deleteCar function");
            
            try {
                deleteCar(id)
                    .then((response) => {
                        console.log("Delete operation completed");
                        
                        // Check if this was an offline deletion
                        if (!isOnline || !serverAvailable || 
                            response?.data?.message?.includes('offline') || 
                            response?.data?.message?.includes('marked for deletion')) {
                            alert("Car has been removed from local view and will be deleted from the server when you're back online.");
                        } else {
                            alert("Car deleted successfully!");
                        }
                        
                        navigate('/');
                    })
                    .catch((error) => {
                        console.error("Error in delete operation:", error);
                        alert("Failed to delete car.");
                    });
            } catch (error) {
                console.error("Exception during delete operation:", error);
                alert("An unexpected error occurred while trying to delete the car.");
            }
        }
    };

    // Handle video upload
    const handleVideoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if file is a video
        if (!file.type.startsWith('video/')) {
            alert('Please select a valid video file');
            return;
        }
        
        // Check file size - limit to 1GB
        const MAX_FILE_SIZE = 2048 * 1024 * 1024; // 1GB in bytes
        if (file.size > MAX_FILE_SIZE) {
            alert(`File is too large. Maximum size is 1GB. Your file is ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }
        
        // Log file information for debugging
        console.log('Video file selected:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        });
        
        setIsUploading(true);
        setVideoUploadProgress(0);
        
        const formData = new FormData();
        formData.append('video', file);
        
        try {
            console.log(`Uploading video to ${config.API_URL}/api/cars/${id}/video`);
            const response = await axios.post(`${config.API_URL}/api/cars/${id}/video`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setVideoUploadProgress(percentCompleted);
                    console.log(`Upload progress: ${percentCompleted}%`);
                }
            });
            
            console.log('Video upload successful, response:', response.data);
            
            // Refresh car data to get updated video information
            const carResponse = await axios.get(`${config.API_URL}/api/cars/${id}`);
            setCar(carResponse.data);
            alert('Video uploaded successfully!');
        } catch (error) {
            console.error('Error uploading video:', error);
            
            // Provide more detailed error information
            if (error.response) {
                // The server responded with a status code outside the 2xx range
                console.error('Server response:', error.response.data);
                console.error('Status code:', error.response.status);
                
                // Check specifically for file size error in the response
                const responseText = typeof error.response.data === 'string' 
                    ? error.response.data 
                    : JSON.stringify(error.response.data);
                
                if (responseText.includes('File too large') || responseText.includes('MulterError')) {
                    alert('Upload failed: The file is too large. Maximum size allowed by the server is likely smaller than 10MB.');
                } else {
                    alert(`Upload failed: ${error.response.status} - ${error.response.data.message || 'Server error'}`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received from server');
                alert('Upload failed: No response from server. Check your connection.');
            } else {
                // Something happened in setting up the request
                alert(`Upload failed: ${error.message}`);
            }
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    // Handle video deletion
    const handleDeleteVideo = async () => {
        if (!car.video) return;
        
        const confirmed = window.confirm('Are you sure you want to delete this video?');
        if (!confirmed) return;
        
        try {
            await axios.delete(`${config.API_URL}/api/cars/${id}/video`);
            // Update car data
            const response = await axios.get(`${config.API_URL}/api/cars/${id}`);
            setCar(response.data);
            alert('Video deleted successfully');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('Failed to delete video. Please try again.');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="car-container">
            {(!isOnline || !serverAvailable) && (
                <div className="offline-mode-indicator">
                    {!isOnline ? 'You are offline - Changes will be synced when you reconnect' : 
                               'Server is unavailable - Changes will be synced when the server is back'}
                </div>
            )}

            <div className="car-main">
                <imgx
                    src={car.img ? 
                        (car.img.startsWith('data:') 
                            ? car.img // Use Base64 data directly
                            : car.img.startsWith('http') 
                                ? car.img 
                                : `${config.UPLOADS_PATH}${car.img}`) 
                        : 'https://via.placeholder.com/800x600?text=No+Image'}
                    alt={`${car.make} ${car.model}`}
                    className="car-image"
                    onError={(e) => {
                        console.log("Image failed to load:", e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
                    }}
                />
                <div className="car-details">
                    <h1 className="car-title">{car.make} {car.model}</h1>
                    <p className="car-subtitle">{car.keywords}</p>
                    <h2 className="price">${car.price}</h2>
                    <div className="button-group">
                        <button className="add-to-cart">Add to cart</button>
                        <button className="delete" onClick={handleDelete}>Delete</button>
                        <button className="update" onClick={() => navigate(`/UpdateCar/${car.id}`)}>Update</button>
                    </div>
                </div>
            </div>

            <div className="description">
                <h3>Description</h3>
                <p>{car.description}</p>
            </div>
            
            {/* Video Section */}
            <div className="video-section">
                <h3>Car Video</h3>
                {car.video ? (
                    <div className="video-container">
                        <video 
                            className="car-video" 
                            controls 
                            src={`${config.API_URL}/uploads/videos/${car.video}`}
                            poster={car.img ? 
                                (car.img.startsWith('data:') 
                                    ? car.img // Use Base64 data directly
                                    : car.img.startsWith('http') 
                                        ? car.img 
                                        : `${config.UPLOADS_PATH}${car.img}`) 
                                : 'https://via.placeholder.com/800x600?text=Car+Video'}
                        >
                            Your browser does not support the video tag.
                        </video>
                        <div className="video-controls">
                            <a 
                                href={`${config.API_URL}/uploads/videos/${car.video}`} 
                                download 
                                className="download-video-btn"
                            >
                                Download Video
                            </a>
                            <button 
                                className="delete-video-btn" 
                                onClick={handleDeleteVideo}
                            >
                                Delete Video
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="video-upload">
                        <p>No video available for this car. Upload one below:</p>
                        <input 
                            type="file" 
                            accept="video/*" 
                            onChange={handleVideoUpload} 
                            disabled={isUploading || !isOnline || !serverAvailable}
                            ref={fileInputRef}
                            className="video-upload-input"
                        />
                        {isUploading && (
                            <div className="upload-progress">
                                <div className="progress-bar" style={{ width: `${videoUploadProgress}%` }}></div>
                                <span>{videoUploadProgress}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {car._isTemp && (
                <div className="temp-indicator">
                    This car was added while offline and will be synchronized with the server when you reconnect.
                </div>
            )}
        </div>
    );
};

export default CarDetail;