const User = require("../schema/users");
const router = require("express").Router();

//check if username available
router.post("/username", async (req, res) => {
  if (req.body.username) {
    try {
      const user = await User.findOne({ username: req.body.username });
      if (user) {
        res.json({ success: false, message: "This username is already taken" });
      } else {
        res.json({ success: true, message: "username available" });
      }
    } catch (error) {
      res.json({ message: error });
    }
  } else {
    res.json({ success: false, message: "Username cannot be empty" });
  }
});

module.exports = router;
