const passport = require('passport');

const checkAuth = passport.authenticate('jwt', { session: false });

module.exports = { checkAuth };