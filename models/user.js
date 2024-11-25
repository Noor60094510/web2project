const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    messagesSent:{ type: Number, default: 0 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { type: String }, 
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    badges: [{ type: String }],
  },
 
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);