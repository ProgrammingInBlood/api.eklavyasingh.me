const users = require("../schema/users");
const tokens = require("../schema/token");
const { hash } = require("bcrypt");
const otpGenerator = require("otp-generator");
const { v4: uuidv4 } = require("uuid");
const { confiramtionEmail } = require("../lib/mailer");
var uniqid = require("uniqid");

const createUser = async (profile) => {
  try {
    const checkUser = await users.findOne({ userId: profile.userId });
    if (!checkUser) {
      await users.create({
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        provider: profile.provider,
      });
      return { success: true, message: "user created" };
    } else {
      return { success: false, message: "user already exists" };
    }
  } catch (error) {
    return { success: false, message: error };
  }
};

const RegisterUser = async (profile) => {
  try {
    const checkUser = await users.findOne({
      email: profile.email,
      provider: "credentials",
    });
    if (!checkUser) {
      await users.create({
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        password: profile.password,
        provider: "credentials",
      });
      return { success: true, message: "user created" };
    } else {
      return { success: false, message: "user already exists" };
    }
  } catch (error) {
    return { success: false, message: error };
  }
};

const sendOtp = async (profile) => {
  const token = uuidv4();
  const otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  try {
    const checkToken = await tokens.findOne({ token });
    const checkUser = await users.findOne({
      email: profile.email,
      provider: "credentials",
    });

    if (checkUser) {
      return { success: false, message: "user already exists" };
    }
    if (checkToken) {
      return { success: false, message: "token already exists" };
    }

    const tokenDB = await tokens
      .findOne({ email: profile.email })
      .sort({ timestamp: -1 });

    if (tokenDB) {
      const unixTimestamp = Math.floor(
        new Date(tokenDB.timestamp).getTime() / 1000
      );
      if (parseInt(unixTimestamp) + 60 > Date.now() / 1000) {
        return { success: false, message: "Wait 60 sec to resend OTP" };
      } else {
        await tokens.deleteMany({ email: profile.email });
      }
    }

    if (!checkUser && !checkToken) {
      const hashedPassword = await hash(profile.password, 10);
      await tokens.create({
        userId: uniqid(),
        name: profile.name,
        email: profile.email,
        password: hashedPassword,
        token: token,
        otp: otp,
      });
      await confiramtionEmail(profile, otp);
      return { success: true, message: "otp sent", token };
    } else {
      return { success: false, message: "user already exists" };
    }
  } catch (error) {
    return { success: false, message: error };
  }
};

//verify otp
const verifyOtp = async (token, otp) => {
  if (!token) {
    return { success: false, message: "token not found" };
  }
  if (!otp) {
    return { success: false, message: "otp not found" };
  }

  try {
    const checkToken = await tokens.findOne({ token });
    if (checkToken) {
      if (checkToken.otp === otp) {
        const payload = {
          name: checkToken.name,
          email: checkToken.email,
          password: checkToken.password,
          userId: checkToken.userId,
        };
        const create = await RegisterUser(payload);
        await tokens.deleteMany({ token });
        return create;
      } else {
        return { success: false, message: "otp not verified" };
      }
    } else {
      return { success: false, message: "token not found" };
    }
  } catch (error) {
    return { success: false, message: error };
  }
};

module.exports = { createUser, RegisterUser, sendOtp, verifyOtp };
