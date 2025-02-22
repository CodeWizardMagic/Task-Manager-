const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const router = express.Router();
const { adminMiddleware } = require('../middleware/auth');

router.get('/', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({}, 'name email role');
        res.render('users', { users, user: req.session.user });
    } catch (error) {
        res.status(500).send('Server error');
    }
});
router.get('/:id', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).send('Access denied');
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const tasks = await Task.find({ userId: req.params.id });

        res.render('user-tasks', { user, tasks });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

router.get('/:id/tasks', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const tasks = await Task.find({ userId: user._id });
        res.render('user-tasks', { user, tasks });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
