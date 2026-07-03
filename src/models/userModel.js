const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  Room: [
    {
      _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
      },
      title: {
        type: String
      },
    } 
  ],
  password: {
    type: String,
    required: true,
  },
  readinglog: [
    {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
      },
      bookTitle: {
        type: String
      },
      readingTime: {
        type: Number,
        default: 0
      },
      readDt: {
        type: Date,
        default: Date.now
      },
      totalReadingTime: {
        type: Number,
        default: 0
      }
    }
  ]
  }, { timestamps: true });

module.exports = mongoose.model('User', userSchema);