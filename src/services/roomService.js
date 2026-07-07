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

const getRoomList = async (userId) => {
    const myRooms = await Room.find({
        "members.id": userId
    }).sort({ createdAt: -1});

    return myRooms;
}

module.exports = {
    createRoom,
    getRoomList
};