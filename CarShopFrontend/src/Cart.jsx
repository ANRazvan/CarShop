import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from './CartContext';
import { useAuth } from './hooks/useAuth';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, cartCount, loading, error, fetchCart, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const [localLoading, setLocalLoading] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchCart();
  }, [isAuthenticated, fetchCart, navigate]);

  const handleRemoveItem = async (carId) => {
    try {
      setLocalLoading(prev => ({ ...prev, [carId]: true }));
      await removeFromCart(carId);
    } catch (error) {
      console.error('Error removing item:', error);
      alert(error.message || 'Failed to remove item from cart');
    } finally {
      setLocalLoading(prev => ({ ...prev, [carId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }

    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert(error.message || 'Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      alert('Your cart is empty');
      return;
    }
    
    // For now, just show an alert. In a real app, this would go to checkout process
    alert(`Checkout functionality coming soon!\n\nTotal: $${parseFloat(cart.total || 0).toLocaleString()}`);
  };

  if (!isAuthenticated()) {
    return null; // Will redirect in useEffect
  }

  if (loading && !cart) {
    return (
      <div className="cart-container">
        <div className="cart-loading">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="cart-container">
        <div className="cart-error">
          <h2>⚠️ Error Loading Cart</h2>
          <p>{error}</p>
          <button onClick={fetchCart} className="retry-btn">Try Again</button>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const cartTotal = parseFloat(cart?.total || 0);

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>🛒 Shopping Cart</h1>
        <p className="cart-subtitle">Welcome back, {currentUser?.username}!</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any cars to your cart yet.</p>
          <Link to="/" className="continue-shopping-btn">
            Browse Cars
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-actions">
            <div className="cart-info">
              <span className="item-count">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
              <span className="total-amount">Total: ${cartTotal.toLocaleString()}</span>
            </div>
            <div className="action-buttons">
              <button 
                onClick={handleClearCart} 
                className="clear-cart-btn"
                disabled={loading}
              >
                Clear Cart
              </button>
              <button 
                onClick={handleCheckout} 
                className="checkout-btn"
                disabled={loading}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>

          <div className="cart-items">
            {cartItems.map((item) => {
              const car = item.car;
              const brand = car?.brand;
              const itemLoading = localLoading[car?.id];
              
              return (
                <div key={item.id} className={`cart-item ${itemLoading ? 'loading' : ''}`}>
                  <div className="car-image">
                    <img 
                      src={car?.img || '/placeholder.jpeg'} 
                      alt={`${brand?.name || 'Car'} ${car?.model || ''}`}
                      onError={(e) => {
                        e.target.src = '/placeholder.jpeg';
                      }}
                    />
                  </div>
                  
                  <div className="car-details">
                    <h3 className="car-title">
                      {brand?.name || 'Unknown'} {car?.model || 'Model'}
                    </h3>
                    <div className="car-specs">
                      <span className="spec">📅 {car?.year || 'N/A'}</span>
                      <span className="spec">⛽ {car?.fuelType || 'N/A'}</span>
                      {car?.mileage && <span className="spec">🛣️ {car.mileage} miles</span>}
                    </div>
                    <p className="car-description">
                      {car?.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="item-price">
                    <span className="price">${parseFloat(item.price || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="item-actions">
                    <Link 
                      to={`/cars/${car?.id}`} 
                      className="view-details-btn"
                      title="View car details"
                    >
                      👁️ View
                    </Link>
                    <button 
                      onClick={() => handleRemoveItem(car?.id)}
                      className="remove-item-btn"
                      disabled={itemLoading || loading}
                      title="Remove from cart"
                    >
                      {itemLoading ? '⏳' : '🗑️'} Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="summary-section">
              <h3>Order Summary</h3>
              <div className="summary-line">
                <span>Items ({cartCount}):</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              <div className="summary-line total">
                <strong>
                  <span>Total:</span>
                  <span>${cartTotal.toLocaleString()}</span>
                </strong>
              </div>
            </div>
            
            <div className="checkout-section">
              <button 
                onClick={handleCheckout} 
                className="checkout-btn primary"
                disabled={loading}
              >
                🚗 Proceed to Checkout
              </button>
              <Link to="/" className="continue-shopping-link">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
