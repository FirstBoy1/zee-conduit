const mongoose = require("mongoose");
const router = require("express").Router();
const auth = require("../auth");

const User = mongoose.model("User");
const Article = mongoose.model("Article");
const Comment = mongoose.model("Comment");

router.param("article", async (req, res, next, slug) => {
  try {
    const article = await Article.findOne({ slug }).populate("author");

    if (!article) return res.sendStatus(404);

    req.article = article;
    return next();
  } catch (err) {
    next(err);
  }
});

router.param("comment", async (req, res, next, commentId) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.sendStatus(404);

    req.comment = comment;

    next();
  } catch (err) {
    next(err);
  }
});

// GLOBAL FEED
router.get("/", auth.optional, async (req, res, next) => {
  let {user} = req;

  let {
    query = {},
    limit = 20,
    offset = 0,
    favorited,
    author,
    tag
  } = req.query;

  let favoriter;

  tag && (query.tagList = { $in: [tag] });
  author && (author = await User.findOne({ username: author }));
  favorited && (favoriter = await User.findOne({ username: favorited }));

  author && author._id && (query.author = author._id);
  favoriter && (query._id = { $in: favoriter.favorites });

  let articles = await Article.find(query)
    .limit(+limit)
    .skip(+offset)
    .sort({ createdAt: "desc" })
    .populate("author")
    .exec();

  user && (user = await User.findById(user.id));

  articles = articles.map(article => article.toJSONFor(user));

  res.send({articles});
});

// FEED ROUTE MEANS ARTICLES OF FOLLOWING  USERS
router.get("/feed", auth.required, async (req, res, next) => {
  try {
    let { limit = 20, offset = 0 } = req.query;

    const user = await User.findById(req.user.id);
    if (!user) return res.sendStatus(401);

    let articles = await Article.find({ author: { $in: user.following } })
      .limit(+limit)
      .skip(+offset)
      .populate("author")
      .exec();

    articles = articles.map(article => article.toJSONFor(user));

    const articlesCount = await Article.countDocuments({
      author: { $in: user.following }
    });

    res.send({ articles, articlesCount });
  } catch (err) {
    next(err);
  }
});

router.post("/", auth.required, async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) return res.sendStatus(401);

    let { article } = req.body;
    article = new Article(article);
    article.author = user;

    article = await article.save();

    res.send({ article: article.toJSONFor(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/:article", auth.optional, async (req, res, next) => {
  try {
    const { article } = req;
    res.send({ article: article.toJSONFor() });
  } catch (err) {
    next(err);
  }
});

router.put("/:article", auth.required, async (req, res, next) => {
  try {
    let { article } = req;
    const user = await User.findById(req.user.id);

    if (!user) return res.sendStatus(401);

    if (article.author._id.toString() !== user._id.toString())
      return res.sendStatus(403);

    const { title, description, body, tagList } = req.body.article;

    typeof title !== "undefined" && (article.title = title);
    typeof description !== "undefined" && (article.description = description);
    typeof body !== "undefined" && (article.body = body);
    typeof tagList !== "undefined" && (article.tagList = tagList);

    article = await article.save();
    res.send({ article: article.toJSONFor(user) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:article", auth.required, async (req, res, next) => {
  try {
    let { article } = req;
    const user = await User.findById(req.user.id);

    if (!user) return res.sendStatus(401);

    if (article.author._id.toString() !== user._id.toString())
      return res.sendStatus(403);

    await article.remove();
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.post("/:article/favorite", auth.required, async (req, res, next) => {
  try {
    const articleId = req.article._id;
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return res.sendStatus(401);

    await user.favorite(articleId);
    let article = await req.article.updateFavoriteCount();
    res.send({ article: article.toJSONFor(user) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:article/favorite", auth.required, async (req, res, next) => {
  try {
    const articleId = req.article._id;
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return res.sendStatus(401);

    await user.unfavorite(articleId);
    let article = await req.article.updateFavoriteCount();
    res.send({ article: article.toJSONFor(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/:article/comments", auth.required, async (req, res, next) => {
  try {
    let { article } = req;
    let { comment } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.sendStatus(401);

    comment = new Comment(comment);
    comment.article = article;
    comment.author = user;

    comment = await comment.save();
    article.comments.push(comment);

    await article.save();

    res.send({ comment: comment.toJSONFor(user) });
  } catch (err) {
    next(err);
  }
});

const getComments = async article => {
  await article
    .populate({
      path: "comments",
      populate: {
        path: "author"
      },
      options: {
        sort: {
          createdAt: "desc"
        }
      }
    })
    .execPopulate();

  return article.comments.map(comment => comment.toJSONFor());
};

// returns an article's comments
router.get("/:article/comments", auth.optional, async (req, res, next) => {
  try {
    const { article } = req;
    const comments = await getComments(article);

    res.send({ comments });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:article/comments/:comment",
  auth.required,
  async (req, res, next) => {
    try {
      const { comment, article, user } = req;

      if (comment.author.toString() !== user.id.toString())
        return res.sendStatus(403);

      article.comments.remove(comment._id);
      await article.save();
      await comment.remove();

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
