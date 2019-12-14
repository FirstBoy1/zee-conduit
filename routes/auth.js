const jwt = require("express-jwt");

const getTokenFromHeader = req => {
  return req.headers.authorization || null;
};

const secret = require("../config").SECRET;

const auth = {
  required: jwt({
    secret: secret,
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret: secret,
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
};

module.exports = auth;
