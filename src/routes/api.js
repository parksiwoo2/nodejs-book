const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

module.exports = router;