const persistence = require("./persistence");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

async function getAllusers() {
  return await persistence.getAllusers();
}

async function getUser(email) {
  return await persistence.getUser(email);
}

async function makeUser(userData) {
  userData.verified = false;
  userData.verificationToken = crypto.randomUUID();
  return persistence.makeUser(userData);
}

module.exports = {
  getAllusers,
  getUser,
  makeUser,
};
