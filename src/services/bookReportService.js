const BookReport = require("../models/bookReportModel");
const Book = require("../models/bookModel");
const Room = require("../models/roomModel");
const mongoose = require("mongoose");

// code, statusCode를 담은 에러를 만들어 던진다. 라우트의 catch에서 그대로 응답으로 변환됨.
const throwError = (code, statusCode, message) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  throw error;
};

// 존재하지 않는 독후감 처리 (잘못된 ObjectId 형식 포함)
const findReportOrThrow = async (reportId) => {
  if (!mongoose.isValidObjectId(reportId)) {
    throwError("BOOK_REPORT_NOT_FOUND", 404, "존재하지 않는 독후감입니다.");
  }
  const report = await BookReport.findById(reportId);
  if (!report) {
    throwError("BOOK_REPORT_NOT_FOUND", 404, "존재하지 않는 독후감입니다.");
  }
  return report;
};

const bookReportService = {
  /**
   * 독후감 목록 조회 (페이지네이션)
   * 본문/댓글 배열은 빼고 요약 필드 + 댓글 개수만 반환
   */
  listReports: async ({ page = 1, limit = 10, roomId }) => {
    const skip = (page - 1) * limit;

    // roomId가 오면 그 방에서 작성된 독후감만
    const filter = {};
    if (roomId) {
      if (!mongoose.isValidObjectId(roomId)) {
        throwError("ROOM_NOT_FOUND", 404, "존재하지 않는 방입니다.");
      }
      filter["room._id"] = roomId;
    }

    const [reports, total] = await Promise.all([
      BookReport.find(filter)
        .sort({ createdDt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title book user room comments createdDt"),
      BookReport.countDocuments(filter)
    ]);

    const items = reports.map((r) => ({
      _id: r._id,
      title: r.title,
      book: r.book,
      user: r.user,
      room: r.room && r.room._id ? r.room : undefined,
      commentCount: r.comments.length,
      createdDt: r.createdDt
    }));

    return { items, page, limit, total };
  },

  // 독후감 상세 조회 (본문 + 댓글 전체 포함)
  getReport: async (reportId) => {
    return await findReportOrThrow(reportId);
  },

  /**
   * 독후감 작성
   * book은 bookId로 조회해서 title/author를 스냅샷으로 저장 (denormalized)
   * roomId가 오면: 방 멤버인지 확인 후 책은 방의 책으로 자동 지정, 방 스냅샷 저장
   */
  createReport: async ({ title, bookId, roomId, contents, user }) => {
    let roomSnapshot;

    if (roomId) {
      if (!mongoose.isValidObjectId(roomId)) {
        throwError("ROOM_NOT_FOUND", 404, "존재하지 않는 방입니다.");
      }
      const room = await Room.findById(roomId);
      if (!room) {
        throwError("ROOM_NOT_FOUND", 404, "존재하지 않는 방입니다.");
      }
      const isMember = (room.members || []).some(
        (m) => m._id && m._id.toString() === user._id.toString()
      );
      if (!isMember) {
        throwError("FORBIDDEN", 403, "방 멤버만 이 방에 독후감을 쓸 수 있습니다.");
      }
      bookId = room.book._id; // 방의 책으로 강제
      roomSnapshot = { _id: room._id, title: room.title };
    }

    if (!mongoose.isValidObjectId(bookId)) {
      throwError("BOOK_NOT_FOUND", 404, "존재하지 않는 도서입니다.");
    }
    const book = await Book.findById(bookId);
    if (!book) {
      throwError("BOOK_NOT_FOUND", 404, "존재하지 않는 도서입니다.");
    }

    const newReport = await BookReport.create({
      title,
      contents,
      book: {
        _id: book._id,
        title: book.title,
        author: book.author
      },
      user: {
        _id: user._id,
        name: user.name
      },
      ...(roomSnapshot && { room: roomSnapshot }),
      comments: []
    });

    return newReport;
  },

  // 독후감 수정 — 작성자만, title/contents만 가능
  updateReport: async ({ reportId, userId, title, contents }) => {
    const report = await findReportOrThrow(reportId);

    if (report.user._id.toString() !== userId.toString()) {
      throwError("FORBIDDEN", 403, "독후감 작성자만 수정할 수 있습니다.");
    }

    if (title !== undefined) report.title = title;
    if (contents !== undefined) report.contents = contents;

    return await report.save();
  },

  // 독후감 삭제 — 작성자만. 댓글은 임베드 배열이라 같이 삭제됨
  deleteReport: async ({ reportId, userId }) => {
    const report = await findReportOrThrow(reportId);

    if (report.user._id.toString() !== userId.toString()) {
      throwError("FORBIDDEN", 403, "독후감 작성자만 삭제할 수 있습니다.");
    }

    await report.deleteOne();
    return { _id: report._id };
  },

  // 댓글 작성
  addComment: async ({ reportId, user, content }) => {
    const report = await findReportOrThrow(reportId);

    report.comments.push({
      userId: user._id,
      writer: { _id: user._id, name: user.name },
      content
    });
    await report.save();

    const saved = report.comments[report.comments.length - 1];
    return {
      _id: saved._id,
      writer: saved.writer,
      content: saved.content,
      createdDt: saved.createdDt
    };
  },

  // 댓글 수정 — 댓글 작성자만, content만 가능
  updateComment: async ({ reportId, commentId, userId, content }) => {
    const report = await findReportOrThrow(reportId);

    const comment = report.comments.id(commentId);
    if (!comment) {
      throwError("COMMENT_NOT_FOUND", 404, "존재하지 않는 댓글입니다.");
    }
    if (comment.writer._id.toString() !== userId.toString()) {
      throwError("FORBIDDEN", 403, "댓글 작성자만 수정할 수 있습니다.");
    }

    comment.content = content;
    await report.save();

    return {
      _id: comment._id,
      writer: comment.writer,
      content: comment.content,
      createdDt: comment.createdDt
    };
  },

  // 댓글 삭제 — 댓글 작성자만
  deleteComment: async ({ reportId, commentId, userId }) => {
    const report = await findReportOrThrow(reportId);

    const comment = report.comments.id(commentId);
    if (!comment) {
      throwError("COMMENT_NOT_FOUND", 404, "존재하지 않는 댓글입니다.");
    }
    if (comment.writer._id.toString() !== userId.toString()) {
      throwError("FORBIDDEN", 403, "댓글 작성자만 삭제할 수 있습니다.");
    }

    comment.deleteOne();
    await report.save();

    return { _id: commentId };
  }
};

module.exports = bookReportService;
