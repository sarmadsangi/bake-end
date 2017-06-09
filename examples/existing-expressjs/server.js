const express = require("express");
const BakeEnd = require("../../dist/main");

const app = express();

app.get("/restofmyapp", function(req, res) {
  res.send("Rest Of My App");
});

BakeEnd({
  mongoURL: "mongodb://128.199.105.140:27017/test_yo",
  dataRequirements: {
    User: {
      title: { type: String },
      content: { type: String }
    }
  },
  gqlMiddleware: (req, res, next) => {
    req.user = {
      name: "sarmad"
    };
    req.permissions = {
      User: { canView: true, canRemove: false, canUpdate: false }
    };
    next();
  },
  app: app
}).run();
