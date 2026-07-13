const express = require('express');
const router = express.Router();
const readinglogService = require('../services/readinglogService');
const { checkAuth } = require('../middlewares/auth');

router.use(checkAuth);

// GET /api/readinglog — 로그인 유저의 독서 기록 조회
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const data = await readinglogService.getReadingLog(userId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Readinglog route error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch reading log'
    });
  }
});

module.exports = router;
