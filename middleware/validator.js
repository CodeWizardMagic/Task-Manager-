const Joi = require('joi');

// User validation schemas
const userSchemas = {
    register: Joi.object({
        username: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required()
            .messages({
                'string.empty': 'Username is required',
                'string.min': 'Username must be at least 3 characters long',
                'string.max': 'Username cannot exceed 30 characters'
            }),
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please provide a valid email address'
            }),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{8,30}$'))
            .required()
            .messages({
                'string.empty': 'Password is required',
                'string.pattern.base': 'Password must be 8-30 characters and contain valid characters'
            }),
        confirmPassword: Joi.ref('password')
    }).with('password', 'confirmPassword'),

    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please provide a valid email address'
            }),
        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'Password is required'
            })
    })
};

// Task validation schemas
const taskSchemas = {
    create: Joi.object({
        title: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Task title is required',
                'string.min': 'Task title must be at least 3 characters long',
                'string.max': 'Task title cannot exceed 100 characters'
            }),
        description: Joi.string()
            .max(500)
            .allow('')
            .messages({
                'string.max': 'Description cannot exceed 500 characters'
            }),
        dueDate: Joi.date()
            .min('now')
            .messages({
                'date.min': 'Due date must be in the future'
            }),
        priority: Joi.string()
            .valid('low', 'medium', 'high')
            .default('medium')
    })
};

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path[0],
                message: detail.message
            }));
            
            return res.status(400).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                errors: errors
            });
        }
        next();
    };
};

module.exports = {
    validate,
    userSchemas,
    taskSchemas
};