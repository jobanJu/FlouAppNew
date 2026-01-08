const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const { RtcTokenBuilder, RtcRole } = require("agora-token");

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

// Agora Configuration
const AGORA_APP_ID = '2d6f68f6a59b4622ac64393266c8f828';
const AGORA_APP_CERTIFICATE = '166070eec4344f8e8374f701324d5c6a';

console.log("Starting server...");
console.log("PORT:", PORT);
console.log("Public dir:", publicDir);

// ==================== AGORA TOKEN GENERATION ====================
function generateRtcToken(channelName, uid, role, expireTime) {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;
  
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
  
  return token;
}
// ==================== END AGORA TOKEN ====================

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

    console.log("Request:", pathname);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // HEALTH CHECK (Railway)
    if (pathname === "/health" || pathname === "/status") {
      return send(res, 200, JSON.stringify({ status: "ok" }), "application/json");
    }

    // AGORA TOKEN API
    if (pathname === "/api/agora-token") {
      const query = parsedUrl.query;
      const channelName = query.channel;
      const uid = parseInt(query.uid) || 0;
      const role = query.role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
      const expireTime = 3600; // 1 hour

      if (!channelName) {
        return send(res, 400, JSON.stringify({ error: 'Channel name required' }), "application/json");
      }

      try {
        const token = generateRtcToken(channelName, uid, role, expireTime);
        console.log('Token generated for channel:', channelName);
        return send(res, 200, JSON.stringify({ token, appId: AGORA_APP_ID }), "application/json");
      } catch (tokenError) {
        console.error('Token generation error:', tokenError);
        return send(res, 500, JSON.stringify({ error: 'Token generation failed' }), "application/json");
      }
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

