const router = require("express").Router();
const mongoose = require("mongoose");
const passport = require("passport");
const auth = require("../auth");

const User = mongoose.model("User");

router.get("/user", auth.required, async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) return res.sendStatus(401);
    return res.json({ user: user.toAuthJSON() });
  } catch (err) {
    next(err);
  }
});

router.put('/user', auth.required, async (req, res, next) => {
  try {

    const {id} = req.user;
    const {username, email, bio, image, password} = req.body.user;
    let user = await User.findById(id);
    if(!user) return res.sendStatus(401);
  
    typeof username !== 'undefined' && (user.username = username);
    typeof email !== 'undefined' && (user.email = email);
    typeof bio !== 'undefined' && (user.bio = bio);
    typeof image !== 'undefined' && (user.image = image);
    typeof password !== 'undefined' && await user.setPassword(password);

    user = await user.save();
    res.send({user: user.toAuthJSON()});
  } catch(err) {
    next(err);
  }
})

router.post("/users/login", async (req, res, next) => {
  if (!req.body.user.email)
    return res.status(422).send({ errors: { email: "can't be blank" } });

  if (!req.body.user.email)
    return res.status(422).send({ errors: { email: "can't be blank" } });

  await passport.authenticate("local", { session: false }, function(
    err,
    user,
    info
  ) {
    if (err) return next(err);

    if (user) {
      res.send({ user: user.toAuthJSON() });
    } else {
      return res.status(422).send(info);
    }
  })(req, res, next);
});

router.post("/users", async (req, res, next) => {
  const { username, email, password } = req.body.user;

  try {
    let user = new User({ username, email });
    await user.setPassword(password);
    user = await user.save();

    res.send({user: user.toAuthJSON()});
  } catch (err) {
    next(err);
  }
});

module.exports = router;
