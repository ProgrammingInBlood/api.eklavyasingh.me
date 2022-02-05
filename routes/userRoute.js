const Answers = require("../schema/Answers");
const Questions = require("../schema/Questions");
const User = require("../schema/Users");
const router = require("express").Router();

//get user info from db
router.get("/myself", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const getQuestionCount = await Questions.countDocuments({
      author: req.user.userId,
    });

    const getAnswerCount = await Answers.countDocuments({
      author: req.user.userId,
    });

    const userInfo = {
      userId: user._id,
      username: user.username,
      age: user.age,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      description: user.description,
      isRegistered: user.isRegistered,
      questionCount: getQuestionCount,
      answerCount: getAnswerCount,
      followers: user.followers,
      following: user.following,
    };

    res.json({ success: true, user: userInfo });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.get("/get/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const userInfo = {
      userId: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      description: user.description,
      followers: user.followers,
      following: user.following,
    };

    res.json({ success: true, user: userInfo });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

module.exports = router;
