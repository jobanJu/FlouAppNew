const matchesController = require("../controllers/matches.controller");

module.exports = (req, res, pathname) => {
  return matchesController(req, res, pathname);
};
