# CarShop Application - CORS DELETE Issue Fix

## Original Issues
1. DELETE requests were failing with "401 Unauthorized" errors
2. CORS errors with message: "Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response"
3. Error: "DELETE http://127.0.0.1:5000/api/cars/5 net::ERR_FAILED"

## Root Causes Identified
1. CORS configuration in the backend didn't include all headers being sent by the frontend
2. Authentication token handling was inconsistent (stored as 'authToken' but accessed as 'token')
3. Case sensitivity issues with headers ('Cache-Control' vs 'cache-control')
4. Unnecessary cache-control headers triggered stricter CORS requirements

## Solutions Implemented

### 1. Backend CORS Configuration Update
Updated the server.js file to include all necessary headers in CORS configuration:

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // Frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'cache-control',
    'Cache-Control', 
    'pragma',
    'Pragma',
    'if-modified-since',
    'If-Modified-Since',
    'X-Requested-With'
  ],
  credentials: true,
  exposedHeaders: ['Content-Length', 'Date', 'X-Request-Id'] 
}));
```

### 2. Frontend Authentication Standardization
Created centralized token handling utilities to ensure consistent usage:

```javascript
// utils/authToken.js
export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}
```

### 3. DELETE Request Simplification
Simplified headers sent with DELETE requests to avoid CORS issues:

```javascript
const performDirectDelete = useCallback((idStr) => {
    console.log(`App: Performing direct server deletion for car ID: ${idStr}`);
    const token = getAuthToken();
    
    // Make sure auth token is set in axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return axios.delete(`${config.API_URL}/api/cars/${idStr}`, {
        timeout: 5000,
        headers: {
            // Simplified headers to avoid CORS issues
            'Cache-Control': 'no-cache'
        }
    })
});
```

### 4. Enhanced Authorization Middleware
Improved the error reporting in the auth middleware for better debugging:

```javascript
exports.authenticate = (req, res, next) => {
  try {
    console.log('Auth middleware: checking authorization header');
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Auth middleware: No authorization header found');
      return res.status(401).json({ message: 'Authentication required - No auth header' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Auth middleware: No token in authorization header');
      return res.status(401).json({ message: 'Authentication required - Invalid header format' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log(`Auth middleware: Authenticated user ${decoded.id} (${decoded.email})`);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: `Invalid or expired token: ${error.message}` });
  }
};
```

### 5. CORS Debug Middleware
Created a debugging middleware to help troubleshoot CORS issues:

```javascript
const corsDebug = (req, res, next) => {
  console.log('------------------------------');
  console.log('CORS Debug: Incoming Request');
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  
  // Override header method to log all headers being set
  const originalHeader = res.header;
  res.header = function(name, value) {
    console.log(`Response Header Set: ${name} = ${value}`);
    return originalHeader.apply(this, arguments);
  };
  
  next();
};
```

### 6. Authentication Debug Component
Created an AuthDebug component to provide real-time token information for developers:

```jsx
const AuthDebug = () => {
  const [authToken, setAuthToken] = useState(getAuthToken());
  
  // Shows token status, expiration time, and user details
  // Provides buttons to test and clear tokens
  
  // Automatically decodes JWT tokens to show payload data
  if (token) {
    try {
      const decoded = jwt_decode.jwtDecode(token);
      // Display token data in UI
    } catch (error) { /* Handle errors */ }
  }
  
  // UI for token debugging
};
```

## Testing Results
- Tested the DELETE functionality with our test script
- Successfully deleted car records from the database 
- No more CORS errors when performing DELETE operations
- Token authentication is working correctly
- The frontend and backend are now properly communicating

## Recommendations
1. Keep the centralized token handling approach for all API requests
2. Consider implementing token refresh mechanisms to extend sessions
3. Remove the CORS debug middleware in production for better performance
4. Standardize error responses from the API for more consistent error handling
5. Add more comprehensive logging to help identify future authentication issues
