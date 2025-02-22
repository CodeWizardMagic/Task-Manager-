const express = require('express');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    const users = await User.find();
    res.render('admin-users', { users });
});

router.post('/users/:id/delete', isAuthenticated, isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
});

module.exports = router;
