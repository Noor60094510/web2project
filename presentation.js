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
