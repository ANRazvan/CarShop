# CarShop - Full-Stack Car Dealership Management System

A comprehensive, modern car dealership management system built with React and Node.js, featuring real-time monitoring, advanced authentication, and optimized performance for handling large datasets.

## 🚗 About CarShop

CarShop is a full-featured car dealership application designed to handle car inventory management, user authentication, real-time updates, and advanced monitoring capabilities. The system supports over 200,000+ car records with optimized database queries and caching mechanisms.

## ✨ Core Features

### 🏪 Car Management
- **Complete CRUD Operations**: Create, read, update, and delete car listings
- **Advanced Search & Filtering**: Multi-criteria search by brand, model, year, fuel type, price range
- **Image Management**: Upload and display car images with Base64 encoding
- **Real-time Updates**: WebSocket integration for instant updates across clients
- **Pagination & Performance**: Efficient handling of large datasets with pagination
- **Infinite Scroll**: Smooth browsing experience with dynamic loading

### 🏷️ Brand Management
- **Brand CRUD Operations**: Manage car brands with detailed information
- **Brand Analytics**: View cars per brand with statistics
- **Logo Management**: Upload and manage brand logos
- **Country-based Organization**: Filter brands by country of origin
- **Relationship Management**: Cascading operations with associated cars

### 🔐 Authentication & Security
- **JWT-based Authentication**: Secure token-based authentication system
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code setup
- **Backup Codes**: Emergency access codes for 2FA recovery
- **Session Management**: Automatic session monitoring and expiration handling
- **Role-based Access Control**: Admin and user roles with appropriate permissions
- **Session Timeout**: Configurable inactivity timeouts with warnings

### 📊 Advanced Monitoring & Analytics
- **User Activity Monitoring**: Real-time tracking of user actions and behaviors
- **Suspicious Activity Detection**: Automated detection of unusual user patterns
- **Statistical Dashboard**: Comprehensive analytics with Chart.js visualizations
- **Performance Metrics**: Database query optimization and response time tracking
- **Load Testing**: Built-in performance testing with JMeter integration

### ⚡ Performance & Optimization
- **Database Indexing**: Strategic indexing for optimized query performance
- **Query Optimization**: Complex aggregation queries with CTEs and optimizations
- **Redis Caching**: Cache layer for frequently accessed data
- **Index Performance Testing**: Real-time index performance comparison
- **Batch Operations**: Efficient bulk data operations

### 🌐 Real-time Features
- **WebSocket Integration**: Real-time updates for car operations
- **Live Notifications**: Instant notifications for system events
- **Connection Status**: Real-time connection monitoring
- **Automatic Reconnection**: Resilient WebSocket connections

## 🛠️ Technology Stack

### Frontend Technologies
- **React 19.0.0**: Modern React with hooks and functional components
- **React Router DOM 7.3.0**: Client-side routing and navigation
- **Vite 6.2.0**: Fast build tool and development server
- **Chart.js 4.4.8**: Data visualization and analytics charts
- **React-ChartJS-2**: React wrapper for Chart.js
- **Axios 1.8.4**: HTTP client for API requests
- **React Window**: Virtualization for large lists
- **WebSocket Client**: Real-time communication
- **JWT Decode**: Token handling and validation

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js 4.21.2**: Web application framework
- **Sequelize 6.37.7**: Object-Relational Mapping (ORM)
- **PostgreSQL**: Primary database with advanced features
- **Redis 5.0.1**: Caching and session storage
- **WebSocket (ws 8.18.1)**: Real-time communication
- **JWT (jsonwebtoken 9.0.2)**: Authentication tokens
- **bcryptjs 3.0.2**: Password hashing
- **Multer 1.4.5**: File upload handling

### Security & Authentication
- **Speakeasy 2.0.0**: TOTP-based 2FA implementation
- **QRCode 1.5.4**: QR code generation for 2FA setup
- **Express Session 1.18.1**: Session management
- **CORS**: Cross-origin resource sharing configuration
- **JWT Secret Management**: Secure token signing and validation

