const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Import routes
const healthRoute = require("./routes/health");
const usersRoutes = require("./routes/users.routes");
const matchesRoutes = require("./routes/matches.routes");

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

console.log("Starting server...");
console.log("PORT:", PORT);
console.log("Public dir:", publicDir);

function send(res, status, content, type = "text/plain") {
  try {
    res.writeHead(status, { "Content-Type": type });
    res.end(content);
  } catch (err) {
    console.error("Error sending response:", err);
  }
}

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    console.log("Request:", req.method, pathname);

    // HEALTH CHECK (Railway)
    if (pathname === "/health" || pathname === "/status") {
      return send(res, 200, JSON.stringify({ status: "ok" }), "application/json");
    }

    // API ROUTES
    if (pathname === "/users" || pathname.startsWith("/users/")) {
      return usersRoutes(req, res, pathname);
    }

    if (pathname === "/matches" || pathname.startsWith("/matches/")) {
      return matchesRoutes(req, res, pathname);
    }

    // ROOT → index.html
    if (pathname === "/") pathname = "/index.html";

    const filePath = path.join(publicDir, pathname);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log("File not found:", filePath);
        return send(res, 404, "Not Found");
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === ".html" ? "text/html" :
        ext === ".css" ? "text/css" :
        ext === ".js" ? "application/javascript" :
        ext === ".png" ? "image/png" :
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
        ext === ".svg" ? "image/svg+xml" :
        ext === ".gif" ? "image/gif" :
        ext === ".mp4" ? "video/mp4" :
        "application/octet-stream";

      send(res, 200, data, contentType);
    });
  } catch (err) {
    console.error("Server error:", err);
    send(res, 500, "Internal Server Error");
  }
});

server.on("error", (err) => {
  console.error("Server error event:", err);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Server running on port", PORT);
  console.log("✅ http://localhost:" + PORT);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});


