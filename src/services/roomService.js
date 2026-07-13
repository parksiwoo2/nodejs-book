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
                id: user._id,
                name: user.name,
            },
            book: {
                id: targetbook._id,
                title: targetbook.title,
                author: targetbook.author
            }, 
            members: [{
                id: user._id,
                name: user.name,
            }],
            membersCount: 1
        });
        
        return await newRoom.save();
    };

/*
 * @param {String} roomId 
 * @param {String} inviteCode 
 * @param {Object} userId 
 * @returns 
 */
const joinRoom = async (roomid, userid) => {
    
    const room = await Room.findById(roomid);

    if(!room) {
        const error = new Error("존재하지 않는 방입니다.")
        error.code = "INVITECODE_NOT_FOUND";
        error.status = 404;
        throw error;
    }

    const isAlreadyMember = room.member.some(memberId => memberId.toString() === userid.toString());
    if(isAlreadyMember) {
        const error = new Error("이미 참여한 방입니다.");
        error.code = "ALREADY_JOINED_ROOM";
        error.status = 400;
        throw error;
    }

    room.member.push({ userId: userid });
    await room.save();

    return {
        success: true,
        roomId: room._id,
        roomTitle: room.title,
    }
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

const getRoomDetail = async (roomid, userId) => {

    const room = await Room.findById(roomid);

    if (!room) {
        const error = new Error("존재하지 않는 방입니다.")
        error.code = "ROOM_NOT_FOUND";
        error.status = 400;
        throw error;
    }

    const isMember = room.members.some(m => m.id.toString() === userId.toString());
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
    const Rooms = await Room.find({}).sort({ createdAt: -1 }).select('_id title master book members membersCount createdAt updatedAt');

    return Rooms;
}

module.exports = {
    createRoom,
    getRoomDetail,
    leaveRoom,
    joinRoom,
    getAllRoomList
};
