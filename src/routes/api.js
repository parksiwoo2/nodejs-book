const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

const readingRouter = require('./readingRoute');
router.use('/reading', readingRouter);

const authRouter = require('./authRoute');
router.use('/login', authRouter);

const registerRouter = require('./userRoute');
router.use('/register', registerRouter);

const roomRouter = require('./roomRoute');
router.use('/room', roomRouter);

const bookReportRouter = require('./bookReportRoute');
router.use('/book-report', bookReportRouter);

const readingRouter = require('./readingRoute');
router.use('/reading', readingRouter);

module.exports = router;