const mongoose = require('mongoose');

const bookReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
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
  user: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String
    }
  },
  // 독서 모임(방)에서 쓴 독후감이면 방 스냅샷 저장 (일반 독후감은 없음)
  room: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    title: {
      type: String
    }
  },
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      writer: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        name: {
          type: String,
          required: true
        }
      },
      content: {
        type: String,
        required: true
      },
      createdDt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  contents: {
    type: String,
    required: true
  },
  createdDt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('BookReport', bookReportSchema);
