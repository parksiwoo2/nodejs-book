const express = require('express');
const router = express.Router();
const readingService = require('../services/readingTimeService');

router.post('/timer', async (req, res) => {
  try {
    const { userId, bookId, bookTitle, readingTime } = req.body;

    // 파라미터 검증
    if (!userId || !bookId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 서비스 로직 호출
    const result = await readingService.recordTime(userId, bookId, bookTitle, readingTime);
    
    // 성공 응답 전송
    res.status(200).json(result);
  } catch (error) {
    console.error('Reading route error:', error);
    res.status(500).json({ error: 'Failed to record reading time', details: error.message });
  }
});

module.exports = router;
