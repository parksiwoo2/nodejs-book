const Room = require("../models/Room");

const Book = require("../models/Book");

const roomService = {
    createRoom: async ({ title, bookId, user }) => {

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
    }
};
/**
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
    module.exports = {
      createRoom,
      leaveRoom
    };