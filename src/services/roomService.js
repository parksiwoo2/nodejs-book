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

const joinRoom = async (roomId, inviteCode, userId) => {
    
    const room = await Room.findById(roomId);

    if(!room || room.inviteCode !== inviteCode) {
        const error = new Error("올바르지 않은 초대코드입니다.")
        error.code = "INVITECODE_NOT_FOUND";
        error.status = 400;
        throw error;
    }

    const isAlreadyMember = room.member.some(memberId => memberId.toString() === userId.toString());

    if(isAlreadyMember) {
        const error = new Error("이미 참여한 방입니다.");
        error.code = "ALREADY_JOINED_ROOM";
        error.status = 400;
        throw error;
    }

    room.member.push(userId);
    room.membercount = room.member.length;

    await room.save();

    const updatedRoom = await Room.findById(roomId)
        .populate("master", "name")           // master의 _id와 name
        .populate("book", "title author")     // book의 _id, title, author
        .populate("member", "name");          // member 배열 안의 _id와 name

    return updatedRoom;
};

module.exports = roomService, joinRoom;