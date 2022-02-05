const User = require("../schema/Users");
const router = require("express").Router();
const upload = require("../lib/multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
router.put("/avatar", upload.single("avatar"), async (req, res) => {
  //upload avatar using multer
  //get current time
  const time = new Date().getTime();
  const fileName = req.user.userId + "-avatar-" + time + ".jpg";

  if (req.file) {
    let compressImagePath = path.join(
      __dirname,
      "../",
      "uploads",
      "avatar",
      fileName
    );

    try {
      sharp(req.file.path)
        .resize(200, 200)
        .jpeg({ quality: 80 })
        .toFile(compressImagePath, async (err) => {
          if (err) {
            fs.unlinkSync(req.file.path);
            res.send({ success: false, message: err });
          } else {
            fs.unlinkSync(req.file.path);

            await User.findByIdAndUpdate(req.user.userId, {
              $set: {
                avatar: `${process.env.BASE_URL}/user-avatar/${fileName}`,
              },
            });

            res.send({
              success: true,
              message: "avatar uploaded successfully",
              url: `${process.env.BASE_URL}/user-avatar/${fileName}`,
            });
          }
        });
    } catch (error) {
      res.send({ success: false, message: error });
    }
  } else {
    res.send({ success: false, message: "no file" });
  }
});

router.post("/username", async (req, res) => {
  if (req.body.username) {
    try {
      const user = await User.findByIdAndUpdate(req.user.userId, {
        $set: {
          username: req.body.username,
          age: req.body.age,
        },
      });
      res.json({ success: true, data: user, message: "username updated" });
    } catch (error) {
      res.json({ message: error });
    }
  } else {
    res.json({ success: false, message: "username is required" });
  }
});

router.put("/", async (req, res) => {
  console.log(req.body);

  if (req.body.username === "") {
    return res.json({ success: false, message: "username cannot be empty" });
  }
  //if username contains space, return error
  if (req.body.username.indexOf(" ") !== -1) {
    return res.json({
      success: false,
      message: "invalid username structure",
    });
  }
  //if username is already taken, return error
  const user = await User.findOne({ username: req.body.username });
  console.log(req.user);
  if (user?.username !== req.user.username) {
    return res.json({
      success: false,
      message: "username already taken",
    });
  }

  //if username is not between 3 and 20 characters, return error
  if (req.body.username.length < 3 || req.body.username.length > 20) {
    return res.json({
      success: false,
      message: "username must be between 3 and 20 characters",
    });
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        username: req.body.username,
        name: req.body.name,
        description: req.body.description,
      },
    });
    console.log(req.body.description);
    res.json({ success: true, data: user, message: "user updated" });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

router.post("/:id", async (req, res) => {
  try {
    //find user and update
    const user = await User.findByIdAndUpdate(req.params.id, {
      $set: {
        username: req.body.username,
      },
    });

    res.json(message);
  } catch (error) {
    res.json({ message: error });
  }
});

// router.put("/follow/:id", async (req, res) => {
//   console.log(req.params.id);
//   console.log(req.user.userId);
//   if (req.user.userId === req.params.id) {
//     return res.json({ success: false, message: "you cannot follow yourself" });
//   }
//   try {
//     await User.findOneAndUpdate(
//       { _id: req.params.id },
//       { $push: { followers: req.user?.userId } },
//       { upsert: true, new: true, setDefaultsOnInsert: true },
//       async (err, userdetails) => {
//         if (err) {
//           return res.json({ success: false, message: err });
//         } else {
//           try {
//             await User.findOneAndUpdate(
//               { _id: req.user?.userId },
//               { $push: { following: userdetails._id } },
//               { upsert: true, new: true, setDefaultsOnInsert: true },
//               (err, userdetails) => {
//                 if (err) {
//                   return res.json({ success: false, message: err?.message });
//                 }
//                 return res.json({
//                   success: true,
//                   message: "followed",
//                   userdetails,
//                 });
//               }
//             );
//           } catch (error) {
//             return res.json({ success: false, message: error?.message });
//           }
//         }
//       }
//     );
//   } catch (error) {
//     res.json({ success: false, message: error?.message });
//   }
// });

//unfollow user
router.put("/unfollow/:id", async (req, res) => {
  if (req.user.userId === req.params.id) {
    return res.json({
      success: false,
      message: "you cannot unfollow yourself",
    });
  }
  try {
    const user = await User.findById(req.user.userId);
    const unfollow = await User.findById(req.params.id);
    user.following.pull(unfollow._id);
    unfollow.followers.pull(user._id);
    await user.save();
    await unfollow.save();
    res.json({ success: true, message: "unfollowed" });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

//follow user and add to following array
router.put("/follow/:id", async (req, res) => {
  if (req.user.userId === req.params.id) {
    return res.json({ success: false, message: "you cannot follow yourself" });
  }
  try {
    const user = await User.findById(req.user.userId);
    if (user.following.includes(req.params.id)) {
      return res.json({ success: false, message: "already following" });
    }
    const follow = await User.findById(req.params.id);
    if (follow.followers.includes(req.user.userId)) {
      return res.json({ success: false, message: "already following" });
    }
    if (!follow) {
      return res.json({ success: false, message: "user not found" });
    }
    user.following.push(follow._id);
    follow.followers.push(user._id);
    await user.save();
    await follow.save();

    res.json({ success: true, message: "followed" });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

//check if user is following already
router.get("/following/:id", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.following.includes(req.params.id)) {
      return res.json({ success: true, message: "following" });
    }
    return res.json({ success: false, message: "not following" });
  } catch (error) {
    res.json({ success: false, message: error });
  }
});

module.exports = router;
