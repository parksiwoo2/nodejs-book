require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`🟢 MongoDB 아틀라스 클러스터 연결 성공!`);
    console.log(`🔗 Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🔴 MongoDB 연결 실패: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;