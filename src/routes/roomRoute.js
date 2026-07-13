const express = require("express");
const router = express.Router();
const { createRoom, joinRoom, leaveRoom, getAllRoomList} = require("../services/roomService");

const { checkAuth } = require("../middlewares/auth");
/*
 * 방 생성 API 
 * 최종 주소: POST /api/room
 */
router.post("/", checkAuth, async (req, res) => {
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

    // 2단계 서비스 레이어 호출
    const savedRoom = await createRoom({
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
 * 방탈퇴 api
 * 최종 주소: DELETE /api/room/:roomid/leave
 */

router.delete("/:roomid/leave", checkAuth, async (req, res) => {
    try {
        const { roomid } = req.params;

        const userid = req.user ? req.user._id : "mockUserId1234";

        await leaveRoom(roomid, userid);

        return res.status(200).json({
            success: true, 
            message: "성공적으로 방을 나갔습니다."
        });

    } catch (error) {

        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                message: error.message || "방 탈퇴에 실패했습니다."
            }
        });

    }
});

/*
 * 방 상세 조회 api
 * 최종 주소 : GET /api/room/:roomid
 */
router.get("/:roomid", async (req, res) => {
    try {
        const { roomid } = req.params;

        const userId = req.user ? req.user._id : "mockUserId123";

        const roomData = await getRoomDetail(roomid, userId);

        return res.status(200).json({
            success: true,
            Room: roomData
        });
    } catch (error) {
        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                message: error.message || "방 상세 조회에 실패했습니다."
            }
        });
    }
});
/*
 * 부원 가입 api
 * 최종 주소: POST /api/room/:roomid/join
 */
router.post("/:roomid/join", checkAuth, async (req, res) => {
    try {
        const { roomid } = req.params;
        const userId = req.user._id;

        const result = await joinRoom({ roomid, userId });

        //성공 (201 Created)
        res.status(200).json(result);
    } catch (error) {
        // 이미 가입되었거나 방이 없을 때의 에러 메시지를 프론트로 전달
        res.status(error.statusCode || 500).json({ message: error.message });
        }
});


/* 
 * 방 목록 api
 * 최종 주소 : GET /api/room/list
 */
router.get("/list", checkAuth, async (req, res) => {
    try {
        const Rooms = await getAllRoomList();

        return res.status(200).json({
            success: true,
            rooms: Rooms
        });
    }

    catch (error) {
        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                message: error.message || "방 목록 조회에 실패했습니다."
            }
        });
        res.status(error.statusCode || 500).json({ message: error.message });
    }
});

module.exports = router;