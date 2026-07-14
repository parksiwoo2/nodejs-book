const express = require('express');
const router = express.Router();
const readingService = require('../services/readingTimeService');

router.post('/', async (req, res) => {
  try {
    const { bookId, readingTime } = req.body;
    const userId = req.user._id;

    if (!bookId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (readingTime === undefined || readingTime === null || Number(readingTime) <= 0) {
      return res.status(400).json({ error: 'Reading time must be greater than 0' });
    }

    const result = await readingService.recordTime(userId, bookId, Number(readingTime));

    res.status(200).json(result);
  } catch (error) {
    console.error('Reading route error:', error);
    res.status(500).json({ error: 'Failed to record reading time', details: error.message });
  }
});

module.exports = router;
