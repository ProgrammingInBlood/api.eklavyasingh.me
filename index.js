const express = require("express");
const app = express();
const db = require("./lib/db");
const users = require("./schema/users");
const server = require("http").Server(app);
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const bodyParser = require("body-parser");
const Products = require("./schema/Food");
const Tags = require("./schema/Tags");
//AUTHENTICATION PACKAGES
const passport = require("passport");

const { sendOtp, verifyOtp } = require("./config/user");

require("./middlewares/passport-init");
// Import Facebook and Google OAuth apps configs
const {
  facebook,
  google,
  transformFacebookProfile,
  transformGoogleProfile,
} = require("./config/auth");

//initialize body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
db();

//initialize Cors middleware
app.use(cors());

app.get("/", async (req, res) => {
  const user = await users.find({});
  res.json(user);
});

// Set up Facebook auth routes
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

app.get(
  "/api/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/auth/facebook" }),
  // Redirect user back to the mobile app using Linking with a custom protocol OAuthLogin
  (req, res) =>
    res.redirect("OAuthLogin://login?user=" + JSON.stringify(req.user))
);

// Set up Google auth routes

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["openid", "email", "profile"] })
);

app.get(
  "/api/auth/callback/google",
  passport.authenticate("google", { failureRedirect: "/api/auth/google" }),
  (req, res) => res.redirect("exp://login?user=" + JSON.stringify(req.user))
);

// Set up local  passport auth routes with message
app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.json({ success: false, message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({
        success: true,
        user: {
          email: user.email,
          name: user.name,
          id: user._id,
          avatar: user.avatar,
        },
        message: "Logged in Successfully",
      });
    });
  })(req, res, next);
});

// app.post("/login", function (req, res, next) {
//   passport.authenticate("local-register", function (err, user, info) {
//     return done(null, false, {
//       message: info.message,
//     });
//   });
// });

app.get("/api/homepage", async (req, res) => {
  const FinalData = [];
  try {
    const getAllTags = await Tags.find({});
    for (let i = 0; i < getAllTags.length; i++) {
      const getAllProducts = await Products.find({
        tags: { $elemMatch: { name: getAllTags[i].tags } },
      });
      FinalData.push({
        title: getAllTags[i].title,
        tag: getAllTags[i].tags,
        products: getAllProducts,
      });
    }

    res.status(200).json({ success: true, data: FinalData });
  } catch (err) {
    res.json({ success: false, data: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const getAllProducts = await Products.findOne({ _id: id });
    console.log(getAllProducts);
    res.status(200).json({ success: true, data: getAllProducts });
  } catch (err) {
    res.json({ success: false, data: err.message });
  }
});

app.post("/api/createuser", async (req, res) => {
  const { name, email, password } = req.body;
  const profile = {
    name,
    email,
    password,
  };
  try {
    const token = await sendOtp(profile);
    res.status(200).json(token);
  } catch (err) {
    res.json({ success: false, data: err.message });
  }
});

app.post("/api/createuser/verify", async (req, res) => {
  const { token, otp } = req.body;
  try {
    const verify = await verifyOtp(token, otp);
    res.status(200).json(verify);
  } catch (err) {
    res.json({ success: false, data: err.message });
  }
});

server.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
