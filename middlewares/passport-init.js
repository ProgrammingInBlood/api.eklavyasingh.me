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
  transformDatabaseUser,
} = require("../config/auth");
const { createUser } = require("../config/user");
const users = require("../schema/users");

//initialize passport google and facebook
passport.use(
  new FacebookStrategy(
    facebook,
    // Gets called when user authorizes access to their profile
    async function (accessToken, refreshToken, profile, done) {
      const user = await createUser(transformFacebookProfile(profile._json));
      done(null, transformDatabaseUser(user.data));
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
      console.log({ email, password });

      users.findOne(
        { email: email, provider: "credentials" },
        async function (err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false, {
              message: "Invalid username or password",
            });
          }
          if (!(await compare(password, user.password))) {
            return done(null, false, {
              message: "Invalid username or password",
            });
          }
          return done(null, transformDatabaseUser(user), {
            message: "Logged in Successfully",
          });
        }
      );
    }
  )
);

// Register Google Passport strategy
passport.use(
  new GoogleStrategy(google, async function (
    accessToken,
    refreshToken,
    profile,
    done
  ) {
    const user = await createUser(transformGoogleProfile(profile._json));
    done(null, transformDatabaseUser(user.data));
  })
);

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  return done(null, user);
});

// Deserialize user from the sessions
passport.deserializeUser((user, done) => done(null, user));
