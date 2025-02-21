const User = require('../models/User');
const bcrypt = require('bcrypt');
const passport = require('passport');

exports.getLogin = (req, res) => {
    res.render('login', { message: '' });
};

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        console.log("Auth attempt:", { err, user, info }); // Логируем данные авторизации

        if (err) return next(err);
        if (!user) {
            console.log("Login failed:", info);
            return res.render('login', { message: 'Invalid username or password' });
        }

        req.logIn(user, (err) => {
            if (err) return next(err);
            console.log("Login successful:", user);
            res.redirect('/dashboard');
        });
    })(req, res, next);
};


exports.getRegister = (req, res) => {
    res.render('register', { message: '' });
};

exports.postRegister = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Регистрация - хеш пароля:", hashedPassword);

        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.redirect('/auth/login');
    } catch (err) {
        console.error("Ошибка регистрации:", err);
        res.render('register', { message: 'Ошибка регистрации' });
    }
};



exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
};
