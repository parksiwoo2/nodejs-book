const express = require("express");
const router = express.Router();
const bookReportService = require("../services/bookReportService");

/**
 * 임시 테스트용 유저 (roomRoute와 동일한 방식)
 * TODO: 로그인 PR(#5) 병합 후 auth 미들웨어의 req.user로 교체
 */
const mockUser = {
  _id: "65e000000000000000000001",
  name: "테스트유저"
};

// 서비스에서 던진 에러를 공통 에러 응답으로 변환
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
 * 독후감 목록 조회
 * 최종 주소: GET /api/book-report?page=1&limit=10
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await bookReportService.listReports({ page, limit });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 독후감 작성
 * 최종 주소: POST /api/book-report
 */
router.post("/", async (req, res) => {
  try {
    const { title, bookId, contents } = req.body;

    if (!title || !bookId || !contents) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "제목, 책, 내용은 필수 입력값입니다."
        }
      });
    }

    const report = await bookReportService.createReport({
      title,
      bookId,
      contents,
      user: mockUser
    });
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 독후감 상세 조회
 * 최종 주소: GET /api/book-report/:reportId
 */
router.get("/:reportId", async (req, res) => {
  try {
    const report = await bookReportService.getReport(req.params.reportId);
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 독후감 수정 (작성자만)
 * 최종 주소: PATCH /api/book-report/:reportId
 */
router.patch("/:reportId", async (req, res) => {
  try {
    const { title, contents } = req.body;

    if (title === undefined && contents === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "수정할 내용(title 또는 contents)이 필요합니다."
        }
      });
    }

    const report = await bookReportService.updateReport({
      reportId: req.params.reportId,
      userId: mockUser._id,
      title,
      contents
    });
    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 독후감 삭제 (작성자만, 댓글도 함께 삭제)
 * 최종 주소: DELETE /api/book-report/:reportId
 */
router.delete("/:reportId", async (req, res) => {
  try {
    const data = await bookReportService.deleteReport({
      reportId: req.params.reportId,
      userId: mockUser._id
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 댓글 작성
 * 최종 주소: POST /api/book-report/:reportId/comments
 */
router.post("/:reportId/comments", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "댓글 내용은 필수 입력값입니다."
        }
      });
    }

    const comment = await bookReportService.addComment({
      reportId: req.params.reportId,
      user: mockUser,
      content
    });
    return res.status(201).json({ success: true, data: comment });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 댓글 수정 (댓글 작성자만)
 * 최종 주소: PATCH /api/book-report/:reportId/comments/:commentId
 */
router.patch("/:reportId/comments/:commentId", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "수정할 댓글 내용이 필요합니다."
        }
      });
    }

    const comment = await bookReportService.updateComment({
      reportId: req.params.reportId,
      commentId: req.params.commentId,
      userId: mockUser._id,
      content
    });
    return res.status(200).json({ success: true, data: comment });
  } catch (error) {
    return sendError(res, error);
  }
});

/**
 * 댓글 삭제 (댓글 작성자만)
 * 최종 주소: DELETE /api/book-report/:reportId/comments/:commentId
 */
router.delete("/:reportId/comments/:commentId", async (req, res) => {
  try {
    const data = await bookReportService.deleteComment({
      reportId: req.params.reportId,
      commentId: req.params.commentId,
      userId: mockUser._id
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