### Development & Testing
- **Jest 29.7.0**: Testing framework
- **Supertest 7.1.0**: HTTP assertion testing
- **ESLint**: Code linting and style enforcement
- **Nodemon**: Development server with auto-restart
- **Faker.js 9.8.0**: Test data generation
- **JMeter Integration**: Load testing capabilities

### DevOps & Deployment
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Azure Container Apps**: Cloud deployment
- **Azure PostgreSQL**: Managed database service
- **Azure Container Registry**: Container image storage
- **Nginx**: Reverse proxy and static file serving

## 🏗️ Architecture

### Database Design
- **Cars Table**: Complete car information with brand relationships
- **Brands Table**: Brand management with metadata
- **Users Table**: User accounts with role-based access
- **UserLogs Table**: Activity tracking and audit trail
- **MonitoredUsers Table**: Suspicious activity monitoring
- **Optimized Indexing**: Strategic indices for performance

### API Architecture
- **RESTful Design**: Standard REST endpoints
- **Modular Controllers**: Separated business logic
- **Middleware Stack**: Authentication, logging, and error handling
- **Route Organization**: Grouped by functionality
- **Error Handling**: Comprehensive error management

### Frontend Architecture
- **Component-based Design**: Reusable React components
- **Context API**: State management for global data
- **Custom Hooks**: Reusable logic abstraction
- **Service Layer**: API interaction abstraction
- **Responsive Design**: Mobile-friendly interface

## 📈 Performance Features

### Database Optimization
- **Query Optimization**: Efficient SQL queries with proper indexing
- **Connection Pooling**: Optimized database connections
- **Batch Operations**: Bulk insert/update operations
- **Query Caching**: Redis-based query result caching
- **Index Performance Monitoring**: Real-time index effectiveness tracking

### Application Performance
- **Lazy Loading**: Dynamic component loading
- **Image Optimization**: Efficient image handling and caching
- **Pagination**: Efficient data loading strategies
- **WebSocket Optimization**: Optimized real-time communication
- **Bundle Optimization**: Vite-based build optimization

## 🔧 Advanced Features

### Monitoring System
- **Real-time User Monitoring**: Track user actions across the application
- **Automated Threat Detection**: Identify suspicious activity patterns
- **Activity Analytics**: Comprehensive user behavior analysis
- **Alert System**: Notifications for security events
- **Performance Monitoring**: Track application performance metrics

### Statistical Analysis
- **Advanced Analytics**: Complex data aggregation and visualization
- **Performance Benchmarking**: Database and application performance testing
- **Load Testing**: Built-in stress testing capabilities
- **Data Visualization**: Interactive charts and graphs
- **Export Capabilities**: Data export for further analysis

### Session Management
- **Intelligent Session Handling**: Smart session timeout management
- **Activity-based Timeout**: Session extension based on user activity
- **Session Validation**: Continuous token validation
- **Graceful Logout**: Smooth session termination
- **Cross-tab Synchronization**: Consistent session state across browser tabs

## 🔒 Security Features

### Authentication Security
- **Secure Password Hashing**: bcrypt-based password protection
- **JWT Token Security**: Secure token generation and validation
- **Session Hijacking Prevention**: Secure session management
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API endpoint protection

