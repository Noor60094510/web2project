const jwt = require("jsonwebtoken");
const User = require("../models/user");
const dotenv=require('dotenv')
dotenv.config();
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Unauthorized: No token provided.');
    }
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).send('Unauthorized: Invalid token.');
    }

    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return res.status(404).send('User not found.');
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).send('Unauthorized: Invalid token.');
  }
};

module.exports = {
  authenticateUser,
};
