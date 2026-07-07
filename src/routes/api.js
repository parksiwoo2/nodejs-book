const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

const roomRouter = require('./roomRoute');
router.use('/room', roomRouter);

const bookReportRouter = require('./bookReportRoute');
router.use('/book-report', bookReportRouter);

module.exports = router;