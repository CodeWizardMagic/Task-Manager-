const Task = require('../models/Task');

// Display user tasks (Dashboard)
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user._id });
        res.render('dashboard', { user: req.user, tasks });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
};

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const task = new Task({
            title,
            description,
            user: req.user._id
        });
        await task.save();
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
};
