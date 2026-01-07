const { listMatches, findMatch, addMatch } = require("../controllers/matches.controller");

async function handleMatches(req, res, pathname, method, helpers) {
  const { sendJson, parseJsonBody } = helpers;

  if (method === "GET" && pathname === "/matches") {
    sendJson(res, 200, listMatches());
    return true;
  }

  if (method === "GET" && pathname.startsWith("/matches/")) {
    const id = pathname.split("/")[2];
    const match = findMatch(id);
    if (!match) {
      sendJson(res, 404, { error: "Match not found" });
      return true;
    }
    sendJson(res, 200, match);
    return true;
  }

  if (method === "POST" && pathname === "/matches") {
    try {
      const body = await parseJsonBody(req);
      const match = addMatch(body);
      sendJson(res, 201, match);
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Invalid JSON" });
    }
    return true;
  }

  return false;
}

module.exports = { handleMatches };
