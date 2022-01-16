const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const facebook = {
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: `${BASE_URL}/api/auth/facebook/callback`,
  profileFields: ["id", "name", "displayName", "picture", "email"],
};

const google = {
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: `${BASE_URL}/api/auth/callback/google`,
};

//Transform Facebook profile into user object
const transformFacebookProfile = (profile) => ({
  userId: profile.id,
  name: profile.name,
  avatar: profile.picture.data.url,
  provider: "facebook",
});

// Transform Google profile into user object
const transformGoogleProfile = (profile) => ({
  userId: profile.sub,
  name: profile.name,
  avatar: profile.picture,
  provider: "google",
});

module.exports = {
  facebook,
  google,
  transformFacebookProfile,
  transformGoogleProfile,
};
