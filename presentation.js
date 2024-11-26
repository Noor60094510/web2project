const express = require("express");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const { MongoClient } = require('mongodb');
const cookieParser = require("cookie-parser");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
// Set view engine 
app.set("views", __dirname + "/templates");
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars.engine());
const mongoURL = 'mongodb+srv://60094510:12345@cluster0.jd0q2ew.mongodb.net/'; // MongoDB connection URL


let db;
// Connect to MongoDB using the native driver


const loginRoute = require("./routes/login.route.js");
const registerRoute = require("./routes/user.route.js");
const authRoute = require("./routes/auth.route.js");
const chatRoute = require("./routes/chat.route.js");



app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/static", express.static(__dirname + "/static"));
app.use(express.static("public"));


app.use("/", loginRoute);
app.use("/", registerRoute);
app.use("/", authRoute);
app.use("/", chatRoute);

// Start server
app.listen(8000, () => {
  
  mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Mongoose connected to MongoDB!");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB with Mongoose:", err);
    });

  console.log("Server running on http://localhost:8000");
});
