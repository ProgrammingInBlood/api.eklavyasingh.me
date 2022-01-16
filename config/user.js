const users = require("../schema/users");

const createUser = async (profile) => {
  try {
    const user = await users.create({
      name: profile.displayName,
      email: profile.email,
      avatar: profile.photo,
    });
    return user;
  } catch (error) {
    return error;
  }
};

const checkUser = async (profile) => {
  try {
    const user = await users.findOne(profile);
    if (user) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return error;
  }
};

module.exports = { createUser, checkUser };
