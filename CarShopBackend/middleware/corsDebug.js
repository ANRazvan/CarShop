// CORS Debug middleware
// Place this file in the middleware directory
const corsDebug = (req, res, next) => {
  console.log('------------------------------');
  console.log('CORS Debug: Incoming Request');
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  
  console.log('Request Headers:');
  console.log(JSON.stringify(req.headers, null, 2));
  
  // Save original methods
  const originalHeader = res.header;
  const originalEnd = res.end;
  
  // Override header method to log all headers being set
  res.header = function(name, value) {
    console.log(`Response Header Set: ${name} = ${value}`);
    return originalHeader.apply(this, arguments);
  };
  
  // Override end method to log response
  res.end = function() {
    console.log('------------------------------');
    console.log('CORS Debug: Outgoing Response');
    console.log(`Status: ${res.statusCode}`);
    console.log('Response Headers:');
    console.log(JSON.stringify(res.getHeaders(), null, 2));
    console.log('------------------------------');
    return originalEnd.apply(this, arguments);
  };
  
  next();
};

module.exports = corsDebug;
