const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MongoDB errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      msg: 'Validation Error',
      error: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      msg: 'Invalid ID format',
      error: 'The provided ID is not valid'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      msg: 'Duplicate field value',
      error: 'This value already exists'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      msg: 'Invalid token',
      error: 'Please log in again'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      msg: 'Token expired',
      error: 'Please log in again'
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      msg: 'File too large',
      error: 'File size exceeds the limit'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      msg: 'Unexpected file field',
      error: 'Invalid file upload'
    });
  }

  // Excel parsing errors
  if (err.message && err.message.includes('Excel')) {
    return res.status(400).json({
      msg: 'Excel parsing error',
      error: 'Unable to parse the Excel file. Please ensure it contains valid data.'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    msg: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong'
  });
};

module.exports = errorHandler; 