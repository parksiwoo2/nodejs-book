const express = require("express");
const router = express.Router();
const { mainService } = require("../services/mainService");

router.get('/', async (req, res) => {
  try {
    const list = await mainService.getAllMains();
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, content} = req.body;
    if (!name || !content) {
      return res.status(400).json({ success: false, message: 'Name and content are required' });
    }

    const result = await mainService.createMain({ name, content });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;