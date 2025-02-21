const jwt = require('jsonwebtoken');

exports.ensureAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/auth/login');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.redirect('/auth/login');
        req.user = decoded;
        next();
    });
};
