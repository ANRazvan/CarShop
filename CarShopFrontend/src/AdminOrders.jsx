import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import axios from 'axios';
import config from './config';
import './AdminOrders.css';

const AdminOrders = () => {
  const { isAuthenticated, getAuthToken, currentUser } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  });

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const fetchOrders = async (page = 1, status = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      let url = `${config.API_URL}/api/orders/admin/all?page=${page}&limit=20`;
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await axios.get(url, {
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
    if (!isAuthenticated() || currentUser?.role !== 'admin') {
      return;
    }
    fetchOrders();
  }, [isAuthenticated, currentUser]);

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    fetchOrders(1, status);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
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
      
      // Refresh orders
      fetchOrders(pagination.currentPage, selectedStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(error.response?.data?.error || 'Failed to update order status');
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
    fetchOrders(newPage, selectedStatus);
  };

  if (!isAuthenticated() || currentUser?.role !== 'admin') {
    return (
      <div className="admin-orders-container">
        <div className="access-denied">
          <h2>🔒 Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="admin-orders-container">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      <div className="admin-orders-header">
        <h1>🏪 Order Management</h1>
        <p>Manage customer orders and update status</p>
      </div>

      <div className="orders-controls">
        <div className="status-filter">
          <label>Filter by Status:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="orders-count">
          {pagination.totalOrders} total orders
        </div>
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
          <h2>No orders found</h2>
          <p>No orders match your current filter criteria.</p>
        </div>
      ) : (
        <>
          <div className="orders-table">
            <div className="table-header">
              <div className="col-order">Order</div>
              <div className="col-customer">Customer</div>
              <div className="col-items">Items</div>
              <div className="col-total">Total</div>
              <div className="col-status">Status</div>
              <div className="col-date">Date</div>
              <div className="col-actions">Actions</div>
            </div>
            
            {orders.map((order) => (
              <div key={order.id} className="table-row">
                <div className="col-order">
                  <strong>#{order.id}</strong>
                </div>
                
                <div className="col-customer">
                  <div className="customer-info">
                    <strong>{order.user.username}</strong>
                    <small>{order.user.email}</small>
                  </div>
                </div>
                
                <div className="col-items">
                  <div className="items-summary">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    <div className="items-preview">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="item-preview">
                          {item.car.brand?.name} {item.car.model}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="more-items">
                          +{order.items.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-total">
                  <strong>${parseFloat(order.total || 0).toLocaleString()}</strong>
                </div>
                
                <div className="col-status">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="col-date">
                  {formatDate(order.createdAt)}
                </div>
                
                <div className="col-actions">
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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

export default AdminOrders;
