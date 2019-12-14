const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    body: String,
    article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// requires population of author
CommentSchema.methods.toJSONFor = function(user) {
  const { _id: id, body, createdAt } = this;
  return { id, body, createdAt, author: this.author.toProfileJSONFor(user) };
};

module.exports = mongoose.model("Comment", CommentSchema);
