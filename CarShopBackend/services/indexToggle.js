// Function to toggle index usage within a database session
const toggleSessionIndices = async (connection, enable) => {
  try {
    if (enable) {
      await connection.query('SET enable_indexscan = on;');
      await connection.query('SET enable_bitmapscan = on;');
    } else {
      await connection.query('SET enable_indexscan = off;');
      await connection.query('SET enable_bitmapscan = off;');
    }
    return true;
  } catch (error) {
    console.error('Error toggling indices for session:', error);
    return false;
  }
};

module.exports = { toggleSessionIndices };
