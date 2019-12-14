const express = require("express");
const mongoose = require("mongoose");
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');

const prod = require('./config/prod');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
prod(app);

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("connection established");
});

require("./models/user.model");
require("./models/article.model");
require("./models/comment.model");
require("./config/passport");

app.use(require("./routes"));

app.use(function(err, req, res, next) {
  console.log({ err });
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {}
    }
  });
});

const server = app.listen(process.env.PORT || 5000, () =>
  console.log("server started at " + server.address().port)
);
