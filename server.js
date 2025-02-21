const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { ensureAuthenticated } = require('./middleware/authMiddleware');
const taskController = require('./controllers/taskController');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Configure Passport
require('./config/passport')(passport);

const app = express();

// Set up EJS as the view engine and serve static files from the 'public' directory
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Parse URL-encoded bodies and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use method-override to support PUT and DELETE methods via forms
app.use(methodOverride('_method'));

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// Initialize Passport and manage session with Passport
app.use(passport.initialize());
app.use(passport.session());

// Use cookie-parser to parse cookies in the request
app.use(cookieParser());

// Authentication and task routes
app.use('/auth', authRoutes);
app.use('/tasks', ensureAuthenticated, taskRoutes);

// Dashboard route: after login, redirect users here to see their tasks
app.get('/dashboard', ensureAuthenticated, taskController.getTasks);

// Home page route
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Error connecting to MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
