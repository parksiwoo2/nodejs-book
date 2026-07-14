const express = require("express");
const router = express.Router();
const bookReportService = require("../services/bookReportService");
const { checkAuth } = require("../middlewares/auth");

// 독후감 API 전체가 유저 권한 필요 — JWT 토큰 검증 후 req.user에 유저 정보 주입
router.use(checkAuth);

// User 모델에 name 필드가 없어 nickname을 name 스냅샷으로 사용
const toUserSnapshot = (user) => ({ _id: user._id, name: user.nickname });

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
 * 독후감 목록 조회 (roomId를 주면 그 방에서 작성된 독후감만)
 * 최종 주소: GET /api/book-report?page=1&limit=10&roomId=xxx
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { roomId } = req.query;
    const data = await bookReportService.listReports({ page, limit, roomId });
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
    const { title, bookId, roomId, contents } = req.body;

    // 방 독후감(roomId)이면 책은 방의 책으로 자동 지정되므로 bookId 생략 가능
    if (!title || !contents || (!bookId && !roomId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "제목, 책(또는 방), 내용은 필수 입력값입니다."
        }
      });
    }

    const report = await bookReportService.createReport({
      title,
      bookId,
      roomId,
      contents,
      user: toUserSnapshot(req.user)
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
      userId: req.user._id,
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
      userId: req.user._id
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
      user: toUserSnapshot(req.user),
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
      userId: req.user._id,
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
      userId: req.user._id
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
