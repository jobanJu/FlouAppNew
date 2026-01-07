const { listUsers, findUser, addUser } = require("../controllers/users.controller");

async function handleUsers(req, res, pathname, method, helpers) {
  const { sendJson, parseJsonBody } = helpers;

  if (method === "GET" && pathname === "/users") {
    sendJson(res, 200, listUsers());
    return true;
  }

  if (method === "GET" && pathname.startsWith("/users/")) {
    const id = pathname.split("/")[2];
    const user = findUser(id);
    if (!user) {
      sendJson(res, 404, { error: "User not found" });
      return true;
    }
    sendJson(res, 200, user);
    return true;
  }

  if (method === "POST" && pathname === "/users") {
    try {
      const body = await parseJsonBody(req);
      const user = addUser(body);
      sendJson(res, 201, user);
    } catch (err) {
      sendJson(res, 400, { error: err.message || "Invalid JSON" });
    }
    return true;
  }

  return false;
}

module.exports = { handleUsers };
