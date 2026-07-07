const express = require("express");
const router = express.Router();
const roomService = require("../services/roomService");

/**
 * 방 생성 API 
 * 최종 주소: POST /api/room
 */
router.post("/", async (req, res) => {
    try {
    const { title, bookid } = req.body;

    // 실패 대응 (400 Bad Request) - 필수 인자 누락
    if (!title || !bookid) {
        return res.status(400).json({
        success: false,
        error: {
            code: "INVALID_INPUT",
            message: "방을 생성하려면 책 정보와 제목이 필요합니다."
        }
        });
    }

    // 임시 테스트용 유저 데이터 주입
    const mockUser = {
        _id: "65e000000000000000000001", 
        name: "테스트방장"
    };

    // 2단계 서비스 레이어 호출
    const savedRoom = await roomService.createRoom({
        title,
        bookId: bookid,
        user: mockUser
    });

    // 성공 응답 (201 Created)
    return res.status(201).json({
        success: true,
        message: "성공적으로 방을 생성했습니다.",
        data: {
        Room: savedRoom
        }
    });

    } catch (error) {
    // 서비스에서 발생한 에러(BOOK_NOT_FOUND 등) 처리
    return res.status(error.status || 500).json({
        success: false,
        error: {
        code: error.code || "SERVER_ERROR",
        message: error.message
        }
    });
    }
});

/**
 * 방 목록 api
 * 최종 주소 : GET /api/room/list
 */
router.get("/list", async (req, res) => {
    try {
        const userId = req.user ? req.user._id : "mockUserId123";

        const roomList = await roomService.getRoomList(userId);

        return res.status(200).json({
            success: true,
            rooms: roomList
        });
    }

    catch (error) {
        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                message: error.message || "방 목록을 불러오는데 실패했습니다."
            }
        });
    }
});

module.exports = router;