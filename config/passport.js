const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const User = mongoose.model("User");

passport.use(
  new LocalStrategy(
    {
      usernameField: "user[email]",
      passwordField: "user[password]"
    },
    async function(email, password, done) {
      try {
        const user = await User.findOne({ email });
        if (!user || !await user.validPassword(password)) {
          return done(null, false, {
            errors: { "email or password": "is invalid" }
          });
        }

        return done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
