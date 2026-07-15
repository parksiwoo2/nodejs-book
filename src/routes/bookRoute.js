const express = require("express");
const router = express.Router();
const bookService = require("../services/bookService");


// 서비스 에러 → 공통 에러 응답 (bookReportRoute와 동일 패턴)
const sendError = (res, error) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || "SERVER_ERROR",
      message: error.message
    }
  });
};

/**
 * 책 검색 (네이버 프록시)
 * 최종 주소: GET /api/book/search?q=검색어&page=1
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "검색어(q)는 필수입니다."
        }
      });
    }

    const data = await bookService.searchBooks({ q: q.trim(), page });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 등록된 책 목록 조회 (DB)
 * 최종 주소: GET /api/book
 */
router.get("/", async (req, res) => {
  try {
    const books = await bookService.listBooks();
    return res.status(200).json({
      success: true,
      data: {
        books
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 책 등록 (검색 결과에서 선택한 책을 DB에 저장, title+author 중복 시 기존 반환)
 * 최종 주소: POST /api/book
 */
router.post("/", async (req, res) => {
  try {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "제목과 저자는 필수 입력값입니다."
        }
      });
    }

    const { book, created } = await bookService.registerBook({ title, author });
    return res.status(created ? 201 : 200).json({ success: true, data: book });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
