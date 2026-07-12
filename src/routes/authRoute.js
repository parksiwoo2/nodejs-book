const express = require("express");
const router = express.Router();
const { login } = require("../services/authService");

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    try {
      const { token, user } = await login(username, password);
      return res.status(200).json({ success: true, data: { token, user } });
    }
    catch (error) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;