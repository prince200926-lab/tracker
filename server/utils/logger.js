// Simple logger utility for real-time logging
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file path
const logFilePath = path.join(logsDir, 'application.log');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get current log level from environment or default to INFO
const currentLogLevel = LOG_LEVELS[process.env.LOGGING_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Format timestamp
const formatTimestamp = () => {
  return new Date().toISOString();
};

// Write log to file
const writeLog = (level, message) => {
  const timestamp = formatTimestamp();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;

  // Write to file
  fs.appendFileSync(logFilePath, logEntry);

  // Also output to console for real-time monitoring
  console.log(logEntry.trim());
};

// Logger functions
const logger = {
  error: (message) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      writeLog('ERROR', message);
    }
  },

  warn: (message) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      writeLog('WARN', message);
    }
  },

  info: (message) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      writeLog('INFO', message);
    }
  },

  debug: (message) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      writeLog('DEBUG', message);
    }
  }
};

module.exports = logger;