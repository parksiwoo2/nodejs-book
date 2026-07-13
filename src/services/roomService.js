const Room = require("../models/roomModel");

const Book = require("../models/bookModel");

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
const joinRoom = async (roomid, user, inviteCode) => {
    
    const room = await Room.findById(roomid);

    if(!room) {
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

    if (inviteCode) {
        if (room.inviteCode !== inviteCode) {
            const error = new Error("잘못된 코드를 입력하셨습니다.");
            error.code = "INVITE_CODE_REQUIRED";
            error.status = 400;
            throw error;
        }
    }

    else {
        /*
        if (room.isPrivate) {
            const error = new Error("이 방은 초대코드가 있어야만 가입할 수 있습니다.");
            error.code = "INVITE_CODE_REQUIRED";
            error.status = 400;
            throw error;
        }
        */
    }

    room.member.push({
        _id: user.userId,
        name: user.userName
    });

    room.membersCount = room.member.length;

    await room.save();

    return room;
};


/* 전체방 목록 조회 Service
 * 개설된 모든 방을 최신순으로 조회합니다. 
 */
const getAllRoomList = async () => {
    const allRooms = await Room.find({}).sort({ createdAt: -1});

    return allRooms;
}

module.exports = {
    createRoom,
    joinRoom,
    getAllRoomList
};
