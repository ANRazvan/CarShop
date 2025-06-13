const { Order, OrderItem, Cart, CartItem, Car, Brand, User } = require('../models');
const { Op } = require('sequelize');

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
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
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch orders'
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    const order = await Order.findOne({
      where: { 
        id: orderId,
        userId: userId // Ensure user can only see their own orders
      },
      include: [
        {
          model: OrderItem,
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

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch order'
    });
  }
};

// Checkout - create order from cart
const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, notes } = req.body;

    // Find user's active cart
    const cart = await Cart.findOne({
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

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Group cart items by car owner
    const itemsByOwner = {};
    for (const cartItem of cart.items) {
      const ownerId = cartItem.car.owner.id;
      if (!itemsByOwner[ownerId]) {
        itemsByOwner[ownerId] = {
          owner: cartItem.car.owner,
          items: [],
          total: 0
        };
      }
      itemsByOwner[ownerId].items.push(cartItem);
      itemsByOwner[ownerId].total += parseFloat(cartItem.price);
    }

    // Create separate orders for each car owner
    const createdOrders = [];
    
    for (const [ownerId, ownerData] of Object.entries(itemsByOwner)) {
      // Create order for this owner's cars
      const order = await Order.create({
        userId: userId,
        total: ownerData.total.toFixed(2),
        status: 'pending',
        orderDate: new Date(),
        shippingAddress: shippingAddress || null,
        notes: notes ? `${notes} (Cars from: ${ownerData.owner.username})` : `Cars from: ${ownerData.owner.username}`
      });

      // Create order items for this owner's cars
      const orderItems = [];
      for (const cartItem of ownerData.items) {
        const orderItem = await OrderItem.create({
          orderId: order.id,
          carId: cartItem.carId,
          price: cartItem.price,
          quantity: 1 // Assuming 1 car per order item
        });
        orderItems.push(orderItem);
      }

      // Fetch the complete order with items
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
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

      createdOrders.push(completeOrder);
    }

    // Update cart status to checkout
    await cart.update({ status: 'checkout' });

    // Clear cart items
    await CartItem.destroy({
      where: { cartId: cart.id }
    });    // Broadcast the order creation via WebSocket
    if (req.app.locals.broadcast) {
      for (const order of createdOrders) {
        req.app.locals.broadcast({
          type: 'ORDER_CREATED',
          data: {
            userId: userId,
            orderId: order.id,
            total: order.total,
            itemCount: order.items.length
          },
          timestamp: Date.now()
        });
      }
    }

    res.status(201).json({
      message: `${createdOrders.length} order(s) created successfully`,
      orders: createdOrders,
      totalOrders: createdOrders.length
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create order'
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let whereConditions = {};
    if (status) {
      whereConditions.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: OrderItem,
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
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch orders'
    });
  }
};

// Update order status (Admin or Car Owner)
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: validStatuses
      });
    }

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Car,
              as: 'car',
              include: [
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

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user is admin OR owns any of the cars in this order
    const isAdmin = req.user.role === 'admin';
    const ownsCar = order.items.some(item => 
      item.car.owner && item.car.owner.id === req.user.id
    );

    if (!isAdmin && !ownsCar) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update orders containing your cars or admin access required.' 
      });
    }

    // Update the order
    const updatedOrder = await order.update({
      status: status,
      notes: notes || order.notes
    });

    // Broadcast the order update via WebSocket
    if (req.app.locals.broadcast) {
      req.app.locals.broadcast({
        type: 'ORDER_STATUS_UPDATED',
        data: {
          orderId: order.id,
          userId: order.userId,
          status: status,
          updatedBy: req.user.id
        },
        timestamp: Date.now()
      });
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update order status'
    });
  }
};

// Get orders containing user's cars (for car owners to manage)
const getOrdersWithUserCars = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Find orders that contain cars owned by this user
    const { count, rows: orders } = await Order.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Car,
              as: 'car',
              where: { userId: userId }, // Only orders with this user's cars
              include: [
                {
                  model: Brand,
                  as: 'brand',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching orders with user cars:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch orders'
    });
  }
};

// Get order statistics
const getOrderStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // User statistics
    const userStats = await Order.findAll({
      where: { userId },
      attributes: [
        'status',
        [Order.sequelize.fn('COUNT', Order.sequelize.col('status')), 'count'],
        [Order.sequelize.fn('SUM', Order.sequelize.col('total')), 'totalAmount']
      ],
      group: ['status']
    });

    // Total user orders
    const totalUserOrders = await Order.count({ where: { userId } });

    let result = {
      userStatistics: {
        totalOrders: totalUserOrders,
        byStatus: userStats
      }
    };

    // Admin statistics
    if (req.user.role === 'admin') {
      const adminStats = await Order.findAll({
        attributes: [
          'status',
          [Order.sequelize.fn('COUNT', Order.sequelize.col('status')), 'count'],
          [Order.sequelize.fn('SUM', Order.sequelize.col('total')), 'totalAmount']
        ],
        group: ['status']
      });

      const totalAdminOrders = await Order.count();

      result.adminStatistics = {
        totalOrders: totalAdminOrders,
        byStatus: adminStats
      };
    }

    res.json(result);

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch order statistics'
    });
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  checkout,
  getAllOrders,
  updateOrderStatus,
  getOrdersWithUserCars,
  getOrderStatistics
};
