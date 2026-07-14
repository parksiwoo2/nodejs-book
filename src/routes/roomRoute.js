const express = require("express");
const router = express.Router();
const { 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    getAllRoomList, 
    getRoomDetail, 
    deleteRoom
} = require("../services/roomService");

const checkAuth = require("../middlewares/checkAuth");
/*
 * 방 생성 API 
 * 최종 주소: POST /api/room
 */
router.post("/", checkAuth, async (req, res) => {
    try {
    const { title, bookId } = req.body;

    // 실패 대응 (400 Bad Request) - 필수 인자 누락
    if (!title || !bookId) {
        return res.status(400).json({
        success: false,
        error: {
            code: "INVALID_INPUT",
            message: "방을 생성하려면 책 정보와 제목이 필요합니다."
        }
        });
    }

    const savedRoom = await createRoom({
        title,
        bookId,
        user: req.user
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
    return res.status(error.status || error.statusCode || 500).json({
        success: false,
        error: {
        code: error.code || "SERVER_ERROR",
        message: error.message
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

        const updatedRoom = await joinRoom(roomid, req.user);

        return res.status(201).json({
            success: true,
            message: "방에 성공적으로 가입했습니다.",
            data: {
                Room: updatedRoom
            }
        });
    } catch (error) {
        const statusCode = error.status || error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "SERVER_ERROR",
                message: error.message || "방 가입에 실패했습니다."
            }
        });
    }
});

/*
 * 방 폭파(삭제) api
 * 최종 주소 : DELETE /api/room/:roomid
 */

router.delete("/:roomid", checkAuth, async (req, res) => {
    try {
        const { roomid } = req.params;
        const userId = req.user._id;
        
        await deleteRoom(roomid, userId);

        return res.status(200).json({
            success: true,
            message: "성공적으로 방이 삭제되었습니다."
        });
    } catch (error) {
        const statusCode = error.status || 400;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "BAD_REQUEST",
                message: error.message || "방 삭제에 실패했습니다."
            }
        });
    }
});

/*
 * 방탈퇴 api
 * 최종 주소: DELETE /api/room/:roomid/leave
 */

router.delete("/:roomid/leave", checkAuth, async (req, res) => {
    try {
        const { roomid } = req.params;
        const userid = req.user._id;

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
 * 방 목록 api
 * 최종 주소 : GET /api/room/list
 */
router.get("/list", checkAuth, async (req, res) => {
    try {
        const rooms = await getAllRoomList();

        return res.status(200).json({
            success: true,
            rooms
        });
    } catch (error) {
        const statusCode = error.status || error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            error: {
                code: error.code || "SERVER_ERROR",
                message: error.message || "방 목록 조회에 실패했습니다."
            }
        });
    }
});

/*
 * 방 상세 조회 api
 * 최종 주소 : GET /api/room/:roomid
 */
router.get("/:roomid", checkAuth, async (req, res) => {
    try {
        const { roomid } = req.params;

        const userId = req.user._id;

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


module.exports = router;