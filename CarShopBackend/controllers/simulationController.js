// Add simulation endpoint for user monitoring
const userMonitor = require('../services/userMonitor');

// Simulate suspicious activity for testing and demonstration
exports.simulateActivity = async (req, res) => {
  try {
    const { action = 'CREATE', count = 15 } = req.body;
    
    // Validate request
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Only admins can use this feature
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
    
    const userId = req.user.id;
    
    // Call the service to simulate activity
    await userMonitor.simulateSuspiciousActivity(userId, action, count);
    
    res.status(200).json({ 
      message: 'Suspicious activity simulated successfully',
      details: {
        userId,
        action,
        count
      }
    });
  } catch (error) {
    console.error('Error simulating suspicious activity:', error);
    res.status(500).json({ message: 'Error simulating activity', error: error.message });
  }
};

module.exports = exports;
