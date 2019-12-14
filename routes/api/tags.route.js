const router = require("express").Router();
const mongoose = require("mongoose");
const Article = mongoose.model("Article");

router.get("/", async (req, res, next) => {
  try {
    const tags = await Article.find().distinct("tagList");
    res.send({ tags });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
