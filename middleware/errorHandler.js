// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry detected',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid foreign key reference',
    });
  }

  // Generic database error
  if (err.name === 'QueryResultError' || err.message.includes('query')) {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
  });
};

module.exports = errorHandler;