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

<<<<<<< HEAD
const readinglogRouter = require('./readinglogRoute');
router.use('/readinglog', readinglogRouter);
=======
const bookRouter = require('./bookRoute');
router.use('/book', bookRouter);
>>>>>>> 10140eb (feat: 책 검색(네이버)API 구현)

module.exports = router;