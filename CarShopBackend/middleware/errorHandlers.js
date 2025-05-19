/**
 * Error handling middleware for the Car Shop application
 */

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    console.error('Multer error:', err.message);
    
    let errorMessage;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File is too large. Maximum size is 2MB.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = 'Unexpected file field. Please use the correct field name.';
        break;
      default:
        errorMessage = `File upload error: ${err.message}`;
    }
    
    return res.status(400).json({
      error: errorMessage,
      details: err.code
    });
  }
  
  // Not a multer error, pass to the next error handler
  next(err);
};

// Handle generic errors
const handleGenericErrors = (err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  handleMulterError,
  handleGenericErrors
};
