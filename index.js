const express = require("express");
const app = express();
const db = require("./lib/db");
const users = require("./schema/users");
const server = require("http").Server(app);
const cors = require("cors");
const compare = require("bcrypt").compare;
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const bodyParser = require("body-parser");
const Products = require("./schema/Food");
const Tags = require("./schema/Tags");

//initialize body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

db();
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
});

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

server.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
