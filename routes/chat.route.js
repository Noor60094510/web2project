const express = require("express");
const router = express.Router();
const {
  sendChat,
  getChat,
  deleteChat,
  chatPage,
} = require("../controllers/chat.controller");
const { authenticateUser } = require("../controllers/auth.controller");
router.get("/chat", authenticateUser, chatPage);
router.post("/send/:senderId", sendChat);
router.get("/messages/:loggedInUserId/:selectedUserId", getChat);
router.delete("/delete/:messageId", deleteChat);
module.exports = router;
