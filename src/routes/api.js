const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

const authRouter = require('./authRoute');
router.use('/login', authRouter);

const userRouter = require('./userRoute');
router.use('/users', userRouter);

const roomRouter = require('./roomRoute');
router.use('/room', roomRouter);

const bookReportRouter = require('./bookReportRoute');
router.use('/book-report', bookReportRouter);

module.exports = router;