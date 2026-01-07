const matchesController = require("../controllers/matches.controller");

module.exports = (req, res, parsedUrl) => {
  if (parsedUrl.pathname.startsWith("/matches")) {
    return matchesController(req, res, parsedUrl);
  }
  return false;
};
