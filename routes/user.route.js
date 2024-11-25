const express = require("express");
const router = express.Router();

const { signup, updateUser, getAllUsers, blockUser } = require("../controllers/user.controller.js");
const upload = require("../middleware/Multer.js");
router.get("/register", (req, res) => {
  res.render("signup", { title: "Register" });
});


router.post("/register", upload.single("profile"), signup);
router.put("/update/:userId",  upload.single("profile"), updateUser);
router.post('/user/:userId', blockUser)
router.get('/users', getAllUsers);
module.exports = router;
