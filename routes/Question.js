const verifyJwt = require("../config/jwt");
const questions = require("../schema/Questions");
const users = require("../schema/users");
const router = require("express").Router();

router.post("/create", verifyJwt, async (req, res) => {
  try {
    const newQuestion = await questions.create({
      question: req.body.question,
      author: req.user?.userId,
      subject: req.body.subject,
      points: req.body.points,
    });
    res.json({ success: true, question: newQuestion });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.get("/allQuestions", async (req, res) => {
  //get all questions with user details
  let Allquestions = await questions.find({}).sort({ created_at: -1 });
  let userList = [];
  //push all author ids to userList
  Allquestions.forEach((element) => {
    userList.push(element.author);
  });

  let userInfo = await users.find({ _id: { $in: userList } });

  //push user details to question
  Allquestions.forEach((element) => {
    element.author = JSON.stringify(
      userInfo.find((user) => user._id == element.author)
    );
  });

  res.json({ success: true, Allquestions });
});

router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (query) {
    const data = await questions
      .find(
        {
          $or: [{ question: { $regex: query, $options: "i" } }],
        },
        { _id: 1, question: 1, author: 1 }
      )
      .limit(15);

    res.json({ success: true, questions: data });
  } else {
    res.json({ success: false, users: [] });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const question = await questions.findById(req.params.id);
    res.json({ success: true, question });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.get("/", verifyJwt, async (req, res) => {
  try {
    const question = await questions.find({ author: req.user?.userId });
    res.json({ success: true, question });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});
router.get("/author/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const question = await questions.find({ author: id });
    res.json({ success: true, question });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

module.exports = router;
