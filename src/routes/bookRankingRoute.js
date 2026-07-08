const express = require("express");
const router = express.Router();

const { getBookRanking } = require("../services/bookRankingService");

router.get("/", async (req, res) => {
  try {
    const { period, page, limit } = req.query;

    const result = await getBookRanking(period, page, limit);

    res.status(200).json({
      success: true,
      BookRanking: result
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: err.message
      }
    });
  }
});

module.exports = router;