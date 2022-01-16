const express = require("express");
const app = express();
const db = require("./lib/db");
const users = require("./schema/users");
const server = require("http").Server(app);
const cors = require("cors");
const compare = require("bcrypt").compare;
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const Products = require("./schema/Food");
const Tags = require("./schema/Tags");
//AUTHENTICATION PACKAGES
const passport = require("passport");
const FacebookStrategy = require("passport-facebook");
const GoogleStrategy = require("passport-google-oauth20");
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

//initialize Database
db();

//initialize passport google and facebook
passport.use(
  new FacebookStrategy(
    facebook,
    // Gets called when user authorizes access to their profile
    function (accessToken, refreshToken, profile, done) {
      done(null, transformFacebookProfile(profile._json));
    }
  )
);

// Register Google Passport strategy
passport.use(
  new GoogleStrategy(google, function (
    accessToken,
    refreshToken,
    profile,
    done
  ) {
    done(null, transformGoogleProfile(profile._json));
  })
);

// Serialize user into the sessions
passport.serializeUser((user, done) => done(null, user));

// Deserialize user from the sessions
passport.deserializeUser((user, done) => done(null, user));

//initialize Cors middleware
app.use(cors());

app.post("/", async (req, res) => {
  const user = await users.find({});
  res.json(user);
});

app.post("/api/auth", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const user = await users.findOne({ email });
  if (!user) {
    return res.json({ success: false, message: "Invalid email or password" });
  }
  const isValid = await compare(password, user.password);
  if (!isValid) {
    return res.json({ success: false, message: "Invalid email or password" });
  }
  return res.json({
    success: true,
    message: "Successfully logged in",
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
    },
  });
}); // Set up Facebook auth routes
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/api//auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/auth/facebook" }),
  // Redirect user back to the mobile app using Linking with a custom protocol OAuthLogin
  (req, res) =>
    res.redirect("OAuthLogin://login?user=" + JSON.stringify(req.user))
);

// Set up Google auth routes

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/api/auth/callback/google",
  passport.authenticate("google", { failureRedirect: "/api/auth/google" }),
  (req, res) =>
    res.redirect("OAuthLogin://login?user=" + JSON.stringify(req.user))
);

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

server.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
