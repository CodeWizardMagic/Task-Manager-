const authMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    req.user = req.session.user;  
    next();
};

const adminMiddleware = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }
    req.user = req.session.user;  
    next();
};

module.exports = { authMiddleware, adminMiddleware };
