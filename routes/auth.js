const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

router.get('/setup-2fa', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/auth/login');

    const secret = speakeasy.generateSecret({
        length: 20,
        name: `MyApp (${user.email})`
    });

    const otpauthUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: `MyApp:${user.email}`,
        issuer: 'MyApp',
        encoding: 'ascii'
    });

    qrcode.toDataURL(otpauthUrl, async (err, imageUrl) => {
        if (err) return res.send('Error generating QR code');

        user.twoFASecret = secret.base32;
        await user.save();

        res.render('setup-2fa', { qrCode: imageUrl, secret: secret.base32, error: null });
    });
});


// Multer storage configuration for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Registration page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', upload.single('profilePicture'), async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.render('register', { 
                error: 'Please fill in all fields.', 
                username, email 
            });
        }

        if (password !== confirmPassword) {
            return res.render('register', { 
                error: 'Passwords do not match.', 
                username, email 
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { 
                error: 'Email already registered.', 
                username, email 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const profilePicture = req.file ? `/uploads/${req.file.filename}` : "/images/default-avatar.png";

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profilePicture,
            role: "user" 
        });

        await newUser.save();

        req.session.userId = newUser._id;

        console.log("✅ New user registered:", newUser);

        res.redirect('/profile'); 
    } catch (err) {
        console.error("🔥 Registration error:", err);
        res.render('register', { 
            error: 'Something went wrong. Try again.', 
            username, email 
        });
    }
});

// Login page
router.get('/login', (req, res) => {
    res.render('login', { email: '', error: null, showOTP: false });
});

// Handle login
router.post('/login', async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                error: 'User not found', 
                email, 
                showOTP: false 
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { 
                error: 'Incorrect password', 
                email, 
                showOTP: false 
            });
        }

        if (user.is2FAEnabled) {
            if (!otp) {
                return res.render('login', { 
                    error: 'Enter OTP from Google Authenticator', 
                    email, 
                    showOTP: true 
                });
            }

            const isValidOTP = speakeasy.totp.verify({
                secret: user.twoFASecret,
                encoding: 'base32',
                token: otp
            });

            if (!isValidOTP) {
                return res.render('login', { 
                    error: 'Invalid OTP code', 
                    email, 
                    showOTP: true 
                });
            }
        }

        req.session.user = { 
            id: user._id, 
            email: user.email, 
            username: user.username, 
            role: user.role, 
            profilePicture: user.profilePicture || '/images/default-avatar.png' 
        };

        console.log("✅ User logged in:", req.session.user);

        res.redirect('/profile');
    } catch (err) {
        console.error("🔥 Login error:", err);
        res.render('login', { 
            error: 'Something went wrong. Try again.', 
            email, 
            showOTP: false 
        });
    }
});

router.post('/enable-2fa', async (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');

    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/auth/login');

    const { otp } = req.body;

    const isValidOTP = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: 'base32',
        token: otp
    });

    if (!isValidOTP) {
        return res.render('setup-2fa', { error: 'Неверный OTP-код.', qrCode: '' });
    }

    user.is2FAEnabled = true;
    await user.save();

    res.redirect('/profile');
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});
router.get('/profile', async (req, res) => {
    try {
        if (!req.session.userId) {
            console.log("❌ No user ID in session");
            return res.redirect('/auth/login');
        }

        // Запрос всех нужных полей
        const user = await User.findById(req.session.userId).select("username email role profilePicture");

        if (!user) {
            console.log("❌ User not found in DB");
            return res.redirect('/auth/login');
        }

        console.log("✅ User from DB:", user); // Проверка в консоли

        res.render('profile', { user });
    } catch (err) {
        console.error("🔥 Error in /profile route:", err);
        res.status(500).send("Server error");
    }
});


module.exports = router;
