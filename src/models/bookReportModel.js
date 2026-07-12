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
