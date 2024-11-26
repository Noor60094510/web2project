const crypto = require("crypto");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

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
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

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

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
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
    const { name, email, selectedLanguage } = req.body;
    const userId = req.params.userId;

    // Input validation
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    // Check if email already exists for another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare the fields to be updated
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(req.file && { profile: `/images/${req.file.filename}` }),
    };

    // Handle language movement
    if (selectedLanguage) {
      // Validate if the language exists in our system
      const validLanguages = [...user.languagesLearning, ...user.languagesFluentIn];
      if (!validLanguages.includes(selectedLanguage)) {
        return res.status(400).json({ 
          message: "Invalid language selection" 
        });
      }

      // Move language from learning to fluent
      if (user.languagesLearning.includes(selectedLanguage)) {
        // Remove from learning languages
        user.languagesLearning = user.languagesLearning.filter(
          lang => lang !== selectedLanguage
        );

        // Add to fluent languages if not already present
        if (!user.languagesFluentIn.includes(selectedLanguage)) {
          user.languagesFluentIn.push(selectedLanguage);
        }

        // Sort languages alphabetically for better UI presentation
        user.languagesFluentIn.sort();
        user.languagesLearning.sort();
      } else {
        return res.status(400).json({
          message: "Selected language is not in your learning list",
          currentLearning: user.languagesLearning
        });
      }
    }

    // Apply other updates
    Object.assign(user, updateData);

    // Save the updated user
    const updatedUser = await user.save();

    // Return updated user data
    res.status(200).json({
      message: "Profile updated successfully!",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        languagesFluentIn: updatedUser.languagesFluentIn,
        languagesLearning: updatedUser.languagesLearning,
        profile: updatedUser.profile,
      },
      updates: {
        languagesMoved: selectedLanguage ? [selectedLanguage] : [],
        fieldsUpdated: Object.keys(updateData)
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ 
      message: "Failed to update profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function for email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    const usersProfile = users.map(user => ({
      ...user._doc,
      profile: user.profile ? `/images/${user.profile}` : '/images/default-avatar.png',
    }));

    res.status(200).json(usersProfile);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    res.status(200).json({ message: "User blocked successfully.", blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Error blocking user", error });
  }
};




const addToContacts= async (req, res) => {
  try {
    const { contactId } = req.body; 
    const userId = req.params.id; 

    if(contactId===userId){
      return res.status(400).json({message:"You cannot add as contact yourself"});
    }
    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID is required.' });
    }

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

 
    if (user.contacts.includes(contactId)) {
      return res.status(400).json({ message: 'User is already in contacts.' });
    }

   
    user.contacts.push(contactId);
    await user.save();
    res.status(200).json({ message: 'Contact added successfully.', contacts: user.contacts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
}



const removeContact = async (req, res) => {
  try {

    const {loggedInUserId}=req.params;
    const {  contactId } = req.body; // Assuming these are sent in the request body

    if (!loggedInUserId || !contactId) {
      return res.status(400).send('Bad Request: Both loggedInUserId and contactId are required.');
    }

    const user = await User.findById(loggedInUserId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    // Check if the contact exists in the user's contacts
    const contactIndex = user.contacts.indexOf(contactId);
    if (contactIndex === -1) {
      return res.status(400).send('Contact not found in user\'s contacts.');
    }

    // Remove the contact
    user.contacts.splice(contactIndex, 1);
    await user.save();

    res.status(200).send('Contact removed successfully.');
  } catch (error) {
    console.error('Error removing contact:', error);
    res.status(500).send('Internal Server Error');
  }
};


module.exports = { signup, login, logout, updateUser, getAllUsers, blockUser,addToContacts ,removeContact};
