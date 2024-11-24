const crypto = require("crypto");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

// Signup user
const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { name }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or Username already exists" });
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const userData = {
      name,
      email,
      password: hashedPassword,
      profile: req.file?.filename || null,
      contacts: [],
      blockedUsers: [],
      badges: [],
    };

    const newUser = await User.create(userData);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Error registering user", error });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Invalid email or password");
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
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
    console.error("Error Occured:", error);
    res.status(500).json({ message: "Internal server Error", error });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.params.userId;

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(req.file && { profile: `/images/${req.file.filename}` }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully!",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile: updatedUser.profile,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile", error });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.redirect("/");
  } catch (error) {
    console.log(error);
    console.log("error");
  }
};

// get all user
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    const usersProfile = users.map((user) => ({
      ...user._doc,
      profile: user.profile
        ? `/images/${user.profile}`
        : "/images/default-avatar.png",
    }));

    res.status(200).json(usersProfile);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// block user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params; // Logged-in user's ID
    const { blockedUserId } = req.body;
    console.log("userid", userId);
    if (userId === blockedUserId) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }
    const user = await User.findById(userId);
    console.log("user", user);
    const blockedUser = await User.findById(blockedUserId);
    if (!user || !blockedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.blockedUsers.includes(blockedUserId)) {
      return res.status(400).json({ message: "User is already blocked." });
    }
    // Add the blocked user
    user.blockedUsers.push(blockedUserId);
    await user.save();
    res
      .status(200)
      .json({
        message: "User blocked successfully.",
        blockedUsers: user.blockedUsers,
      });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Error blocking user", error });
  }
};
module.exports = { signup, login, logout, updateUser, getAllUsers, blockUser };
