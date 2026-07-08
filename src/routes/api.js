const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
const bookRankingRouter = require('./bookRankingRoute');

router.use('/main', mainRouter);
router.use('/book-ranking', bookRankingRouter);

module.exports = router;