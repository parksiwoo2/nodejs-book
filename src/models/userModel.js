const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nickname: {
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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
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

  userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
      return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });

  userSchema.methods.comparePassword = async function (plainPassword) {
    try {
      return await bcrypt.compare(plainPassword, this.password);
    }
    catch (err) {
      throw new Error(err);
    }
  };  

module.exports = mongoose.model('User', userSchema);
