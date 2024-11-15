const express = require("express");
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const path = require("path");
const business = require("./business");

let app = express();

app.set("views", __dirname + "/templates");
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars.engine());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.render("index", { layout: undefined, session: session });
});

app.get("/login", async (req, res) => {
  res.render("login", { layout: undefined });
});

app.get("/register", async (req, res) => {
  res.render("register", { layout: undefined });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
