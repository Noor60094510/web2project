const Chat = require("../models/chat");
const User = require("../models/user");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

const sendChat = async (req, res) => {
  try {
    const { senderId } = req.params;
    const { receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Check if the sender has blocked the receiver
    const sender = await User.findById(senderId);
    if (sender.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ message: "You have blocked this user." });
    }
    // Check if the receiver has blocked the sender
    const receiver = await User.findById(receiverId);
    if (receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({ message: "You are blocked by this user." });
    }

    const newMessage = new Chat({
      senderId,
      receiverId,
      message,
      createdAt: new Date(),
    });
    await newMessage.save();

    sender.messagesSent = (sender.messagesSent || 0) + 1;
    if (sender.messagesSent === 50 && !sender.badges.includes("premium")) {
      sender.badges.push("silver");
    }
    await sender.save();

    res.status(201).json({
      message: "Message sent successfully",
      newMessage,
      updatedSender: {
        id: sender._id,
        name: sender.name,
        badges: sender.badges,
        messagesSent: sender.messagesSent,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending message", error });
  }
};

const getChat = async (req, res) => {
  const { loggedInUserId, selectedUserId } = req.params;
  try {
    const messages = await Chat.find({
      $or: [
        { senderId: loggedInUserId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: loggedInUserId },
      ],
    })
      .populate("senderId", "name profile")
      .populate("receiverId", "name profile")
      .sort("createdAt");

    res.json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving messages", error });
  }
};
