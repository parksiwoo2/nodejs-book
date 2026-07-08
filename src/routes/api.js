const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

const readingRouter = require('./readingRoute');
router.use('/reading', readingRouter);

module.exports = router;