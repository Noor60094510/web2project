const express = require("express");
const router = express.Router();

const {
  signup,
  updateUser,
  getAllUsers,
  blockUser,
  addToContacts,
  removeContact,
  resetPasswordPage,
  resetPassword,
} = require("../controllers/user.controller.js");

const upload = require("../middleware/Multer.js");

// Register Routes
router.get("/register", (req, res) => {
  res.render("signup", { title: "Register" });
});
router.post("/register", upload.single("profile"), signup);

// Update User Routes
router.put("/update/:userId", upload.single("profile"), updateUser);

// Block User Route
router.post("/user/:userId", blockUser);

// Get All Users Route
router.get("/users", getAllUsers);

// Add/Remove Contacts Routes
router.put("/users/:id/add-contact", addToContacts);
router.post("/remove-contact/:loggedInUserId", removeContact);

// Reset Password Routes
router.get("/reset-password", resetPasswordPage); // Render reset password page
router.post("/reset-password", resetPassword); // Handle password reset request

module.exports = router;
