const mongodb = require("mongodb");
let client = undefined;
let db = undefined;
let usersCollection = undefined;
let sessionsCollection = undefined;

async function connectDatabase() {
  if (!client) {
    client = new mongodb.MongoClient(
      "mongodb+srv://60094510:12345@cluster0.jd0q2ew.mongodb.net/"
    );
    db = client.db("web2project");
    sessionsCollection = db.collection("sessions");
    usersCollection = db.collection("users");
    await client.connect();
  }
}

async function getAllusers() {
  await connectDatabase();
  let users = await usersCollection.find({}).toArray();
  return users;
}

async function getUser(email) {
  await connectDatabase();
  let user = await usersCollection.findOne({ email: email });
  return user;
}

async function makeUser(userData) {
  await connectDatabase();

  let result = await usersCollection.insertOne(userData);
  let createdUser = await usersCollection.findOne({ _id: result.insertedId });
  return createdUser;
}

async function updateUser(userData) {
  await connectDatabase();

  const { email, ...updates } = userData;

  if (!email) {
    throw new Error("Email is required to update a user.");
  }

  let result = await usersCollection.updateOne(
    { email: email },
    { $set: updates }
  );

  if (result.matchedCount === 0) {
    throw new Error("No user found with the given email.");
  }

  let updatedUser = await usersCollection.findOne({ email: email });
  return updatedUser;
}

async function getAllSessions() {
  await connectDatabase();
  let sessions = await sessionsCollection.find({}).toArray();
  return sessions;
}

async function getSession(SessionKey) {
  await connectDatabase();
  let session = await sessionsCollection.findOne({ SessionKey: SessionKey });

  return session;
}

async function saveSession(uuid, expiry, data) {
  await connectDatabase();

  await sessionsCollection.insertOne({
    SessionKey: uuid,
    Expiry: expiry,
    Data: data,
  });
}

async function deleteSession(key) {
  console.log(key);

  await sessionsCollection.deleteOne({ SessionKey: key });
}

module.exports = {
  getAllusers,
  getUser,
  makeUser,
  updateUser,
  getAllSessions,
  getSession,
  saveSession,
  deleteSession,
};
