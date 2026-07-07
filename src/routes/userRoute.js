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

module.exports = router;
