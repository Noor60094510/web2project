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

async function getAllSessions() {
  return await persistence.getAllSessions();
}

async function getSession(sessionId) {
  return await persistence.getSession(sessionId);
}

async function logUserIn(email, password) {
  let user = await getUser(email);

  if (user) {
    if (user.password != password) {
      return false;
    }

    return await checkUserVerification(user);
  }

  return false;
}

async function checkUserVerification(user) {
  if (user.verified) {
    return user;
  }
  return "unverified";
}

async function sendVerificationEmail(email) {
  let user = await persistence.getUser(email);

  if (user) {
    let dbToken = user.verificationToken;

    let transporter = nodemailer.createTransport({
      host: "127.0.0.1",
      port: 25,
    });

    let body = `
        Click the link below to verify your account.
        <a href="http://127.0.0.1:3000/user-verification/?token=${dbToken}&email=${user.email}">Link</a>
        `;
    console.log(body);

    await transporter.sendMail({
      from: "web3project@no-reply.com",
      to: email,
      subject: "Email Verification",
      html: body,
    });
  }
}

async function verifyUser(token, email) {
  let user = await persistence.getUser(email);

  if (!user) {
    return false;
  }

  if (user.verificationToken == token) {
    user.verified = true;
    await persistence.updateUser(user);
    return true;
  }

  return false;
}

async function checkLogin(username, password) {
  let details = await persistence.getUserDetails(username);
  if (details.UserName === username && details.Password === password) {
    return details.UserType;
  }
  return undefined;
}

async function startSession(data) {
  let uuid = crypto.randomUUID();
  let user = await persistence.getUser(data.email);
  let expiry = new Date(Date.now() + 1000 * 60 * 5);
  await persistence.saveSession(uuid, expiry, data);
  return {
    uuid: uuid,
    expiry: expiry,
    Data: data,
    profileImg: user.profileImg,
  };
}

async function getSessionData(key) {
  return await persistence.getSession(key);
}

async function deleteSession(key) {
  await persistence.deleteSession(key);
}

module.exports = {
  getAllusers,
  getUser,
  makeUser,
  getAllSessions,
  getSession,
  startSession,
  getSessionData,
  deleteSession,
  sendVerificationEmail,
  verifyUser,
  checkLogin,
  logUserIn,
};
