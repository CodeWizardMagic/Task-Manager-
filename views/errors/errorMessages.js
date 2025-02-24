const errorMessages = {
    400: {
        title: 'Bad Request',
        defaultMessage: 'The request could not be understood by the server due to malformed syntax.'
    },
    401: {
        title: 'Unauthorized',
        defaultMessage: 'Authentication is required to access this resource.'
    },
    403: {
        title: 'Forbidden',
        defaultMessage: 'You do not have permission to access this resource.'
    },
    404: {
        title: 'Not Found',
        defaultMessage: 'The requested resource could not be found.'
    },
    429: {
        title: 'Too Many Requests',
        defaultMessage: 'You have exceeded the number of allowed requests. Please try again later.'
    },
    500: {
        title: 'Internal Server Error',
        defaultMessage: 'An unexpected condition was encountered by the server.'
    }
};

module.exports = errorMessages;