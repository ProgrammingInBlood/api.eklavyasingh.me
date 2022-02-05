const router = require("express").Router();

const Conversation = require("../schema/Conversations");
const users = require("../schema/users");

//new conversation
router.post("/", async (req, res) => {
  try {
    const newConversation = await Conversation.findOneAndUpdate(
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
      },

      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, conversation: newConversation });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

//get conversation of user by id
// router.get("/:id", async (req, res) => {
//   try {
//     const conversation = await Conversation.find({
//       members: { $in: [req.params.id] },
//     });
//     res.json(conversation);
//   } catch (error) {
//     res.json({ message: error });
//   }
// });

router.get("/get", async (req, res) => {
  console.log(req.user.userId);
  try {
    const conversation = await Conversation.find({
      members: { $in: req.user.userId },
    }).sort({ updatedAt: -1 });

    let userList = [];

    //get all other users in conversation
    conversation.forEach((conversation) => {
      conversation.members.forEach((member) => {
        if (member != req.user.userId) {
          userList.push(member);
        }
      });
    });

    const userInfo = await users.find({ _id: { $in: userList } });

    //send only username and id from userInfo
    let userListInfo = [];
    userInfo.forEach((user) => {
      const payload = {
        userId: user._id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      };
      userListInfo.push(payload);
    });

    res.json({
      success: true,
      userList: userListInfo,
      conversation: conversation,
    });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

module.exports = router;
