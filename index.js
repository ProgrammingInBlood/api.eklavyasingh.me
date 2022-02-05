const express = require("express");
const app = express();
const db = require("./lib/db");
const users = require("./schema/users");
const server = require("http").Server(app);
const cors = require("cors");
const jwt = require("jsonwebtoken");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

require("dotenv").config();
const PORT = process.env.PORT || 5000;
const bodyParser = require("body-parser");

//AUTHENTICATION PACKAGES
const passport = require("passport");
const { sendOtp, verifyOtp } = require("./config/user");
//IMPORT ROUTEs
const conversationRoute = require("./routes/Conversations");
const messageRoute = require("./routes/Messages");
const updateUserRoute = require("./routes/UpdateUser");
const checkRoute = require("./routes/Check");
const userRoute = require("./routes/userRoute");
const questionRoute = require("./routes/Question");
const answerRoute = require("./routes/Answer");
const verifyJwt = require("./config/jwt");

require("./middlewares/passport-init");
// Import Facebook and Google OAuth apps configs

//initialize body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
db();

//initialize Cors middleware
app.use(cors({ credentials: true, origin: "*" }));

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
    res.redirect("exp://192.168.29.128:19000?user=" + JSON.stringify(req.user))
);

// Set up Google auth routes
app.get("/auth/google", function (req, res, next) {
  (passport._strategies["google"]._callbackURL = req.query.web //change callback url
    ? "/api/auth/callback/google/web"
    : "/api/auth/callback/google"),
    passport.authenticate("google", {
      scope: ["openid", "email", "profile"],
    })(req, res, next);
});

//MOBILE APP LOGIN ROUTE
app.get(
  "/api/auth/callback/google",
  passport.authenticate("google", { failureRedirect: "/auth/google" }),
  (req, res) => {
    res.redirect("exp://192.168.29.128:19000?user=" + JSON.stringify(req.user));
  }
);

//WEB APP LOGIN ROUTE
app.get(
  "/api/auth/callback/google/web",
  passport.authenticate("google", { failureRedirect: "/auth/google" }),
  (req, res) => {
    res.redirect("http://localhost:3001/auth/authRedirect?token=" + req.user);
  }
);

// Set up local  passport auth routes with message
app.post("/auth/credentials", (req, res, next) => {
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
      //returning cookie and json
      return res.json({ success: true, message: info.message, token: user });
    });
  })(req, res, next);
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

//ROUTES MIDDLEWARE
app.use("/api/conversations", verifyJwt, conversationRoute);
app.use("/api/messages", verifyJwt, messageRoute);
app.use("/api/user/update", verifyJwt, updateUserRoute);
app.use("/api/user/check", verifyJwt, checkRoute);
app.use("/api/question", questionRoute);
app.use("/api/answer", verifyJwt, answerRoute);
app.use("/api/user", verifyJwt, userRoute);
app.use("/user-avatar", express.static("uploads/avatar"));

app.get("/api/users/search", async (req, res) => {
  const { query } = req.query;
  if (query) {
    const usersData = await users.find(
      {
        $or: [{ username: { $regex: query, $options: "i" } }],
      },
      { _id: 1, username: 1, avatar: 1, description: 1 }
    );

    res.json({ success: true, users: usersData });
  } else {
    res.json({ success: false, users: [] });
  }
});

app.post("/api/user/firstRegestration", verifyJwt, async (req, res) => {
  const { username, age } = req.body;
  //find user by id
  const user = await users.findOne({ _id: req.user.userId });
  if (!user?.isRegistered) {
    if (username && age) {
      if (username.length > 3 && username.length < 20) {
        if (age > 3 && age < 100) {
          try {
            await users.findByIdAndUpdate(req.user.userId, {
              $set: {
                username: username,
                age: age,
                isRegistered: true,
              },
            });
            res.json({
              success: true,
              token: jwt.sign(
                { userId: req.user.userId, username },
                process.env.JWT_SECRET
              ),
              message: "User Registered",
            });
          } catch (error) {
            res.json({ message: error?.message });
          }
        } else {
          res.json({ message: "Age must be between 3 and 100" });
        }
      } else {
        res.json({ message: "Username must be between 3 and 20 characters" });
      }
    } else {
      res.json({ success: false, message: "All fields is required" });
    }
  } else {
    res.json({ success: false, message: "User already registered" });
  }
});

//check user regestration
app.get("/api/user/isRegistered", verifyJwt, async (req, res) => {
  const user = await users.findOne({ _id: req.user.userId });
  if (user.isRegistered) {
    res.json({ success: true, message: "User is registered" });
  } else {
    res.json({ success: false, message: "User not registered" });
  }
});

