// CacheManager.js
// Efficient caching strategy that handles large datasets by using pagination and in-memory storage

// Global cache for pagination chunks (in memory)
const inMemoryCarCache = {
    chunks: {}, // Format: { pageKey: { data: [], timestamp: Date } }
    currentPage: 1,
    totalPages: 1,
    totalCars: 0,
    timestamp: null
};

// Session storage backup when localStorage fails
const sessionCarsCache = {
    cars: [],
    timestamp: null
};

const CacheManager = {
    // Ultra compresses a car object - only absolute minimum fields
    minimalCompressCar: (car) => {
        if (!car) return null;
        
        // Store only the bare minimum fields needed to render the card
        return {
            id: car.id,
            make: car.make,
            model: car.model,
            price: car.price,
            _isTemp: car._isTemp || false
        };
    },
    
    // Compresses a car object by removing unnecessary fields for storage
    compressCar: (car) => {
        if (!car) return null;
        
        // Only store essential fields to save space
        const compressedCar = {
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            fuelType: car.fuelType,
            brandId: car.brandId, 
            _isTemp: car._isTemp || false
        };
        
        // Don't store keywords as they're not essential
        if (car.keywords && car.keywords.length < 20) {
            compressedCar.keywords = car.keywords;
        }
        
        // Only store image reference (not full data URLs) to save space
        if (car.img) {
            // If it's a path or URL that's not a base64 string, store it
            if (typeof car.img === 'string' && !car.img.startsWith('data:')) {
                compressedCar.img = car.img;
            }
        }
        
        return compressedCar;
    },
    
    // Check if local storage is available and has space
    isLocalStorageAvailable: () => {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Get a paginated cache key based on page number and filters
    getPaginatedCacheKey: (page = 1, filters = {}) => {
        // Create a simplified hash of the filters for the cache key
        const filterHash = JSON.stringify(filters).replace(/[{}":\s]/g, '');
        return `cachedCars_p${page}_${filterHash}`;
    },
    
    // Store cars in page chunks to avoid quota issues
    storePagedCars: (cars, page = 1, totalPages = 1, totalCars = 0, filters = {}) => {
        if (!cars || !cars.length) return false;
        
        try {
            // Update the in-memory cache first (no quota issues)
            const key = CacheManager.getPaginatedCacheKey(page, filters);
            inMemoryCarCache.chunks[key] = {
                data: cars,
                timestamp: new Date().toISOString()
            };
            
            inMemoryCarCache.currentPage = page;
            inMemoryCarCache.totalPages = totalPages;
            inMemoryCarCache.totalCars = totalCars;
            inMemoryCarCache.timestamp = new Date().toISOString();
            
            // Also store current page meta info in localStorage (small payload)
            try {
                const metaInfo = {
                    lastPage: page,
                    totalPages: totalPages,
                    totalCars: totalCars,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('carCache_meta', JSON.stringify(metaInfo));
                
                // Only try to store up to 50 cars per page in localStorage to avoid quota issues
                const compressedCars = cars.slice(0, 50).map(CacheManager.compressCar);
                localStorage.setItem(key, JSON.stringify({
                    cars: compressedCars,
                    timestamp: new Date().toISOString()
                }));
                
                console.log(`Stored page ${page} with ${compressedCars.length} cars in localStorage`);
                return true;
            } catch (error) {
                console.warn("Failed to store paged cars in localStorage:", error.message);
                // We still have the in-memory cache, so this is not a critical failure
                return true;
            }
        } catch (error) {
            console.error("Failed to store paged cars:", error);
            return false;
        }
    },
    
    // Cache cars in manageable chunks to prevent storage quota exceeded errors
    cacheCarsInChunks: (cars, pageNumber, append = false, filters = {}, totalPages = 1, totalCars = 0) => {
        if (!cars || !cars.length) return false;
        
        console.log(`Caching ${cars.length} cars for page ${pageNumber} (append: ${append})`);
        
        try {
            // Always update the in-memory cache first (no quota issues)
            const key = CacheManager.getPaginatedCacheKey(pageNumber, filters);
            inMemoryCarCache.chunks[key] = {
                data: cars,
                timestamp: new Date().toISOString()
            };
            
            // Update metadata
            inMemoryCarCache.totalPages = Math.max(inMemoryCarCache.totalPages, totalPages);
            inMemoryCarCache.totalCars = Math.max(inMemoryCarCache.totalCars, totalCars);
            inMemoryCarCache.timestamp = new Date().toISOString();
            
            // Now try to store in localStorage with size limits
            try {
                // Store metadata in localStorage (very small payload)
                const metaInfo = {
                    lastPage: pageNumber,
                    totalPages: totalPages,
                    totalCars: totalCars,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('carCache_meta', JSON.stringify(metaInfo));
                
                // Only store a limited number of compressed cars per page to avoid quota issues
                const MAX_CARS_PER_PAGE = 25; // Reduced from 50 to be safer
                const compressedCars = cars.slice(0, MAX_CARS_PER_PAGE).map(CacheManager.compressCar);
                
                localStorage.setItem(key, JSON.stringify({
                    cars: compressedCars,
                    timestamp: new Date().toISOString()
                }));
                
                console.log(`Stored ${compressedCars.length} cars for page ${pageNumber} in localStorage`);
                return true;
            } catch (error) {
                console.warn("Failed to store cars in localStorage:", error.message);
                // We still have the in-memory cache, so this is not a critical failure
                return true;
            }
        } catch (error) {
            console.error("Failed to cache cars in chunks:", error);
            return false;
        }
    },
    
    // Get all currently cached cars from memory (limited to prevent browser crashes)
    getAllCachedCars: (limit = 500) => {
        // Collect all cars from memory cache
        const allCars = [];
        Object.values(inMemoryCarCache.chunks).forEach(chunk => {
            if (chunk.data && Array.isArray(chunk.data)) {
                allCars.push(...chunk.data);
            }
        });
        
        // Deduplicate by ID
        const uniqueCars = allCars.reduce((acc, car) => {
            if (!acc.some(existingCar => existingCar.id === car.id)) {
                acc.push(car);
            }
            return acc;
        }, []);
        
        // Return with limit to prevent browser crashes
        return uniqueCars.slice(0, limit);
    },
    
    // Get cars for a specific page from cache
    getPagedCars: (page = 1, filters = {}) => {
        const key = CacheManager.getPaginatedCacheKey(page, filters);
        
        // First try in-memory cache (fastest, no quota issues)
        if (inMemoryCarCache.chunks[key]?.data?.length) {
            console.log(`Using in-memory cache for page ${page}`);
            return {
                cars: inMemoryCarCache.chunks[key].data,
                totalPages: inMemoryCarCache.totalPages,
                totalCars: inMemoryCarCache.totalCars,
                fromCache: 'memory',
                timestamp: inMemoryCarCache.chunks[key].timestamp
            };
        }
        
        // Then try localStorage
        try {
            const cachedData = localStorage.getItem(key);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const metaInfo = JSON.parse(localStorage.getItem('carCache_meta') || '{}');
                
                console.log(`Using localStorage cache for page ${page}`);
                return {
                    cars: parsed.cars || [],
                    totalPages: metaInfo.totalPages || 1,
                    totalCars: metaInfo.totalCars || parsed.cars?.length || 0,
                    fromCache: 'local',
                    timestamp: parsed.timestamp
                };
            }
        } catch (error) {
            console.warn(`Failed to retrieve page ${page} from localStorage:`, error.message);
        }
        
        // No cached data found for this page
        return null;
    },
    
    // Safely store data in localStorage with error handling and multiple fallbacks
    // This function is quota-aware and can handle large datasets
    safelyStoreData: (key, data) => {
        // Special handling for car data to use pagination strategy
        if (key === 'cachedCars' && data.cars && data.cars.length > 100) {
            console.log(`Breaking up ${data.cars.length} cars into cached chunks`);
            
            // Store metadata only in localStorage
            const metaInfo = {
                totalCars: data.cars.length,
                timestamp: data.timestamp || new Date().toISOString()
            };
            
            try {
                localStorage.setItem('carCache_meta', JSON.stringify(metaInfo));
                
                // Store the first 50 cars under the main cache key to support older code
                const firstChunk = data.cars.slice(0, 50).map(CacheManager.compressCar);
                localStorage.setItem('cachedCars_p1', JSON.stringify({
                    cars: firstChunk,
                    timestamp: data.timestamp || new Date().toISOString()
                }));
                console.log(`Stored first 50 cars in localStorage`);
                
                // Rest of the cache handled by in-memory strategy for fast access
                inMemoryCarCache.chunks['cachedCars_p1'] = {
                    data: data.cars.slice(0, Math.min(1000, data.cars.length)),
                    timestamp: data.timestamp || new Date().toISOString()
                };
                inMemoryCarCache.totalCars = data.cars.length;
                inMemoryCarCache.timestamp = data.timestamp || new Date().toISOString();
                
                return true;
            } catch (error) {
                console.warn("Failed main cache storage, falling back to session memory");
                sessionCarsCache.cars = data.cars.slice(0, 1000); // Only keep a reasonable amount in memory
                sessionCarsCache.timestamp = data.timestamp || new Date().toISOString();
                return false;
            }
        }

        // For smaller datasets, use the standard approach
        
        // First try: session memory cache for cars (doesn't use localStorage)
        if (key === 'cachedCars') {
            sessionCarsCache.cars = [...data.cars];
            sessionCarsCache.timestamp = data.timestamp;
        }
        
        try {
            // Second try: Normal storage
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn(`Storage warning for ${key}:`, error.message);
            
            // If it's a quota error, try to store a reduced version
            if (error.name === 'QuotaExceededError' || error.code === 22 || 
                error.code === 1014 || error.message.includes('quota')) {
                
                if (key === 'cachedCars' && data.cars) {
                    try {
                        // Third try: Store compressed version (no images, limited fields)
                        const compressedData = {
                            cars: data.cars.slice(0, 50).map(CacheManager.compressCar),
                            timestamp: data.timestamp,
                            compressed: true
                        };
                        
                        localStorage.setItem(key, JSON.stringify(compressedData));
                        console.log('Stored compressed car data (50 items)');
                        return true;
                    } catch (compressError) {
                        // Fourth try: Ultra minimal data, severely limited count
                        try {
                            console.warn('Trying minimal compression with very limited data');
                            const minimalData = {
                                cars: data.cars.slice(0, 20).map(CacheManager.minimalCompressCar),
                                timestamp: data.timestamp,
                                ultraCompressed: true
                            };
                            
                            localStorage.setItem(key, JSON.stringify(minimalData));
                            console.log('Stored minimal car data (20 items only)');
                            return true;
                        } catch (finalError) {
                            console.error('All localStorage attempts failed - using session memory only');
                            
                            // Fifth try: Clear other storage to make room
                            try {
                                localStorage.removeItem('cachedCars');
                                console.log('Cleared existing cached cars to make room');
                                
                                // Try one more time with minimal data
                                const lastAttemptData = {
                                    cars: data.cars.slice(0, 10).map(CacheManager.minimalCompressCar),
                                    timestamp: data.timestamp,
                                    emergency: true
                                };
                                
                                localStorage.setItem(key, JSON.stringify(lastAttemptData));
                                console.log('Emergency storage of 10 items succeeded');
                                return true;
                            } catch (e) {
                                // We'll rely on sessionCarsCache instead
                                return false;
                            }
                        }
                    }
                } else {
                    // For non-car data, try to store a stringified version
                    try {
                        const stringData = JSON.stringify(data);
                        if (stringData.length > 10000) {
                            // If it's too large, store truncated version
                            localStorage.setItem(key, stringData.substring(0, 10000) + '..."');
                            return true;
                        }
                    } catch (e) {
                        console.error('Failed to store even truncated data');
                        return false;
                    }
                }
            }
            
            // We still have the session memory cache as fallback
            return false;
        }
    },
    
    // Safely retrieve data from localStorage with fallback to session memory
    safelyGetData: (key, defaultValue = null) => {
        // Special handling for paginated car data
        if (key === 'cachedCars') {
            // Check if we have a page in the URL or other context
            const currentPage = 1; // Default to page 1
            
            // Try to get from paged cache first
            const pagedData = CacheManager.getPagedCars(currentPage);
            if (pagedData) {
                return pagedData;
            }
        }
        
        try {
            // Try to get from localStorage first
            const item = localStorage.getItem(key);
            
            // For cachedCars, use the session memory cache if localStorage fails or isn't available
            if (key === 'cachedCars' && (!item || item === 'null') && sessionCarsCache.cars.length > 0) {
                console.log('Using session memory cache instead of localStorage');
                return {
                    cars: sessionCarsCache.cars,
                    timestamp: sessionCarsCache.timestamp,
                    fromSessionCache: true
                };
            }
            
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error retrieving data from localStorage (${key}):`, error);
            
            // Fallback to session cache for cars
            if (key === 'cachedCars' && sessionCarsCache.cars.length > 0) {
                return {
                    cars: sessionCarsCache.cars,
                    timestamp: sessionCarsCache.timestamp,
                    fromSessionCache: true
                };
            }
            
            return defaultValue;
        }
    },
    
    // Clear all storage for testing
    clearAllStorage: () => {
        try {
            localStorage.clear();
            sessionCarsCache.cars = [];
            sessionCarsCache.timestamp = null;
            
            // Also clear in-memory cache
            Object.keys(inMemoryCarCache.chunks).forEach(key => {
                delete inMemoryCarCache.chunks[key];
            });
            inMemoryCarCache.totalCars = 0;
            inMemoryCarCache.timestamp = null;
            
            return true;
        } catch (e) {
            return false;
        }
    }
};

export default CacheManager;
