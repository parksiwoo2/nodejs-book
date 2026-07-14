const Room = require("../models/roomModel");

const Book = require("../models/bookModel");

/*
 *방생성 
 */

const createRoom = async ({ title, bookId, user }) => {

        const targetbook = await Book.findById(bookId);

        if (!targetbook) {
            const error = new Error("해당 책이 존재하지 않습니다.");
            error.code = "NOT_FOUND";
            error.statusCode = 400;
            throw error;
        }

        const newRoom = await Room.create({
            title,
            master: {
                _id: user._id,
                name: user.nickname,
            },
            book: {
                _id: targetbook._id,
                title: targetbook.title,
                author: targetbook.author
            },
            members: [{
                _id: user._id,
                name: user.nickname,
            }],
            memberCount: 1
        });

        return newRoom;
    };

/**
 * 방 가입
 * @param {String} roomId
 * @param {Object} user - JWT 인증된 User 문서 (_id, nickname 등)
 */
const joinRoom = async (roomId, user) => {
    const room = await Room.findById(roomId);

    if (!room) {
        const error = new Error("존재하지 않는 방입니다.");
        error.code = "ROOM_NOT_FOUND";
        error.status = 404;
        error.statusCode = 404;
        throw error;
    }

    const userId = user._id.toString();
    const isAlreadyMember = room.members.some(
        (member) => member._id && member._id.toString() === userId
    );

    if (isAlreadyMember) {
        const error = new Error("이미 참여한 방입니다.");
        error.code = "ALREADY_JOINED_ROOM";
        error.status = 400;
        error.statusCode = 400;
        throw error;
    }

    room.members.push({
        _id: user._id,
        name: user.nickname
    });
    room.memberCount = room.members.length;

    await room.save();

    return {
        _id: room._id,
        title: room.title,
        master: room.master,
        book: room.book,
        members: room.members,
        memberCount: room.memberCount
    };
};

/*
 * 방 탈퇴 Service
 */
const leaveRoom = async ( roomId, userId ) => {

    const room = await Room.findById(roomId);

    if (!room) {
        const error = new Error("존재하지 않는 방입니다.");
        error.code = "ROOM_NOT_FOUND";
        error.status = 400;
        throw error;
    }

    const isMember = room.members.some(memberId => memberId.toString() === userId.toString());
    if (!isMember) {
        const error = new Error("참여하고 있지 않은 방입니다.");
        error.code = "NOT_A_MEMBER";
        error.status = 400;
        throw error;
    }
    
    room.member = room.members.filter(memberId => memberId.toString() !== userId.toString());

    room.membersCount = room.member.length;

    await room.save();

    return true;
    };

/**
 * 방 삭제 Service
 * @param {String} roomid 
 * @param {String} userId 
 * @returns 
 */
const deleteRoom = async (roomid, userId) => {

    const room= await Room.findById(roomid)

    if(!room) {
        const error = new Error("존재하지 않는 방입니다.");
        error.code = "ROOM_NOT_FOUND";
        error.status = 400;
        throw error;
    }

    if (room.master.id.toString() !== userId.toString()) {
        const error = new Error("방장만 방을 삭제할 수 있습니다.");
        error.code = "NOT_A_MASTER";
        error.status = 400;
        throw error;
    }

    await Room.findByIdAndDelete(roomid);

    return true;
};

/**
 * 방 상세 정보 조회 Service
 * @param {String} roomId 
 * @param {String} userId 
 * @returns 
 */    
const getRoomDetail = async (roomId, userId) => {

    const room = await Room.findById(roomId);

    if (!room) {
        const error = new Error("존재하지 않는 방입니다.")
        error.code = "ROOM_NOT_FOUND";
        error.status = 400;
        throw error;
    }

    const isMember = room.members.some(m => m._id.toString() === userId.toString());
    if (!isMember) {
        const error = new Error("해당 방에 참여하지 않았습니다.")
        error.code = "FORBIDDEN";
        error.status = 400;
        throw error;
    }

    return room;
};

/*
 * 전체방 목록 조회 Service
 * 개설된 모든 방을 최신순으로 조회합니다. 
 */
const getAllRoomList = async () => {
    return await Room.find({})
        .sort({ createdAt: -1 })
        .select('_id title master book members memberCount createdAt updatedAt');
};

module.exports = {
    createRoom,
    deleteRoom,
    getRoomDetail,
    leaveRoom,
    joinRoom,
    getAllRoomList
};
