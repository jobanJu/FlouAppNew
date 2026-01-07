const matchesModel = require("../models/matches.model");

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

module.exports = (req, res, pathname) => {
  // GET /matches - list all matches
  if (req.method === "GET" && pathname === "/matches") {
    try {
      const matches = matchesModel.getMatches();
      return send(res, 200, matches);
    } catch (error) {
      console.error("Error:", error);
      return send(res, 500, { error: "Internal server error" });
    }
  }

  // GET /matches/:id - get specific match
  if (req.method === "GET" && pathname.startsWith("/matches/")) {
    try {
      const id = pathname.split("/")[2];
      const match = matchesModel.getMatchById(id);
      if (!match) {
        return send(res, 404, { error: "Match not found" });
      }
      return send(res, 200, match);
    } catch (error) {
      console.error("Error:", error);
      return send(res, 500, { error: "Internal server error" });
    }
  }

  // POST /matches - create new match
  if (req.method === "POST" && pathname === "/matches") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const newMatch = matchesModel.createMatch(payload);
        return send(res, 201, newMatch);
      } catch (error) {
        console.error("Error:", error);
        return send(res, 400, { error: "Invalid request" });
      }
    });
    return;
  }

  return send(res, 404, { error: "Not found" });
};

