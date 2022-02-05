const answer = require("../schema/Answers");
const Questions = require("../schema/Questions");
const router = require("express").Router();

router.post("/create", async (req, res) => {
  const MyQuestion = await Questions.findById(req.body.questionId);
  if (MyQuestion.answers.length < 3) {
    try {
      answer.create(
        {
          questionId: req.body.questionId,
          answer: req.body.answer,
          author: req.user?.userId,
        },
        async (err, data) => {
          if (err) {
            res.json({ success: false, message: err });
          }
          await Questions?.findByIdAndUpdate(req.body.questionId, {
            $push: {
              answers: data._id,
            },
          });

          res.json({ success: true, answer: data });
        }
      );
    } catch (error) {
      res.json({ success: false, message: error });
    }
  } else {
    res.json({ success: false, message: "You can't add more than 3 answers" });
  }
});

router.get("/", async (req, res) => {
  try {
    const answers = await answer.find(
      { author: req?.user?.userId },
      { _id: 1, author: 1, answer: 1, created_at: 1, questionId: 1 }
    );
    res.json({ success: true, answers });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const answers = await answer.find({ questionId: req.params.id });

    console.log({ answers });
    res.json({ success: true, answers });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.get("/author/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const answers = await answer.find({ author: id });
    res.json({ success: true, answers });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.post("/thanks", async (req, res) => {
  console.log(req.body.answerId);
  try {
    const answers = await answer.findById(req.body.answerId);
    if (answers.likes.includes(req.user?.userId)) {
      res.json({ success: false, message: "You already thanked this answer" });
    } else {
      console.log("else");
      await answer.findByIdAndUpdate(req.body.answerId, {
        $push: {
          likes: req.user?.userId,
        },
      });
      res.json({ success: true, message: "You thanked this answer" });
    }
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

module.exports = router;
