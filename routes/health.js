function handleHealth(req, res, pathname, method, sendJson) {
  if (method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return true;
  }
  return false;
}

module.exports = { handleHealth };
