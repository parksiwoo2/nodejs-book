const Main = require("../models/mainModel");

const mainService = {
  async createMain(data) { 
    const newMain = new Main(data);
    return await newMain.save();
  },

  async getAllMains() {
    return await Main.find().sort({ createdAt: -1 });
  }
};

module.exports = { mainService };