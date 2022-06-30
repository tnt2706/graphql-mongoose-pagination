const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: String,
  firstName: String,
  lastName: String,
  photo: String,
  height: Number,
  weight: Number,
  dateOfBirth: { type: Date, index: -1 },
  activity: { type: Number, index: -1 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('user', UserSchema);
