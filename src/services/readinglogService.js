const User = require('../models/userModel');

const getReadingLog = async (userId) => {
  const user = await User.findById(userId).select('readinglog totalReadingTime');

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  return {
    readinglog: user.readinglog || [],
    totalReadingTime: user.totalReadingTime || 0
  };
};

module.exports = {
  getReadingLog
};
