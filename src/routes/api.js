const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
const bookRankingRouter = require('./bookRankingRoute');

router.use('/main', mainRouter);
router.use('/book-ranking', bookRankingRouter);

const authRouter = require('./authRoute');
router.use('/login', authRouter);

const userRouter = require('./userRoute');
router.use('/users', userRouter);

const roomRouter = require('./roomRoute');
router.use('/room', roomRouter);

const bookReportRouter = require('./bookReportRoute');
router.use('/book-report', bookReportRouter);

const readingRouter = require('./readingRoute');
router.use('/reading', readingRouter);

const readinglogRouter = require('./readinglogRoute');
router.use('/readinglog', readinglogRouter);

module.exports = router;