import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import axios from 'axios';
import config from './config';
import './Orders.css';

const Orders = () => {
  const { isAuthenticated, getAuthToken, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const response = await axios.get(`${config.API_URL}/api/orders?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  // Handle success message from checkout
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      const newState = { ...location.state };
      delete newState.message;
      navigate(location.pathname, { state: newState, replace: true });
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
  }, [location.state, navigate]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    fetchOrders(newPage);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders-container">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>📋 My Orders</h1>
        <p>Track your car purchases</p>
      </div>

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="close-message-btn"
            title="Close"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => fetchOrders()} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {orders.length === 0 && !loading ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">📋</div>
          <h2>No orders yet</h2>
          <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
          <Link to="/" className="browse-cars-btn">
            Browse Cars
          </Link>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items.map((item) => {
                    const car = item.car;
                    const brand = car?.brand;
                    return (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <h4>{brand?.name} {car?.model}</h4>
                          <p>{car?.year} • {car?.fuelType}</p>
                        </div>
                        <div className="item-price">
                          ${parseFloat(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <strong>Total: ${parseFloat(order.total || 0).toLocaleString()}</strong>
                  </div>
                  <div className="order-actions">
                    <Link 
                      to={`/orders/${order.id}`} 
                      className="view-details-btn"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Orders;
