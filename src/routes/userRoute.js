const express = require('express');
const router = express.Router();
const { userService } = require('../services/userService');

router.post('/', async (req, res) => {
  const { nickname, username, password } = req.body;
  if (!username || !password || !nickname) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const user = await userService.createUser({ nickname, username, password });
    return res.status(201).json({ success: true, data: user });
  }
  catch (err) {
    if (err.message === 'Username already exists') {
      return res.status(409).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
      const user = await userService.getUserById(req.query.id);
      return res.json({ success: true, data: user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
})

router.patch('/me', async (req, res) => {
  const { id, updateData } = req.body;
  if (!id || !updateData) {
    return res.status(400).json({ success: false, message: 'User ID and update data are required' });
  }
  try {
    const updatedUser = await userService.updateUser(id, updateData);
    return res.json({ success: true, data: updatedUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/me', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  try {
    const deletedUser = await userService.deleteUser(id);
    return res.json({ success: true, data: deletedUser });
  }
  catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
