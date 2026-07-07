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

module.exports = {
    createRoom,
    getRoomDetail 
};