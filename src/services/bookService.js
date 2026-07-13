const Book = require("../models/bookModel");

// code, statusCode를 담은 에러를 던진다 (bookReportService와 동일 패턴)
const throwError = (code, statusCode, message) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  throw error;
};

// 네이버 응답의 <b> 하이라이트 태그 + HTML 엔티티 제거
const cleanText = (str = "") =>
  str
    .replace(/<\/?b>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

const bookService = {
  /**
   * 책 검색 — 네이버 책 검색 API 프록시
   * 결과는 우리 DB에 저장하지 않는 후보 목록 (아직 _id 없음)
   */
  searchBooks: async ({ q, page = 1 }) => {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throwError(
        "EXTERNAL_API_ERROR",
        502,
        "네이버 API 키가 설정되지 않았습니다. (.env의 NAVER_CLIENT_ID/SECRET)"
      );
    }

    const display = 10;
    // 네이버는 page가 아니라 start(1-기반 인덱스)를 씀
    const start = (page - 1) * display + 1;
    const url =
      `https://openapi.naver.com/v1/search/book.json` +
      `?query=${encodeURIComponent(q)}&display=${display}&start=${start}`;

    let res;
    try {
      res = await fetch(url, {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret
        }
      });
    } catch (e) {
      throwError("EXTERNAL_API_ERROR", 502, "책 검색 API 호출에 실패했습니다.");
    }
    if (!res.ok) {
      throwError("EXTERNAL_API_ERROR", 502, "책 검색 API 호출에 실패했습니다.");
    }

    const body = await res.json();

    return {
      items: (body.items || []).map((item) => ({
        isbn: item.isbn,
        title: cleanText(item.title),
        author: cleanText(item.author).split("^").join(", "), // 공저자 ^ 구분 → 쉼표
        publisher: cleanText(item.publisher),
        thumbnail: item.image
      })),
      page,
      total: body.total || 0
    };
  },

  /**
   * 책 등록 — 동일 title+author가 이미 있으면 기존 문서 반환 (멱등)
   * 반환: { book, created } — created로 라우트가 201/200 구분
   */
  registerBook: async ({ title, author }) => {
    const existing = await Book.findOne({ title, author });
    if (existing) {
      return { book: existing, created: false };
    }
    const book = await Book.create({ title, author });
    return { book, created: true };
  }
};

module.exports = bookService;
