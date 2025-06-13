import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCart } from './CartContext';
import axios from 'axios';
import config from './config';
import './Checkout.css';

const Checkout = () => {
  const { isAuthenticated, getAuthToken } = useAuth();
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    shippingAddress: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!cart?.items?.length) {
      setError('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      const response = await axios.post(`${config.API_URL}/api/orders/checkout`, 
        {
          shippingAddress: formData.shippingAddress,
          notes: formData.notes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );      // Clear the cart context
      await fetchCart();
      
      // Handle multiple orders
      const orders = response.data.orders;
      if (orders && orders.length > 0) {
        if (orders.length === 1) {
          // Navigate to single order
          navigate(`/orders/${orders[0].id}`);
        } else {
          // Navigate to orders list with success message
          navigate('/orders', { 
            state: { 
              message: `✅ ${orders.length} orders created successfully! Your cart has been split by car owners.`,
              newOrders: orders.map(o => o.id)
            }
          });
        }
      } else {
        // Fallback to orders list
        navigate('/orders');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    navigate('/login');
    return null;
  }

  if (!cart?.items?.length) {
    return (
      <div className="checkout-container">
        <div className="empty-checkout">
          <h2>🛒 Your cart is empty</h2>
          <p>Add some cars to your cart before checking out.</p>
          <button onClick={() => navigate('/')} className="continue-shopping-btn">
            Browse Cars
          </button>
        </div>
      </div>
    );
  }
  const cartTotal = parseFloat(cart?.total || 0);

  // Group cart items by car owner
  const itemsByOwner = cart?.items?.reduce((acc, item) => {
    const ownerId = item.car?.owner?.id || 'unknown';
    const ownerName = item.car?.owner?.username || 'Unknown Owner';
    
    if (!acc[ownerId]) {
      acc[ownerId] = {
        owner: { id: ownerId, username: ownerName },
        items: [],
        total: 0
      };
    }
    
    acc[ownerId].items.push(item);
    acc[ownerId].total += parseFloat(item.price || 0);
    return acc;
  }, {}) || {};

  const ownerGroups = Object.values(itemsByOwner);
  const uniqueOwners = ownerGroups.length;

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>🛒 Checkout</h1>
        <p>Complete your order</p>
      </div>

      <div className="checkout-content">
        <div className="order-summary">
          <h3>Order Summary</h3>
          
          {uniqueOwners > 1 && (
            <div className="order-split-notice">
              <div className="notice-icon">ℹ️</div>
              <div className="notice-content">
                <strong>Order Split Notice:</strong>
                <p>Your cart contains cars from {uniqueOwners} different owners. This will create {uniqueOwners} separate orders for easier management.</p>
              </div>
            </div>
          )}

          {ownerGroups.map((ownerGroup, index) => (
            <div key={ownerGroup.owner.id} className="owner-group">
              <div className="owner-header">
                <h4>🏪 Cars from: {ownerGroup.owner.username}</h4>
                <span className="owner-total">${ownerGroup.total.toLocaleString()}</span>
              </div>
              <div className="summary-items">
                {ownerGroup.items.map((item) => {
                  const car = item.car;
                  const brand = car?.brand;
                  return (
                    <div key={item.id} className="summary-item">
                      <div className="item-info">
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
            </div>
          ))}
          
          <div className="summary-total">
            <div className="total-line">
              <strong>
                <span>Grand Total: ${cartTotal.toLocaleString()}</span>
              </strong>
            </div>
          </div>
        </div>

        <div className="checkout-form">
          <h3>Shipping Information</h3>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={handleCheckout}>
            <div className="form-group">
              <label htmlFor="shippingAddress">Shipping Address *</label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                placeholder="Enter your complete shipping address..."
                required
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Special Instructions (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special delivery instructions..."
                rows={3}
              />
            </div>

            <div className="checkout-actions">
              <button 
                type="button" 
                onClick={() => navigate('/cart')} 
                className="back-btn"
                disabled={loading}
              >
                ← Back to Cart
              </button>
              <button 
                type="submit" 
                className="place-order-btn"
                disabled={loading}
              >
                {loading ? '⏳ Placing Order...' : '🚗 Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
