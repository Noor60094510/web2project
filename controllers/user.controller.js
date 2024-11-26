const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user");

dotenv.config(); // Load environment variables

// Signup user
const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email or Username already exists" });
    }

    // Hash the password
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Default languages
    const defaultFluentLanguages = ["English"];
    const defaultLearningLanguages = ["Spanish", "French", "German", "Mandarin", "Japanese"];

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      profile: req.file?.filename || null,
      contacts: [],
      blockedUsers: [],
      badges: [],
      languagesFluentIn: defaultFluentLanguages,
      languagesLearning: defaultLearningLanguages,
    };

    // Create the new user
    const newUser = await User.create(userData);

    // Respond with success
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile,
        languagesFluentIn: newUser.languagesFluentIn,
        languagesLearning: newUser.languagesLearning,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Error registering user", error });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid email or password");
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (hashedPassword !== user.password) {
      return res.status(401).send("Invalid email or password");
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res.redirect("/profile");
  } catch (error) {
    console.error("Error occurred during login:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.redirect("/");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, selectedLanguage } = req.body;
    const userId = req.params.userId;

    // Validate email format
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if email is already in use
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle language updates
    if (selectedLanguage) {
      const validLanguages = [...user.languagesLearning, ...user.languagesFluentIn];
      if (!validLanguages.includes(selectedLanguage)) {
        return res.status(400).json({ message: "Invalid language selection" });
      }

      if (user.languagesLearning.includes(selectedLanguage)) {
        user.languagesLearning = user.languagesLearning.filter(lang => lang !== selectedLanguage);
        if (!user.languagesFluentIn.includes(selectedLanguage)) {
          user.languagesFluentIn.push(selectedLanguage);
        }
      } else {
        return res.status(400).json({
          message: "Selected language is not in your learning list",
        });
      }
    }

    // Update user fields
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(req.file && { profile: `/images/${req.file.filename}` }),
    };

    Object.assign(user, updateData);
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully!",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update profile", error });
  }
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const usersProfile = users.map(user => ({
      ...user._doc,
      profile: user.profile ? `/images/${user.profile}` : "/images/default-avatar.png",
    }));

    res.status(200).json(usersProfile);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { blockedUserId } = req.body;

    if (userId === blockedUserId) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const user = await User.findById(userId);
    const blockedUser = await User.findById(blockedUserId);

    if (!user || !blockedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.blockedUsers.includes(blockedUserId)) {
      return res.status(400).json({ message: "User is already blocked." });
    }

    user.blockedUsers.push(blockedUserId);
    await user.save();

    res.status(200).json({ message: "User blocked successfully." });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Add to contacts
const addToContacts = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactId } = req.body;

    if (id === contactId) {
      return res.status(400).json({ message: "You cannot add yourself as a contact." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.contacts.includes(contactId)) {
      return res.status(400).json({ message: "User is already in contacts." });
    }

    user.contacts.push(contactId);
    await user.save();

    res.status(200).json({ message: "Contact added successfully." });
  } catch (error) {
    console.error("Error adding to contacts:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Remove contact
const removeContact = async (req, res) => {
  try {
    const { loggedInUserId } = req.params;
    const { contactId } = req.body;

    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.contacts = user.contacts.filter(id => id.toString() !== contactId);
    await user.save();

    res.status(200).json({ message: "Contact removed successfully." });
  } catch (error) {
    console.error("Error removing contact:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Reset Password
const resetPasswordPage = (req, res) => {
  res.render("reset-password", { title: "Reset Password" });
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate passwords
    if (newPassword !== confirmPassword) {
      return res.status(400).render("reset-password", { 
        error: "Passwords do not match.", 
        title: "Reset Password" 
      });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render("reset-password", { 
        error: "User not found.", 
        title: "Reset Password" 
      });
    }

    // Hash and update the password
    const hashedPassword = crypto.createHash("sha256").update(newPassword).digest("hex");
    user.password = hashedPassword;
    await user.save();

    // Log to console
    console.log(`Password reset successful for email: ${email}`);

    // Redirect to login with success message
    res.render("login", { 
      success: `Password for ${email} has been reset successfully. Please log in.`,
      email,
      title: "Login" 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).render("reset-password", { 
      error: "Internal server error. Please try again later.", 
      title: "Reset Password" 
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  updateUser,
  getAllUsers,
  blockUser,
  addToContacts,
  removeContact,
  resetPasswordPage,
  resetPassword,
};
