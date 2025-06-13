import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import axios from 'axios';
import config from './config';
import './MyCarOrders.css';

const MyCarOrders = () => {
  const { isAuthenticated, getAuthToken, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
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
      const response = await axios.get(`${config.API_URL}/api/orders/my-car-orders?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching car orders:', error);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdating(prev => ({ ...prev, [orderId]: true }));
      
      const token = getAuthToken();
      await axios.put(`${config.API_URL}/api/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh orders after update
      await fetchOrders(pagination.currentPage);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

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

  const getNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'pending': return ['confirmed', 'cancelled'];
      case 'confirmed': return ['processing', 'cancelled'];
      case 'processing': return ['shipped', 'cancelled'];
      case 'shipped': return ['delivered'];
      case 'delivered': return [];
      case 'cancelled': return [];
      default: return [];
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
      <div className="my-car-orders-container">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading orders for your cars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-car-orders-container">
      <div className="orders-header">
        <h1>🏪 My Car Orders</h1>
        <p>Manage orders for cars you're selling</p>
      </div>

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
          <div className="empty-orders-icon">🏪</div>
          <h2>No orders for your cars yet</h2>
          <p>When customers purchase your cars, you'll see their orders here and be able to manage them.</p>
          <Link to="/mycars" className="manage-cars-btn">
            Manage My Cars
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
                    <p className="order-customer">Customer: {order.user.username}</p>
                    <p className="order-date">{formatDate(order.orderDate)}</p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="order-items">
                  <h4>Your Cars in this Order:</h4>
                  {order.items.map((item) => {
                    const car = item.car;
                    const brand = car?.brand;
                    return (
                      <div key={item.id} className="order-item">
                        <div className="item-details">
                          <h5>{brand?.name} {car?.model}</h5>
                          <p>{car?.year} • {car?.fuelType}</p>
                        </div>
                        <div className="item-price">
                          ${parseFloat(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="order-actions">
                  <div className="order-total">
                    <strong>Total: ${parseFloat(order.total || 0).toLocaleString()}</strong>
                  </div>
                  
                  {getNextStatuses(order.status).length > 0 && (
                    <div className="status-actions">
                      <span className="action-label">Update Status:</span>
                      {getNextStatuses(order.status).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(order.id, status)}
                          disabled={updating[order.id]}
                          className={`status-btn status-btn-${status}`}
                        >
                          {updating[order.id] ? '...' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {order.shippingAddress && (
                  <div className="shipping-info">
                    <h5>Shipping Address:</h5>
                    <p>{order.shippingAddress}</p>
                  </div>
                )}

                {order.notes && (
                  <div className="order-notes">
                    <h5>Customer Notes:</h5>
                    <p>{order.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyCarOrders;
