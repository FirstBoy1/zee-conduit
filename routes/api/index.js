const router = require("express").Router();

const users = require("./users.route");
const articles = require("./articles.route");
const tags = require("./tags.route");
const profiles = require('./profiles.route');

router.use("/", users);
router.use("/articles", articles);
router.use("/tags", tags);
router.use('/profiles', profiles);

router.use(function(err, req, res, next) {
  if (err.name === "ValidationError") {
    return res.status(422).send({
      errors: Object.keys(err.errors).reduce(function(errors, key) {
        errors[key] = err.errors[key].message;

        return errors;
      }, {})
    });
  }

  return next(err);
});

module.exports = router;