//ROUTES MIDDLEWARE END

//SOCKET IO START
//initialize chat room

let ActiveUsers = [];

//add user function with socket id and userid
function addUser(userId, socketId) {
  !ActiveUsers.some((user) => user.userId === userId) &&
    ActiveUsers.push({ userId, socketId });
}

//remove user function with socket id
function removeUser(socketId) {
  ActiveUsers = ActiveUsers.filter((user) => user.socketId !== socketId);
}

//get user functii with user id
function getUser(userId) {
  return ActiveUsers.find((user) => user.userId === userId);
}

const chats = io.of("/chats");

chats.on("connection", (socket) => {
  //add online user to active users
  socket.on("active", (userId) => {
    addUser(userId, socket.id);
    chats.emit("online", ActiveUsers);
  });
  socket.on("message", ({ senderId, receiverId, message }) => {
    const user = getUser(receiverId);

    if (message) {
      if (user) {
        chats.to(user.socketId).emit("getMessage", {
          senderId,
          receiverId,
          message,
          created_at: new Date(),
        });
      }
      chats.to(socket.id).emit("getMessage", {
        senderId,
        receiverId,
        message,
        created_at: new Date(),
      });
    }
  });
  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log(socket.id + " disconnect");
    chats.emit("online", ActiveUsers);
  });
});

let ActiveQuestionsUsers = [];

//find top 3 repeated questions in activequestionsusers
let allQuestionsId = [];

//find top 3 repeated items in array
function findTop3RepeatedObject(ActiveQuestionsUsers) {
  let top3Repeated = [];
  let repeatedObject = {};
  let repeatedObjects = [];
  for (let i = 0; i < ActiveQuestionsUsers.length; i++) {
    repeatedObject[ActiveQuestionsUsers[i].questionId] =
      (repeatedObject[ActiveQuestionsUsers[i].questionId] || 0) + 1;
  }
  for (let key in repeatedObject) {
    repeatedObjects.push({
      questionId: key,
      count: repeatedObject[key],
    });
  }
  repeatedObjects.sort((a, b) => b.count - a.count);
  for (let i = 0; i < 3; i++) {
    top3Repeated.push(repeatedObjects[i]);
  }
  return top3Repeated;
}

const addQuestionUser = (userId, socketId, questionId) => {
  !ActiveQuestionsUsers.some((user) => user.userId === userId) &&
    ActiveQuestionsUsers.push({ userId, socketId, questionId });
};
const removeQuestionUser = (socketId) => {
  ActiveQuestionsUsers = ActiveQuestionsUsers.filter(
    (user) => user.socketId !== socketId
  );
};

const getQuestionUser = (questionId) => {
  return ActiveQuestionsUsers.filter((user) => user.questionId === questionId);
};

const question = io.of("/question");

question.on("connection", (socket) => {
  socket.emit("activeQuestions", {
    top: findTop3RepeatedObject(ActiveQuestionsUsers),
  });

  socket.on("active", async (userId, questionId) => {
    addQuestionUser(userId, socket.id, questionId);
    const questionUsers = getQuestionUser(questionId);
    const socketIds = questionUsers.map((user) => user.socketId);
    const userIds = questionUsers.map((user) => user.userId);
    const userInfo = await users.find(
      { _id: { $in: userIds } },
      { username: 1, avatar: 1, description: 1, _id: 1 }
    );
    let userListInfo = [];

    userInfo.forEach((user) => {
      const payload = {
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
      };
      userListInfo.push(payload);
    });

    question.to(socketIds).emit("getActiveUsers", {
      activeUsers: userListInfo,
    });

    question.emit("activeQuestions", {
      top: findTop3RepeatedObject(ActiveQuestionsUsers),
    });
  });

  socket.on("disconnect", async () => {
    const disconnecteduser = ActiveQuestionsUsers.find(
      (user) => user.socketId === socket.id
    );
    console.log(ActiveQuestionsUsers);
    console.log(socket.id);
    console.log(disconnecteduser);
    removeQuestionUser(socket.id);
    if (disconnecteduser) {
      const questionUsers = getQuestionUser(disconnecteduser?.questionId);
      console.log(disconnecteduser?.questionId);
      const socketIds = questionUsers.map((user) => user.socketId);
      const userIds = questionUsers.map((user) => user.userId);
      const userInfo = await users.find({ _id: { $in: userIds } });
      let userListInfo = [];
      userInfo.forEach((user) => {
        const payload = {
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
        };
        userListInfo.push(payload);
      });
      question.to(socketIds).emit("getActiveUsers", {
        activeUsers: userListInfo,
      });
      console.log("disconnected " + socket.id);
    }
  });
});
