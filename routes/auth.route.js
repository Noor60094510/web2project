const express = require("express");
const router = express.Router();
const {
  authenticateUser,
} = require("../controllers/auth.controller");

router.get("/profile", authenticateUser, (req, res) => {
  const userId = req.user._id;
  res.render("profile", { user: req.user, userId });
});


router.get("/dashboard",(req,res)=>{
  res.render("dashboard");
})


module.exports = router;
