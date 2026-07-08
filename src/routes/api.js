const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
const bookRankingRouter = require('./bookRankingRoute');

router.use('/main', mainRouter);
router.use('/book-ranking', bookRankingRouter);

const authRouter = require('./authRoute');
router.use('/login', authRouter);

const registerRouter = require('./userRoute');
router.use('/register', registerRouter);

const roomRouter = require('./roomRoute');
router.use('/room', roomRouter);

const bookReportRouter = require('./bookReportRoute');
router.use('/book-report', bookReportRouter);

module.exports = router;