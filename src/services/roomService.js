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
 * 
 * 전체방 목록 조회 Service
 * 개설된 모든 방을 최신순으로 조회합니다. 
 */
const getAllRoomList = async () => {
    const allRooms = await Room.find({}).sort({ createdAt: -1});

    return allRooms;
}

module.exports = {
    createRoom,
    getAllRoomList
};