### Data Security
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Cross-site scripting prevention
- **File Upload Security**: Secure file handling
- **Access Control**: Role-based permission system

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database
- Redis server (optional, for caching)
- Docker and Docker Compose (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CarShop
   ```

2. **Backend Setup**
   ```bash
   cd CarShopBackend
   npm install
   ```

3. **Configure environment variables**
   Create `.env` file with required configurations:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/carshop
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   REDIS_URL=redis://localhost:6379
   ```

4. **Frontend Setup**
   ```bash
   cd CarShopFrontend
   npm install
   ```

5. **Start Development Servers**
   ```bash
   # Backend (from CarShopBackend directory)
   npm run dev
   
   # Frontend (from CarShopFrontend directory)  
   npm run dev
   ```

### Docker Deployment

1. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL database
   - Redis cache
   - Backend API server
   - Frontend web application

2. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000

### Azure Cloud Deployment

1. **Prerequisites**
   - Azure CLI installed
   - Azure subscription
   - Required resource providers registered

2. **Deploy to Azure**
   ```bash
   # For PowerShell
   ./azure-deploy.ps1
   
   # For Bash
   ./azure-deploy.sh
   ```

   The deployment script will:
   - Create Azure resources (Container Registry, PostgreSQL, Redis)
   - Build and push Docker images
   - Deploy to Azure Container Apps
   - Configure networking and environment variables

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify-token` - Verify JWT token
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify-setup` - Verify 2FA setup
- `POST /api/auth/2fa/disable` - Disable 2FA

### Car Management Endpoints
- `GET /api/cars` - Get cars with pagination and filters
- `GET /api/cars/:id` - Get specific car
- `POST /api/cars` - Create new car (authenticated)
- `PUT /api/cars/:id` - Update car (authenticated)
- `DELETE /api/cars/:id` - Delete car (authenticated)

### Brand Management Endpoints
- `GET /api/brands` - Get brands with pagination
- `GET /api/brands/:id` - Get specific brand
- `POST /api/brands` - Create new brand (authenticated)
- `PUT /api/brands/:id` - Update brand (authenticated)
- `DELETE /api/brands/:id` - Delete brand (authenticated)

### Monitoring Endpoints (Admin Only)
- `GET /api/monitoring/monitored` - Get monitored users
- `GET /api/monitoring/stats` - Get activity statistics
- `GET /api/monitoring/logs/:userId` - Get user activity logs
- `PATCH /api/monitoring/monitored/:id` - Update monitoring status

### Statistics Endpoints
- `GET /api/statistics/cars` - Get comprehensive car statistics
- `GET /api/statistics/trending` - Get trending cars data
- `GET /api/statistics/indices` - Get database indices status
- `POST /api/statistics/indices/toggle` - Toggle database indices

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd CarShopBackend
npm test

# Frontend tests  
cd CarShopFrontend
npm test

# Coverage reports
npm run test:coverage
```

### Load Testing
The application includes built-in performance testing:
- Access Statistics Dashboard for load testing interface
- Use JMeter script: `CarShopBackend/scripts/index-performance-test.jmx`
- Monitor performance metrics in real-time

## 🔧 Configuration

### Environment Variables

#### Backend Configuration
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=carshop
PG_USER=database_user
PG_PASSWORD=database_password

# Authentication
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Redis Cache
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development
```

#### Frontend Configuration
```javascript
// src/config.js
export default {
  API_URL: process.env.VITE_API_URL || 'http://localhost:5000',
  WS_URL: process.env.VITE_WS_URL || 'ws://localhost:5000'
};
```

## 📊 Monitoring & Analytics

### User Activity Monitoring
- Real-time tracking of all user actions
- Suspicious activity detection and alerting
- Detailed audit logs with timestamps
- Administrative dashboard for monitoring

### Performance Analytics
- Database query performance tracking
- API response time monitoring
- Real-time performance metrics
- Load testing capabilities

### Security Monitoring
- Failed authentication attempts tracking
- Session management monitoring
- Access control validation
- Security event logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Chart.js for data visualization
- Sequelize for database ORM
- React team for the amazing framework
- All open-source contributors

## 🐛 Troubleshooting

### Common Issues

**Backend not connecting to PostgreSQL:**
- Check connection string and firewall rules
- Verify PostgreSQL service is running
- Check environment variables

**Frontend not connecting to backend:**
- Verify VITE_API_URL environment variable
- Check CORS configuration
- Ensure backend server is running

**2FA Setup Issues:**
- Verify system time synchronization
- Check QR code generation
- Validate TOTP token timing

**Performance Issues:**
- Enable database indices via Statistics dashboard
- Check Redis connection for caching
- Monitor memory usage and optimize queries

For more detailed troubleshooting, check the application logs and monitor the real-time performance metrics in the Statistics dashboard.
