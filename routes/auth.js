const app = require("express").Router();
const config = require("../config");
const db = require("better-sqlite3")(__dirname + "/../database/sandbox_db.db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const userFunc = require("./../database/models/user");
const nanoid = require("nanoid");
const jwt = require("jsonwebtoken");

app.get("/", (req, res) => {
  res.send("yes");
});
app.post("/register", async (req, res) => {
  console.log("Linking to DB...");
  let smt1 = db.prepare(`SELECT * FROM users WHERE username=?`);
  let a = smt1.get(req.body.username);
  if (a === req.body.username) {
    res.send("Username exists...");
  } else {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      let smt = db.prepare(
        `INSERT INTO users (userid, username, email, password) VALUES (?, ?, ?, ?)`
      );
      smt.run(nanoid.nanoid(), req.body.username, req.body.email, hash);
      console.log(`New user with name ${req.body.username}\nPassword: ${hash}`);
      res.send("Done!");
    });
  }
});
app.post("/login", (req, res) => {
  console.log("Begin lookup");
  let smt2 = db.prepare(`SELECT * FROM users WHERE username=?`);
  let smt22 = smt2.get(req.body.username);
  if (!smt22) {
    res.send("incorrect username.");
  } else {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      bcrypt.compare(req.body.password, hash, function (err, result) {
        if (result === true) {
          const username = req.body.username;
          const user = {
            username: username,
            userid: userFunc.userId(username),
            currency: userFunc.currency(username),
            isAdmin: userFunc.isAdmin(username),
            post_count: userFunc.userPosts(username),
          };
          jwt.sign(user, config.jwt_Key);
        } else {
          res.send("Your password is incorrect.");
        }
      });
    });
  }
});

module.exports = app;
