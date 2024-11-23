const express = require("express");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser");
const app = express();
const path = require("path");

// Set view engine 
app.set("views", __dirname + "/templates");
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars.engine());


const loginRoute = require("./routes/login.route.js");
const registerRoute = require("./routes/user.route.js");
const authRoute = require("./routes/auth.route.js");
const chatRoute = require("./routes/chat.route.js");
const mongoose = require("mongoose");


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
  try {
    mongoose.connect("mongodb://localhost:27017/");
    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error);
  }
  console.log("Server running on http://localhost:8000");
});
