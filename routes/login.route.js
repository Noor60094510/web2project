const express = require("express");
const router = express.Router();
const { login, logout } = require("../controllers/user.controller");

router.get("/", (req, res) => {
  res.render("login");
});
router.post('/login', login);
router.post('/logout',logout)
module.exports = router;
