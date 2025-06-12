const { MonitoredUser, UserLog, User } = require('../models');
const { Op } = require('sequelize');

// Get all monitored users - admin only
exports.getMonitoredUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
    
    const monitoredUsers = await MonitoredUser.findAll({
      where: {
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role']
        }
      ],
      order: [['lastUpdated', 'DESC']]
    });
    
    res.status(200).json(monitoredUsers);
  } catch (error) {
    console.error('Error getting monitored users:', error);
    res.status(500).json({ message: 'Error retrieving monitored users', error: error.message });
  }
};

// Get user activity logs - admin only for others' logs
exports.getUserLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Check if user is admin or requesting their own logs
    if (requestingUser.role !== 'admin' && requestingUser.id != userId) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own logs' });
    }

    const logs = await UserLog.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']],
      limit: 100
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error getting user logs:', error);
    res.status(500).json({ message: 'Error retrieving user logs', error: error.message });
  }
};

// Update monitored user status - admin only
exports.updateMonitoredUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
    
    const monitoredUser = await MonitoredUser.findByPk(id);
    
    if (!monitoredUser) {
      return res.status(404).json({ message: 'Monitored user not found' });
    }
    
    monitoredUser.status = status;
    monitoredUser.lastUpdated = new Date();
    await monitoredUser.save();
    
    res.status(200).json({ message: 'Status updated successfully', monitoredUser });
  } catch (error) {
    console.error('Error updating monitored user status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
};

// Get statistics about user activity - admin only
exports.getUserActivityStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get action counts from the last 24 hours
    const recentActivity = await UserLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: oneDayAgo
        }
      },
      attributes: [
        'action',
        [UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'count']
      ],
      group: ['action']
    });
    
    // Get most active users from the last 24 hours
    const mostActiveUsers = await UserLog.findAll({
      where: {
        timestamp: {
          [Op.gte]: oneDayAgo
        }
      },
      attributes: [
        'userId',
        [UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'actionCount']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'role']
        }
      ],
      group: ['userId', 'user.id', 'user.username', 'user.role'],
      order: [[UserLog.sequelize.literal('actionCount'), 'DESC']],
      limit: 10
    });
    
    res.status(200).json({
      recentActivity,
      mostActiveUsers
    });
  } catch (error) {
    console.error('Error getting user activity stats:', error);
    res.status(500).json({ message: 'Error retrieving activity stats', error: error.message });
  }
};

module.exports = exports;
