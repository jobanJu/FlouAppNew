const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

function send(res, status, content, type = "text/plain") {
  res.writeHead(status, { "Content-Type": type });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // HEALTH CHECK (Railway)
  if (pathname === "/health" || pathname === "/status") {
    return send(res, 200, JSON.stringify({ status: "ok" }), "application/json");
  }

  // ROOT → index.html
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.join(publicDir, pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, "Not Found");
    }

    const ext = path.extname(filePath);
    const contentType =
      ext === ".html" ? "text/html" :
      ext === ".css" ? "text/css" :
      ext === ".js" ? "application/javascript" :
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".svg" ? "image/svg+xml" :
      ext === ".gif" ? "image/gif" :
      "text/plain";

    send(res, 200, data, contentType);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

