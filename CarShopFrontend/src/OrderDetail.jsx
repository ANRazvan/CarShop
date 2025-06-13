import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import axios from 'axios';
import config from './config';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, getAuthToken, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const response = await axios.get(`${config.API_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.response?.data?.error || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated, navigate]);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      
      const token = getAuthToken();
      await axios.put(`${config.API_URL}/api/orders/${order.id}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh order after update
      await fetchOrder();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(false);
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

  const canUpdateStatus = () => {
    // Admin can update any order, or user can update if they own any car in the order
    if (currentUser?.role === 'admin') return true;
    
    return order?.items?.some(item => 
      item.car?.owner?.id === currentUser?.id
    );
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="order-loading">
          <div className="loading-spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-container">
        <div className="error-message">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchOrder} className="retry-btn">
              Try Again
            </button>
            <Link to="/orders" className="back-to-orders-btn">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-container">
        <div className="not-found">
          <h2>Order not found</h2>
          <Link to="/orders" className="back-to-orders-btn">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <div className="header-left">
          <h1>Order #{order.id}</h1>
          <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="header-right">
          <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>      </div>

      {/* Status Update Section */}
      {canUpdateStatus() && getNextStatuses(order.status).length > 0 && (
        <div className="status-update-section">
          <h3>🔄 Update Order Status</h3>
          <div className="status-actions">
            <span className="current-status">
              Current: <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </span>
            <div className="status-buttons">
              {getNextStatuses(order.status).map((status) => (
                <button
                  key={status}
                  onClick={() => updateOrderStatus(status)}
                  disabled={updating}
                  className={`status-btn status-btn-${status}`}
                >
                  {updating ? 'Updating...' : `Mark as ${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="order-detail-content">
        <div className="order-items-section">
          <h3>📋 Order Items</h3>
          <div className="order-items">
            {order.items.map((item) => {
              const car = item.car;
              const brand = car?.brand;
              const owner = car?.owner;
              
              return (
                <div key={item.id} className="order-item">
                  <div className="order-car-image">
                    {car?.img ? (
                      <img 
                        src={car.img} 
                        alt={`${brand?.name} ${car?.model}`}
                        onError={(e) => {
                          e.target.src = '/placeholder.jpeg';
                        }}
                      />
                    ) : (
                      <div className="no-image">📷</div>
                    )}
                  </div>
                  
                  <div className="car-details">
                    <h4>{brand?.name} {car?.model}</h4>
                    <div className="car-specs">
                      <span className="spec">Year: {car?.year}</span>
                      <span className="spec">Fuel: {car?.fuelType}</span>
                      {owner && (
                        <span className="spec">Seller: {owner.username}</span>
                      )}
                    </div>
                    <p className="car-description">
                      {car?.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="item-price">
                    <span className="price">${parseFloat(item.price || 0).toLocaleString()}</span>
                    <span className="quantity">Qty: {item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="order-summary-section">
          <h3>💰 Order Summary</h3>
          <div className="summary-details">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>${parseFloat(order.total || 0).toLocaleString()}</span>
            </div>
            <div className="summary-line">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="summary-line total">
              <strong>
                <span>Total:</span>
                <span>${parseFloat(order.total || 0).toLocaleString()}</span>
              </strong>
            </div>
          </div>

          {order.shippingAddress && (
            <div className="shipping-info">
              <h4>🚚 Shipping Address</h4>
              <p>{order.shippingAddress}</p>
            </div>
          )}

          {order.notes && (
            <div className="order-notes">
              <h4>📝 Special Instructions</h4>
              <p>{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="order-actions">
        <Link to="/orders" className="back-to-orders-btn">
          ← Back to Orders
        </Link>
        
        {order.status === 'delivered' && (
          <button className="reorder-btn">
            🔄 Reorder Items
          </button>
        )}

        {canUpdateStatus() && order.status !== 'delivered' && (
          <div className="status-update-section">
            <h4>Update Order Status</h4>
            <div className="status-buttons">
              {getNextStatuses(order.status).map((status) => (
                <button 
                  key={status} 
                  className={`status-btn ${order.status === status ? 'active' : ''}`}
                  onClick={() => updateOrderStatus(status)}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
