const { Cart, CartItem, Car, Brand, User } = require('../models');

// Get user's current cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
      // Find or create an active cart for the user
    let cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Car,
              as: 'car',
              include: [
                {
                  model: Brand,
                  as: 'brand',
                  attributes: ['id', 'name']
                },
                {
                  model: User,
                  as: 'owner',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!cart) {
      // Create a new cart if none exists
      cart = await Cart.create({
        userId: userId,
        total: 0.00,
        status: 'active'
      });
        // Fetch the cart with associations
      cart = await Cart.findByPk(cart.id, {
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Car,
                as: 'car',
                include: [
                  {
                    model: Brand,
                    as: 'brand',
                    attributes: ['id', 'name']
                  },
                  {
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'username']
                  }
                ]
              }
            ]
          }
        ]
      });
    }

    res.json({
      cart: cart,
      itemCount: cart.items ? cart.items.length : 0
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch cart'
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { carId } = req.body;

    if (!carId) {
      return res.status(400).json({ error: 'Car ID is required' });
    }    // Check if car exists
    const car = await Car.findByPk(carId, {
      include: [
        {
          model: Brand,
          as: 'brand',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check if user is trying to add their own car to cart
    if (car.userId === userId) {
      return res.status(400).json({ error: 'You cannot add your own car to the cart' });
    }

    // Find or create an active cart
    let cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      }
    });

    if (!cart) {
      cart = await Cart.create({
        userId: userId,
        total: 0.00,
        status: 'active'
      });
    }

    // Check if car is already in cart
    const existingCartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        carId: carId
      }
    });

    if (existingCartItem) {
      return res.status(400).json({ error: 'Car is already in your cart' });
    }

    // Add car to cart
    const cartItem = await CartItem.create({
      cartId: cart.id,
      carId: carId,
      price: car.price
    });

    // Update cart total
    const cartTotal = await CartItem.sum('price', {
      where: { cartId: cart.id }
    });

    await cart.update({ total: cartTotal || 0 });    // Fetch the updated cart with all items
    const updatedCart = await Cart.findByPk(cart.id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Car,
              as: 'car',
              include: [
                {
                  model: Brand,
                  as: 'brand',
                  attributes: ['id', 'name']
                },
                {
                  model: User,
                  as: 'owner',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        }
      ]
    });

    // Broadcast the cart update via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'CART_UPDATED',
        data: {
          userId: userId,
          cartId: cart.id,
          action: 'add',
          carId: carId,
          itemCount: updatedCart.items.length
        },
        timestamp: Date.now()
      });
    }

    res.status(201).json({
      message: 'Car added to cart successfully',
      cart: updatedCart,
      itemCount: updatedCart.items.length
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to add car to cart'
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { carId } = req.params;

    // Find user's active cart
    const cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      }
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Find and remove the cart item
    const cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        carId: carId
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Car not found in cart' });
    }

    await cartItem.destroy();

    // Update cart total
    const cartTotal = await CartItem.sum('price', {
      where: { cartId: cart.id }
    });

    await cart.update({ total: cartTotal || 0 });    // Fetch the updated cart
    const updatedCart = await Cart.findByPk(cart.id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Car,
              as: 'car',
              include: [
                {
                  model: Brand,
                  as: 'brand',
                  attributes: ['id', 'name']
                },
                {
                  model: User,
                  as: 'owner',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        }
      ]
    });

    // Broadcast the cart update via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'CART_UPDATED',
        data: {
          userId: userId,
          cartId: cart.id,
          action: 'remove',
          carId: carId,
          itemCount: updatedCart.items.length
        },
        timestamp: Date.now()
      });
    }

    res.json({
      message: 'Car removed from cart successfully',
      cart: updatedCart,
      itemCount: updatedCart.items.length
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to remove car from cart'
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's active cart
    const cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      }
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    // Remove all cart items
    await CartItem.destroy({
      where: { cartId: cart.id }
    });

    // Update cart total
    await cart.update({ total: 0.00 });

    // Broadcast the cart update via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'CART_UPDATED',
        data: {
          userId: userId,
          cartId: cart.id,
          action: 'clear',
          itemCount: 0
        },
        timestamp: Date.now()
      });
    }

    res.json({
      message: 'Cart cleared successfully',
      cart: {
        ...cart.toJSON(),
        items: []
      },
      itemCount: 0
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to clear cart'
    });
  }
};

// Get cart item count (for navbar badge)
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: {
        userId: userId,
        status: 'active'
      },
      include: [
        {
          model: CartItem,
          as: 'items'
        }
      ]
    });

    const itemCount = cart ? cart.items.length : 0;

    res.json({ itemCount });

  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to get cart count'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount
};
