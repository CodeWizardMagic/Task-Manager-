require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('./config/db'); // Connecting to MongoDB Atlas
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const path = require('path');
const app = express();

// Custom error class with additional features
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errorCode = errorCode;
        this.isOperational = true; // Indicates if this is an operational error
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error response formatter
const formatErrorResponse = (err, req) => {
    // Standard error object structure
    const errorResponse = {
        success: false,
        error: {
            statusCode: err.statusCode || 500,
            message: err.message || 'Internal Server Error',
            errorCode: err.errorCode || 'INTERNAL_ERROR'
        }
    };

    // Add stack trace in development environment
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = err.details || {};
    }

    return errorResponse;
};

// Enhanced global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`, {
        stack: err.stack,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Set default status code
    err.statusCode = err.statusCode || 500;

    // Handle specific error types
    if (err instanceof mongoose.Error.ValidationError) {
        err.statusCode = 400;
        err.errorCode = 'VALIDATION_ERROR';
    } else if (err instanceof mongoose.Error.CastError) {
        err.statusCode = 400;
        err.errorCode = 'INVALID_ID';
    } else if (err.name === 'MongoError' && err.code === 11000) {
        err.statusCode = 409;
        err.message = 'Duplicate key error';
        err.errorCode = 'DUPLICATE_KEY';
    }

    // Format the error response
    const errorResponse = formatErrorResponse(err, req);

    // Send different responses based on the request's Accept header
    if (req.accepts('html')) {
        // Render different error pages based on status code
        const errorTemplate = getErrorTemplate(err.statusCode);
        res.status(err.statusCode).render(errorTemplate, { 
            error: errorResponse.error,
            user: req.session.user // Pass user info for consistent header rendering
        });
    } else {
        res.status(err.statusCode).json(errorResponse);
    }
};

// Helper function to determine which error template to use
const getErrorTemplate = (statusCode) => {
    switch (statusCode) {
        case 401:
            return 'errors/unauthorized';
        case 403:
            return 'errors/forbidden';
        case 404:
            return 'errors/not-found';
        case 429:
            return 'errors/rate-limit';
        default:
            return 'errors/error';
    }
};

// Async handler wrapper with improved error handling
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next))
        .catch(err => {
            // Convert known errors to AppError instances
            if (err.name === 'JsonWebTokenError') {
                return next(new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN'));
            }
            if (err.name === 'TokenExpiredError') {
                return next(new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
            }
            next(err);
        });

// Enhanced JSON parsing middleware
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch(e) {
            throw new AppError('Invalid JSON payload', 400, 'INVALID_JSON');
        }
    }
}));

app.use(express.urlencoded({ extended: true }));

// Session configuration with enhanced security
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Changed to false for better security
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict' // Prevent CSRF
    },
    rolling: true,
    name: 'sessionId' // Change default cookie name for security
}));

// Security middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Static files with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enhanced authentication middleware
function require2FA(req, res, next) {
    if (!req.session.user) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    if (req.session.user.requires2FA && !req.session.user.is2FAVerified) {
        throw new AppError('2FA verification required', 401, 'TWO_FA_REQUIRED');
    }
    next();
}

// Route handling
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);

// Protected routes with enhanced error handling
app.get('/profile', require2FA, asyncHandler(async (req, res) => {
    if (!req.session.user) {
        throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }
    res.render('profile', { user: req.session.user });
}));

// Enhanced 404 handler
app.use((req, res, next) => {
    next(new AppError(`Resource not found: ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Global error handling middleware
app.use(errorHandler);

// Improved graceful shutdown
const gracefulShutdown = async () => {
    console.log('Starting graceful shutdown...');
    
    try {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('Server closed');
        
        await mongoose.connection.close(false);
        console.log('Database connection closed');
        
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
};

// Server startup with enhanced error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥');
    console.error(err);
    gracefulShutdown();
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥');
    console.error(err);
    process.exit(1);
});

// Graceful shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export for testing
module.exports = { app, AppError };