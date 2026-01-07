const usersModel = require("../models/users.model");

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

module.exports = (req, res, pathname) => {
  // GET /users - list all users
  if (req.method === "GET" && pathname === "/users") {
    try {
      const users = usersModel.getUsers();
      return send(res, 200, users);
    } catch (error) {
      console.error("Error:", error);
      return send(res, 500, { error: "Internal server error" });
    }
  }

  // GET /users/:id - get specific user
  if (req.method === "GET" && pathname.startsWith("/users/")) {
    try {
      const id = pathname.split("/")[2];
      const user = usersModel.getUserById(id);
      if (!user) {
        return send(res, 404, { error: "User not found" });
      }
      return send(res, 200, user);
    } catch (error) {
      console.error("Error:", error);
      return send(res, 500, { error: "Internal server error" });
    }
  }

  // POST /users - create new user
  if (req.method === "POST" && pathname === "/users") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const newUser = usersModel.createUser(payload);
        return send(res, 201, newUser);
      } catch (error) {
        console.error("Error:", error);
        return send(res, 400, { error: "Invalid request" });
      }
    });
    return;
  }

  return send(res, 404, { error: "Not found" });
};
