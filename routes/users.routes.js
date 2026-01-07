const usersController = require("../controllers/users.controller");

module.exports = (req, res, pathname) => {
  return usersController(req, res, pathname);
};
