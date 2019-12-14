const router = require("express").Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const auth = require("../auth");

router.param("username", async (req, res, next, username) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return res.sendStatus(404);

    req.profile = user;
    next();
  } catch (err) {
    next(err);
  }
});

router.get("/:username", auth.optional, async (req, res, next) => {
  try {
    if (!req.user)
      return res.send({ profile: req.profile.toProfileJSONFor(false) });

    const loggedUser = await User.findById(req.user.id);
    if (!loggedUser)
      return res.send({ profile: req.profile.toProfileJSONFor(false) });

    res.send({ profile: req.profile.toProfileJSONFor(loggedUser) });
  } catch (err) {
    next(err);
  }
});

router.post('/:username/follow', auth.required, async (req, res, next) => {
    try {
        const loggedUser = await User.findById(req.user.id);
        if(!loggedUser) return res.sendStatus(401);

        const profileId = req.profile._id;
        await loggedUser.follow(profileId);

        res.send({profile: req.profile.toProfileJSONFor(loggedUser)});
    } catch(err) {
        next(err);
    }
})

router.delete('/:username/follow', auth.required, async (req, res, next) => {
    try {
        const loggedUser = await User.findById(req.user.id);
        if(!loggedUser) return res.sendStatus(401);

        const profileId = req.profile._id;
        await loggedUser.unfollow(profileId);

        res.send({profile: req.profile.toProfileJSONFor(loggedUser)});
    } catch(err) {
        next(err);
    }
})

module.exports = router;
