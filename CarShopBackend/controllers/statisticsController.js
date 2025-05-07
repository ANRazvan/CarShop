// Statistics controller for optimized queries on large datasets
const { sequelize } = require('../config/pgdb');
const { Op } = require('sequelize');
const Car = require('../models/Car');
const Brand = require('../models/Brand');
const { promisify } = require('util');
const redis = require('redis');

// Set up Redis client for caching (if Redis is available)
let redisClient;
let getAsync;
let setexAsync;

try {
  // Optional Redis caching layer - gracefully falls back if Redis not available
  redisClient = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');
  redisClient.on('error', (err) => {
    console.log('Redis error (caching disabled):', err);
    redisClient = null;
  });
  getAsync = redisClient ? promisify(redisClient.get).bind(redisClient) : null;
  setexAsync = redisClient ? promisify(redisClient.setex).bind(redisClient) : null;
} catch (error) {
  console.log('Redis not available, continuing without caching');
  redisClient = null;
}

// Get optimized car statistics with complex aggregations
exports.getCarStatistics = async (req, res) => {
  try {
    console.time('statistics-query');
    
    // Extract filter parameters for more flexibility
    const {
      yearFrom = 2000,
      yearTo = 2025,
      priceFrom,
      priceTo,
      fuelTypes,
      brandIds,
      keywords,
      useCache = 'true' // Default to using cache unless explicitly disabled
    } = req.query;
    
    // Generate cache key based on query parameters
    const cacheKey = `stats:${yearFrom}:${yearTo}:${priceFrom || ''}:${priceTo || ''}:${
      Array.isArray(fuelTypes) ? fuelTypes.join(',') : fuelTypes || ''
    }:${
      Array.isArray(brandIds) ? brandIds.join(',') : brandIds || ''
    }:${keywords || ''}`;
    
    // Try to get data from cache first if cache is enabled
    if (redisClient && useCache === 'true') {
      try {
        const cachedData = await getAsync(cacheKey);
        if (cachedData) {
          console.log('Cache hit for statistics query');
          const parsedData = JSON.parse(cachedData);
          console.timeEnd('statistics-query');
          return res.json(parsedData);
        }
        console.log('Cache miss for statistics query');
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
        // Continue with database query if cache fails
      }
    }
    
    // Build where clause dynamically
    const whereClause = {
      year: {
        [Op.between]: [parseInt(yearFrom), parseInt(yearTo)]
      }
    };
    
    if (priceFrom && priceTo) {
      whereClause.price = {
        [Op.between]: [parseFloat(priceFrom), parseFloat(priceTo)]
      };
    }
    
    if (fuelTypes) {
      const fuelTypeArr = Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes];
      whereClause.fuelType = {
        [Op.in]: fuelTypeArr
      };
    }
    
    if (brandIds) {
      const brandIdArr = Array.isArray(brandIds) 
        ? brandIds.map(id => parseInt(id)) 
        : [parseInt(brandIds)];
      whereClause.brandId = {
        [Op.in]: brandIdArr
      };
    }
    
    if (keywords) {
      // Use GIN index for text search if possible
      if (keywords.length > 3) {
        whereClause.keywords = sequelize.literal(`to_tsvector('english', "keywords") @@ plainto_tsquery('english', '${keywords.replace(/'/g, "''")}')`);
      } else {
        // Fall back to ILIKE for short search terms
        whereClause.keywords = {
          [Op.iLike]: `%${keywords}%`
        };
      }
    }
    
    console.log('Where Clause:', whereClause);
    const startTime = process.hrtime();

    // Execute optimized queries in parallel for better performance
    const [
      totalCount,
      averagePrice,
      brandDistribution,
      fuelTypeDistribution,
      yearDistribution,
      priceRanges
    ] = await Promise.all([
      // Total count - simple query, no optimization needed
      Car.count({ where: whereClause }),
      
      // Average price - use raw query for better performance
      sequelize.query(`
        SELECT AVG("price") as "averagePrice",
               MIN("price") as "minPrice",
               MAX("price") as "maxPrice"
        FROM "Cars"
        WHERE "year" BETWEEN :yearFrom AND :yearTo
        ${priceFrom && priceTo ? 'AND "price" BETWEEN :priceFrom AND :priceTo' : ''}
        ${fuelTypes ? 'AND "fuelType" IN (:fuelTypes)' : ''}
        ${brandIds ? 'AND "brandId" IN (:brandIds)' : ''}
        ${keywords ? 'AND "keywords" ILIKE :keywords' : ''}
      `, {
        replacements: {
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          priceFrom: parseFloat(priceFrom || 0),
          priceTo: parseFloat(priceTo || 1000000),
          fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes],
          brandIds: Array.isArray(brandIds) ? brandIds.map(id => parseInt(id)) : brandIds ? [parseInt(brandIds)] : undefined,
          keywords: keywords ? `%${keywords}%` : undefined
        },
        type: sequelize.QueryTypes.SELECT
      }),
      
      // Brand distribution with brand name - using JOIN and GROUP BY with index
      sequelize.query(`
        SELECT b."name" as "brandName", COUNT(*) as "count"
        FROM "Cars" c
        JOIN "Brands" b ON c."brandId" = b."id"
        WHERE c."year" BETWEEN :yearFrom AND :yearTo
        ${priceFrom && priceTo ? 'AND c."price" BETWEEN :priceFrom AND :priceTo' : ''}
        ${fuelTypes ? 'AND c."fuelType" IN (:fuelTypes)' : ''}
        ${brandIds ? 'AND c."brandId" IN (:brandIds)' : ''}
        ${keywords ? 'AND c."keywords" ILIKE :keywords' : ''}
        GROUP BY b."name"
        ORDER BY "count" DESC
        LIMIT 20
      `, {
        replacements: {
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          priceFrom: parseFloat(priceFrom || 0),
          priceTo: parseFloat(priceTo || 1000000),
          fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes],
          brandIds: Array.isArray(brandIds) ? brandIds.map(id => parseInt(id)) : brandIds ? [parseInt(brandIds)] : undefined,
          keywords: keywords ? `%${keywords}%` : undefined
        },
        type: sequelize.QueryTypes.SELECT
      }),
      
      // Fuel type distribution - optimized with indexed column
      sequelize.query(`
        SELECT "fuelType", COUNT(*) as "count"
        FROM "Cars"
        WHERE "year" BETWEEN :yearFrom AND :yearTo
        ${priceFrom && priceTo ? 'AND "price" BETWEEN :priceFrom AND :priceTo' : ''}
        ${fuelTypes ? 'AND "fuelType" IN (:fuelTypes)' : ''}
        ${brandIds ? 'AND "brandId" IN (:brandIds)' : ''}
        ${keywords ? 'AND "keywords" ILIKE :keywords' : ''}
        GROUP BY "fuelType"
        ORDER BY "count" DESC
      `, {
        replacements: {
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          priceFrom: parseFloat(priceFrom || 0),
          priceTo: parseFloat(priceTo || 1000000),
          fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes],
          brandIds: Array.isArray(brandIds) ? brandIds.map(id => parseInt(id)) : brandIds ? [parseInt(brandIds)] : undefined,
          keywords: keywords ? `%${keywords}%` : undefined
        },
        type: sequelize.QueryTypes.SELECT
      }),
      
      // Year distribution - using year index with LIMIT for faster results
      sequelize.query(`
        SELECT "year", COUNT(*) as "count"
        FROM "Cars"
        WHERE "year" BETWEEN :yearFrom AND :yearTo
        ${priceFrom && priceTo ? 'AND "price" BETWEEN :priceFrom AND :priceTo' : ''}
        ${fuelTypes ? 'AND "fuelType" IN (:fuelTypes)' : ''}
        ${brandIds ? 'AND "brandId" IN (:brandIds)' : ''}
        ${keywords ? 'AND "keywords" ILIKE :keywords' : ''}
        GROUP BY "year"
        ORDER BY "year" ASC
      `, {
        replacements: {
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          priceFrom: parseFloat(priceFrom || 0),
          priceTo: parseFloat(priceTo || 1000000),
          fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes],
          brandIds: Array.isArray(brandIds) ? brandIds.map(id => parseInt(id)) : brandIds ? [parseInt(brandIds)] : undefined,
          keywords: keywords ? `%${keywords}%` : undefined
        },
        type: sequelize.QueryTypes.SELECT
      }),
      
      // Price range distribution - optimizing the width_bucket query with EXPLAIN ANALYZE feedback
      sequelize.query(`
        WITH price_stats AS (
          SELECT 
            MIN("price") as min_price, 
            MAX("price") as max_price
          FROM "Cars"
          WHERE "year" BETWEEN :yearFrom AND :yearTo
          ${fuelTypes ? 'AND "fuelType" IN (:fuelTypes)' : ''}
          ${brandIds ? 'AND "brandId" IN (:brandIds)' : ''}
          ${keywords ? 'AND "keywords" ILIKE :keywords' : ''}
        ),
        price_ranges AS (
          SELECT 
            min_price,
            max_price,
            generate_series(1, 10) as bucket_num,
            (max_price - min_price) / 10 as bucket_size
          FROM price_stats
        )
        SELECT
          ROUND(min_price + (bucket_num - 1) * bucket_size) as "minPrice",
          ROUND(min_price + bucket_num * bucket_size) as "maxPrice",
          COUNT(c.*) as "count",
          bucket_num as "bucket"
        FROM price_ranges pr
        JOIN "Cars" c ON c."price" >= min_price + (bucket_num - 1) * bucket_size 
                      AND c."price" < min_price + bucket_num * bucket_size
        WHERE c."year" BETWEEN :yearFrom AND :yearTo
        ${fuelTypes ? 'AND c."fuelType" IN (:fuelTypes)' : ''}
        ${brandIds ? 'AND c."brandId" IN (:brandIds)' : ''}
        ${keywords ? 'AND c."keywords" ILIKE :keywords' : ''}
        GROUP BY pr.min_price, pr.bucket_size, bucket_num
        ORDER BY bucket_num
      `, {
        replacements: {
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          fuelTypes: Array.isArray(fuelTypes) ? fuelTypes : [fuelTypes],
          brandIds: Array.isArray(brandIds) ? brandIds.map(id => parseInt(id)) : brandIds ? [parseInt(brandIds)] : undefined,
          keywords: keywords ? `%${keywords}%` : undefined
        },
        type: sequelize.QueryTypes.SELECT
      })
    ]);
    
    const executionTime = process.hrtime(startTime);
    const executionTimeMs = executionTime[0] * 1000 + executionTime[1] / 1000000;
    console.log('Query Execution Time (ms):', executionTimeMs);
    console.timeEnd('statistics-query');
    
    // Prepare response data
    const responseData = {
      totalCars: totalCount,
      priceStats: averagePrice[0],
      brandDistribution,
      fuelTypeDistribution,
      yearDistribution,
      priceRanges,
      executionTimeMs,
      appliedFilters: {
        yearFrom,
        yearTo,
        priceFrom,
        priceTo,
        fuelTypes,
        brandIds,
        keywords
      }
    };
    
    // Cache the result for 5 minutes if Redis is available
    if (redisClient && setexAsync && useCache === 'true') {
      try {
        await setexAsync(cacheKey, 300, JSON.stringify(responseData));
        console.log('Statistics data cached for 5 minutes');
      } catch (cacheError) {
        console.error('Cache set error:', cacheError);
      }
    }
    
    // Return aggregated statistics with execution time
    res.json(responseData);
  } catch (error) {
    console.error('Error in statistics controller:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get trending data (most viewed/popular cars)
exports.getTrendingData = async (req, res) => {
  try {
    console.time('trending-query');
    
    // Try to get cached trending data first
    if (redisClient && getAsync) {
      try {
        const cachedTrending = await getAsync('trending_cars');
        if (cachedTrending) {
          const parsedData = JSON.parse(cachedTrending);
          console.log('Cache hit for trending data');
          console.timeEnd('trending-query');
          return res.json(parsedData);
        }
      } catch (cacheError) {
        console.error('Cache error for trending data:', cacheError);
      }
    }
    
    // Optimized query using Common Table Expressions (CTEs) with indexed columns
    const trending = await sequelize.query(`
      WITH RecentCars AS (
        SELECT c.*, 
               ROW_NUMBER() OVER (PARTITION BY c."brandId" ORDER BY c."createdAt" DESC) as rn
        FROM "Cars" c
      ),
      PopularBrands AS (
        SELECT "brandId", COUNT(*) as popularity
        FROM "Cars"
        GROUP BY "brandId"
        ORDER BY popularity DESC
        LIMIT 10
      )
      SELECT c.id, c.make, c.model, c.year, c.price, c.fuelType, c.img, c.imgType, c.color,
             b."name" as "brandName", b."country" as "brandCountry"
      FROM RecentCars c
      JOIN "Brands" b ON c."brandId" = b."id"
      JOIN PopularBrands pb ON c."brandId" = pb."brandId"
      WHERE c.rn <= 3
      ORDER BY pb.popularity DESC, c."createdAt" DESC
      LIMIT 15
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Calculate execution time
    const executionTime = process.hrtime();
    const executionTimeMs = executionTime[0] * 1000 + executionTime[1] / 1000000;
    console.timeEnd('trending-query');
    
    const responseData = {
      trending,
      executionTimeMs
    };
    
    // Cache trending data for 10 minutes
    if (redisClient && setexAsync) {
      try {
        await setexAsync('trending_cars', 600, JSON.stringify(responseData));
        console.log('Trending data cached for 10 minutes');
      } catch (cacheError) {
        console.error('Cache set error for trending:', cacheError);
      }
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error in trending controller:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};