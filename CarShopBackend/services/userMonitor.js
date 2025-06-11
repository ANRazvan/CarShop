const { Op } = require('sequelize');
const UserLog = require('../models/UserLog');
const MonitoredUser = require('../models/MonitoredUser');
const User = require('../models/User');

class UserMonitor {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.thresholds = {
      // Define thresholds for suspicious activity detection
      CREATE: { count: 10, timeWindowMinutes: 5 }, // 10 creates within 5 min
      UPDATE: { count: 15, timeWindowMinutes: 5 }, // 15 updates within 5 min
      DELETE: { count: 5, timeWindowMinutes: 5 },  // 5 deletes within 5 min
      LOGIN: { count: 8, timeWindowMinutes: 5 },   // 8 login attempts within 5 min
    };
  }

  start() {
    if (this.isRunning) {
      console.log('User monitor is already running');
      return;
    }

    // Set the interval to run analysis every minute
    this.interval = setInterval(() => {
      this.analyzeUserActivity()
        .catch(err => console.error('Error in user activity analysis:', err));
    }, 60 * 1000); // Check every minute

    this.isRunning = true;
    console.log('User activity monitoring thread started');
  }

  stop() {
    if (!this.isRunning) {
      console.log('User monitor is not running');
      return;
    }

    clearInterval(this.interval);
    this.isRunning = false;
    console.log('User activity monitoring thread stopped');
  }

  async analyzeUserActivity() {
    console.log('Analyzing user activity...');
    
    // For each action type, check for suspicious activity
    for (const [action, threshold] of Object.entries(this.thresholds)) {
      const timeWindowMinutes = threshold.timeWindowMinutes;
      const timeWindowMs = timeWindowMinutes * 60 * 1000;
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindowMs);
      
      try {
        // Group logs by user and count actions within the time window
        const userActivityCounts = await UserLog.findAll({
          attributes: [
            'userId',
            [UserLog.sequelize.fn('COUNT', UserLog.sequelize.col('id')), 'actionCount']
          ],
          where: {
            action: action,
            timestamp: { [Op.gte]: startTime }
          },
          group: ['userId'],
          having: UserLog.sequelize.literal(`COUNT(id) >= ${threshold.count}`),
          raw: true
        });
        
        // For each user exceeding the threshold, add to monitored users
        for (const userActivity of userActivityCounts) {
          const userId = userActivity.userId;
          const actionCount = parseInt(userActivity.actionCount);
          
          // Get user details
          const user = await User.findByPk(userId, {
            attributes: ['username', 'role']
          });
          
          console.log(`Detected high activity: User ${user?.username || userId} performed ${actionCount} ${action} actions in the last ${timeWindowMinutes} minutes`);
          
          // Check if user is already monitored for this action
          const existingMonitoring = await MonitoredUser.findOne({
            where: {
              userId,
              reason: `High frequency of ${action} operations`,
              status: 'active'
            }
          });
          
          if (existingMonitoring) {
            // Update the existing record
            existingMonitoring.actionsCount = actionCount;
            existingMonitoring.lastUpdated = new Date();
            await existingMonitoring.save();
            
            console.log(`Updated monitoring for user ${userId}: ${actionCount} ${action} actions`);
          } else {
            // Create a new monitoring record
            await MonitoredUser.create({
              userId,
              reason: `High frequency of ${action} operations`,
              actionsCount: actionCount,
              timeWindow: `${timeWindowMinutes} minutes`,
              status: 'active'
            });
            
            console.log(`Added user ${userId} to monitored users: ${actionCount} ${action} actions in ${timeWindowMinutes} minutes`);
          }
        }
      } catch (error) {
        console.error(`Error analyzing ${action} activity:`, error);
      }
    }
  }
  
  // Method to simulate suspicious activity for testing
  async simulateSuspiciousActivity(userId, action, count) {
    console.log(`Simulating suspicious activity for user ${userId}: ${count} ${action} actions`);
    
    const logs = [];
    const now = new Date();
    
    // Create log entries with timestamps within the last 5 minutes
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now.getTime() - Math.random() * 5 * 60 * 1000);
      
      logs.push({
        userId,
        action,
        entityType: 'CAR', // Example entity
        entityId: Math.floor(Math.random() * 100), // Random entity ID
        details: 'Simulated activity for testing',
        ipAddress: '127.0.0.1',
        timestamp
      });
    }
    
    // Bulk insert the logs
    await UserLog.bulkCreate(logs);
    console.log(`Created ${count} simulated ${action} logs for user ${userId}`);
    
    // Immediately analyze to detect the suspicious activity
    await this.analyzeUserActivity();
  }
}

// Create singleton instance
const userMonitor = new UserMonitor();

module.exports = userMonitor;
