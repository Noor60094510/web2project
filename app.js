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
  let sessionKey = req.cookies.web2project;
  if (!sessionKey) {
    res.redirect("/login?message=not logged in");
    return;
  }

  let session = await business.getSessionData(sessionKey);
  if (!session) {
    res.redirect("/login?message=not logged in");
    return;
  }
  console.log(session);

  res.render("index", { layout: undefined, session: session });
});

app.post("/", async (req, res) => {
  let { email, password } = req.body;

  if (email == "" || password == "") {
    res.redirect("/login?message=Invalid Credentials");
    return;
  }

  let login = await business.logUserIn(email, password);

  if (login) {
    if (login === "unverified") {
      res.render("emailVerification", {
        layout: undefined,
        email: req.body.email,
      });
      return;
    }

    let session = await business.startSession({
      email: email,
    });
    res.cookie("web2project", session.uuid, { expires: session.expiry });

    res.render("index", { layout: undefined, session: session });
    return;
  }

  res.redirect("/login?message=not logged in");
});

app.get("/login", async (req, res) => {
  res.render("login", { layout: undefined });
});

app.get("/register", async (req, res) => {
  res.render("register", { layout: undefined });
});

app.post("/newRegistration", async (req, res) => {
  let make = await business.makeUser(req.body); //To-do: add check for pre-existing email

  business.sendVerificationEmail(make.email);

  res.render("emailVerification", { layout: undefined, email: req.body.email });
});

app.get("/user-verification", async (req, res) => {
  let { token, email } = req.query;

  let verify = await business.verifyUser(token, email);

  res.redirect("/login");
});

app.get("/logout", async (req, res) => {
  await business.deleteSession(req.cookies.web2project);
  res.cookie("web2project", "", { expires: new Date(Date.now()) });
  res.redirect("/");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
