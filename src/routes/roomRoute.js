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
 * 부원 가입 api
 * 최종 주소: POST /api/room/:roomid/join
 */
router.post("/:roomid/join", async (req, res) => {
    try {
        const { roomid } = req.params;
        const { inviteCode } = req.body;

        // 로그인된 유저 정보가 있다고 가정
        // 실제 구현 시에는 req.user._id 등에서 가져옴
        const userId = req.user ? req.user._id : "mockUserId123";

        const updatedRoom = await roomService.joinRoom(roomid, inviteCode, userId);

        //성공 (201 Created)
        return res.status(201).json({
            success: true,
            message: "방에 성공적으로 가입했습니다.",
            data:{
                Room: {
                    _id: updatedRoom._id,
                    title: updatedRoom._title,
                    master: updatedRoom.master, // { _id, name }
                    book: updatedRoom.book,     // { _id, title, author }
                    member: updatedRoom.member, // [ { _id, name } ]
                    memberCount: updatedRoom.memberCount
                }
            }
        });
    } catch (error) { 

        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                    message: error.message || "방 가입에 실패했습니다."
            }
        });
    }

}); 
 /* 방 목록 api
 * 최종 주소 : GET /api/room/list
 */
router.get("/list", async (req, res) => {
    try {
        const allRooms = await roomService.getAllRoomList();

        return res.status(200).json({
            success: true,
            rooms: allRooms
        });
    }

    catch (error) {
        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                    message: error.message || "방 목록 조회에 ."
            }
        });
    }

}); 

module.exports = router;