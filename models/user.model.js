const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const secret = process.env.SECRET;

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, "can't be blank"],
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      index: true
    },
    bio: String,
    image: String,
    hash: String,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

UserSchema.plugin(uniqueValidator, { message: "already exists" });

UserSchema.methods.setPassword = async function(password) {
  this.hash = await bcrypt.hash(password, 10);
};

UserSchema.methods.validPassword = async function(password) {
  return await bcrypt.compare(password, this.hash);
};

UserSchema.methods.toAuthJSON = function() {
  const { username, email, bio, image } = this;
  return { username, email, bio, image, token: this.generateJWT() };
};

UserSchema.methods.toProfileJSONFor = function(user) {
  const { username, bio } = this;
  const image =
    this.image || "https://static.productionready.io/images/smiley-cyrus.jpg";
  const following = user ? user.isFollowing(this._id) : false;

  return { username, bio, image, following };
};


UserSchema.methods.generateJWT = function() {
  return jwt.sign({ id: this._id, username: this.username }, secret, {
    expiresIn: "1d"
  });
};

UserSchema.methods.favorite = async function(id) {
  if(this.favorites.indexOf(id) === -1) {
    this.favorites.push(id);
  }

  return await this.save();
}

UserSchema.methods.unfavorite = async function(id) {
  this.favorites.remove(id);
  return await this.save();
}

UserSchema.methods.follow = async function(id) {
  if(this.following.indexOf(id) === -1) {
    this.following.push(id);
  }

  return await this.save();
}

UserSchema.methods.unfollow = async function(id) {
  this.following.remove(id);
  return await this.save();
}

UserSchema.methods.isFollowing = function(id) {
  return this.following.some(user => user._id.toString() === id.toString());
};

module.exports = mongoose.model("User", UserSchema);
