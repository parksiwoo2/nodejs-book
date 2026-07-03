const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  master: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String
    }
  },
  book: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    title: {
      type: String
    },
    author: {
      type: String
    }
  },
  members: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String
      }
    }
  ],
  memberCount: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);