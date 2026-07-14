const express = require('express');
const router = express.Router();
const { checkAuth } = require('../middlewares/auth');



const authRouter = require('./authRoute');
router.use('/login', authRouter);

const userRouter = require('./userRoute');
router.use('/users', userRouter);

router.use(checkAuth);

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

const bookRankingRouter = require('./bookRankingRoute');
router.use('/book-ranking', bookRankingRouter);

const roomRouter = require('./roomRoute');
router.use('/room', roomRouter);

const bookReportRouter = require('./bookReportRoute');
router.use('/book-report', bookReportRouter);

const readingRouter = require('./readingRoute');
router.use('/reading', readingRouter);

const readinglogRouter = require('./readinglogRoute');
router.use('/readinglog', readinglogRouter);

const bookRouter = require('./bookRoute');
router.use('/book', bookRouter);

module.exports = router;