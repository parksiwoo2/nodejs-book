const express = require('express');
const router = express.Router();

const mainRouter = require('./mainRoute');
router.use('/main', mainRouter);

const authRouter = require('./authRoute');
router.use('/login', authRouter);

module.exports = router;