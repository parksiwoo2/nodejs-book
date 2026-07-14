const User = require('../models/userModel');

const UserService = {
  async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    }
    catch (error) {
      if (error.code === 11000) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  },

  async updateUser(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { returnDocument: 'after' });
  },

  async getUserById(userId) {
    return await User.findById(userId);
  },

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }
}

module.exports = { userService: UserService };
