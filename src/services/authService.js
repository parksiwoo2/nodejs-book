const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.login = async (username, password) => {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid username or password');
    }
    const payload = { id: user.id};
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return { token: 'Bearer ' + token, user };
  };