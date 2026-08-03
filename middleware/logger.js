const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, 'app.log');
const errorLogFile = path.join(logsDir, 'errors.log');

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Log to file
const writeLog = (message, level = 'INFO') => {
  const logMessage = `[${getTimestamp()}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

const writeErrorLog = (message) => {
  const logMessage = `[${getTimestamp()}] [ERROR] ${message}\n`;
  fs.appendFileSync(errorLogFile, logMessage);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`;
    writeLog(logMessage, 'REQUEST');

    // Log response details for debugging
    if (res.statusCode >= 400) {
      const errorDetails = `${req.method} ${req.path} - Error: ${JSON.stringify(data)}`;
      writeErrorLog(errorDetails);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Error logging
const errorLogger = (err, message) => {
  const errorMessage = `${message} - Error: ${err.message} - Stack: ${err.stack}`;
  writeErrorLog(errorMessage);
  console.error(`[ERROR] ${errorMessage}`);
};

module.exports = {
  requestLogger,
  errorLogger,
  writeLog,
  writeErrorLog,
};