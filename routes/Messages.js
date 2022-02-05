const router = require("express").Router();
const Conversations = require("../schema/Conversations");
const Message = require("../schema/Messages");

//new message
// router.post("/", async (req, res) => {
//   const newMessage = new Message({
//     conversationId: req.body.conversationId,
//     senderId: req.body.senderId,
//     message: req.body.message,
//   });
//   try {
//     const savedMessage = await newMessage.save();
//     res.json(savedMessage);
//   } catch (error) {
//     res.json({ message: error });
//   }
// });

//NEW MESSAGE WITH CONVERSATION ID
//required fields-->  receiverId, message
router.post("/", async (req, res) => {
  if (req.body.receiverId && req.body.message) {
    await Conversations.findOneAndUpdate(
      {
        members: {
          $all: [
            { $elemMatch: { $eq: req.user.userId } },
            { $elemMatch: { $eq: req.body.receiverId } },
          ],
        },
      },

      {
        members: [req.user.userId, req.body.receiverId],
        lastMessage: req.body.message,
      },

      { upsert: true, new: true, setDefaultsOnInsert: true },

      async (err, conversation) => {
        console.log("running");
        if (err) {
          console.log(err);
          res.sendStatus(500);
          res.json({ message: err });
        } else {
          try {
            const newMessage = await Message.create({
              conversationId: conversation._id,
              senderId: req.user.userId,
              message: req.body.message,
            });

            res.json({ success: true, data: newMessage });
          } catch (error) {
            res.json({ success: false, message: error });
          }
        }
      }
    ).clone();
  } else {
    res.json({ success: false, message: "all fields not provided" });
  }

  // const newMessage = new Message({
  //   conversationId: req.body.conversationId,
  //   senderId: req.body.senderId,
  //   message: req.body.message,
  // });
  // try {
  //   const savedMessage = await newMessage.save();
  //   res.json(savedMessage);
  // } catch (error) {
  //   res.json({ message: error });
  // }
});

//get message of user by conversationId
router.get("/:id", async (req, res) => {
  try {
    const message = await Message.find({ conversationId: req.params.id });
    res.json({ success: true, message });
  } catch (error) {
    res.json({ message: error });
  }
});

module.exports = router;
