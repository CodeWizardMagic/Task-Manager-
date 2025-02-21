const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(new LocalStrategy(
        { usernameField: 'username', passReqToCallback: true }, // добавляем passReqToCallback
        async (req, username, password, done) => {
            try {
                console.log("Введенный логин:", username);
                console.log("Введенный пароль:", password);

                const user = await User.findOne({ username });
                if (!user) return done(null, false, { message: 'Пользователь не найден' });

                console.log("Пароль из базы:", user.password);

                const isMatch = await bcrypt.compare(password, user.password);
                console.log("Совпадение пароля:", isMatch);

                if (!isMatch) return done(null, false, { message: 'Неверный пароль' });

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
};
