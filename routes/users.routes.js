const usersController = require("../controllers/users.controller");

module.exports = (req, res, parsedUrl) => {
  if (parsedUrl.pathname.startsWith("/users")) {
    return usersController(req, res, parsedUrl);
  }
  return false;
};
