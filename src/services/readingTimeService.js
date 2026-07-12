const User = require('../models/userModel');

const recordTime = async (userId, bookId, bookTitle, readingTime) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 유저의 전체 총 독서 시간(totalReadingTime) 업데이트
    user.totalReadingTime = (user.totalReadingTime || 0) + readingTime;

    // 새로운 독서 세션 기록을 생성합니다.
    const newLogEntry = {
      bookId,
      bookTitle,
      readingTime
    };

    // 유저의 readinglog 배열에 이번 독서 기록 추가
    user.readinglog.push(newLogEntry);
    
    // 변경된 유저 정보를 데이터베이스에 저장합니다.
    await user.save();
    
    return { success: true, message: 'Reading time recorded successfully', newLogEntry };
  } catch (error) {
    console.error('Error in recordTime service:', error);
    throw error;
  }
};

module.exports = {
  recordTime
};
