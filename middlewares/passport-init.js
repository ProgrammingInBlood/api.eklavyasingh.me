const { compare } = require("bcrypt");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook");
const GoogleStrategy = require("passport-google-oauth20");
const LocalStrategy = require("passport-local");
const {
  facebook,
  google,
  transformFacebookProfile,
  transformGoogleProfile,
} = require("../config/auth");
const { createUser } = require("../config/user");
const users = require("../schema/users");

//initialize passport google and facebook
passport.use(
  new FacebookStrategy(
    facebook,
    // Gets called when user authorizes access to their profile
    function (accessToken, refreshToken, profile, done) {
      createUser(transformFacebookProfile(profile._json));
      done(null, transformFacebookProfile(profile._json));
    }
  )
);

//initialize passport email and password
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (email, password, done) {
      users.findOne({ email: email }, async function (err, user) {
        const comparePassword = await compare(password, user.password);
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        if (!comparePassword) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user, { message: "Logged in Successfully" });
      });
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
    createUser(transformGoogleProfile(profile._json));
    done(null, transformGoogleProfile(profile._json));
  })
);

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  return done(null, user);
});

// Deserialize user from the sessions
passport.deserializeUser((user, done) => done(null, user));
