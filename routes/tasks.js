const express = require('express');
const Task = require('../models/Task');
const { authMiddleware } = require('../middleware/auth');  
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.session.user.id });
        res.render('tasks', { user: req.session.user, tasks });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
router.get('/edit/:id', async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).send("Task not found");
      }
      res.render('editTask', { 
        task, 
        user: req.session.user 
      });
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
router.post('/', authMiddleware, async (req, res) => {
    const { title, description, status, priority, dueDate } = req.body;
    await Task.create({ title, description, status, priority, dueDate, userId: req.session.user.id });
    res.redirect('/tasks');
});
router.get('/new', authMiddleware, (req, res) => {
    res.render('task_form', { user: req.session.user, task: {} });
});
router.post('/update/:id', async (req, res) => {
    try {
      await Task.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        status: req.body.status,
        priority: req.body.priority
      });
      res.redirect('/tasks');
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
router.post('/edit/:id', authMiddleware, async (req, res) => {
    await Task.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/tasks');
});

router.post('/delete/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).send('Task not found');
        }

        if (req.session.user.role === 'admin' || task.userId.toString() === req.session.user.id) {
            await Task.findByIdAndDelete(req.params.id);
            return res.redirect(req.get('Referer') || '/tasks');
        } else {
            return res.status(403).send('Forbidden: You are not allowed to delete this task.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
