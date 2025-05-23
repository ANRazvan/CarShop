// Statistics controller endpoint for toggling indices
const { sequelize } = require('../config/database');

// Toggle database indices on/off
exports.toggleIndices = async (req, res) => {
  try {
    const { enable = true } = req.query;
    const enableIndices = enable === 'true'; // Convert string to boolean
    
    // Use a transaction to ensure atomicity
    const t = await sequelize.transaction();
    
    try {
      // Toggle indices based on the enable parameter
      if (enableIndices) {
        await t.query('SET enable_indexscan = on;');
        await t.query('SET enable_bitmapscan = on;');
      } else {
        await t.query('SET enable_indexscan = off;');
        await t.query('SET enable_bitmapscan = off;');
      }
      
      await t.commit();
      
      // Check current status
      const [indexScan] = await sequelize.query('SHOW enable_indexscan;');
      const [bitmapScan] = await sequelize.query('SHOW enable_bitmapscan;');
      
      res.json({
        success: true,
        message: `Database indices ${enableIndices ? 'enabled' : 'disabled'} successfully`,
        settings: {
          enable_indexscan: indexScan[0].enable_indexscan,
          enable_bitmapscan: bitmapScan[0].enable_bitmapscan
        }
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error toggling indices:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error toggling indices: ${error.message}`
    });
  }
};

// Get database indices and their status
exports.getIndicesStatus = async (req, res) => {
  try {
    // Retrieve indices
    const [indices] = await sequelize.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename IN ('Cars', 'Brands')
      ORDER BY tablename, indexname;
    `);
    
    // Check current settings
    const [indexScan] = await sequelize.query('SHOW enable_indexscan;');
    const [bitmapScan] = await sequelize.query('SHOW enable_bitmapscan;');
    
    // Get execution plan for a sample query to verify index usage
    const [samplePlan] = await sequelize.query(`
      EXPLAIN (FORMAT JSON)
      SELECT COUNT(*) FROM "Cars" 
      WHERE "year" BETWEEN 2010 AND 2020 AND "price" < 50000
    `);
    
    const indexStatus = {
      enabled: indexScan[0].enable_indexscan === 'on' && bitmapScan[0].enable_bitmapscan === 'on',
      settings: {
        enable_indexscan: indexScan[0].enable_indexscan,
        enable_bitmapscan: bitmapScan[0].enable_bitmapscan
      },
      indices: indices,
      sampleQueryPlan: samplePlan
    };
    
    res.json(indexStatus);
  } catch (error) {
    console.error('Error getting indices status:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error getting indices status: ${error.message}`
    });
  }
};
