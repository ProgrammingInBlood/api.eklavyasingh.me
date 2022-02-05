const jwt = require("jsonwebtoken");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const facebook = {
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: `${BASE_URL}/api/auth/facebook/callback`,
  profileFields: ["id", "name", "displayName", "picture", "emails"],
};

const google = {
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: `/api/auth/callback/google/web`,
};

//Transform Facebook profile into user object
const transformFacebookProfile = (profile) => ({
  userId: profile.id,
  name: profile.name,
  email: profile.email,
  avatar: profile.picture.data.url,
  provider: "facebook",
});

// Transform Google profile into user object
const transformGoogleProfile = (profile) => ({
  userId: profile.sub,
  name: profile.name,
  email: profile.email,
  avatar: profile.picture,
  provider: "google",
});

const transformDatabaseUser = (user) => {
  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

module.exports = {
  facebook,
  google,
  transformFacebookProfile,
  transformGoogleProfile,
  transformDatabaseUser,
};
