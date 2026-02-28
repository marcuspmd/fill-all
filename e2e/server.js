// @ts-nocheck
const http = require("http");
const fs = require("fs");
const path = require("path");

const PAGES_DIR = path.join(__dirname, "pages");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url === "/" ? "/test-form.html" : (req.url || "/");
  const filePath = path.join(PAGES_DIR, urlPath.replace(/^\//, ""));

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const mime = MIME[ext] ?? "text/plain";
    res.writeHead(200, { "Content-Type": mime });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found: " + urlPath);
  }
});

server.listen(8765, () => {
  console.log("E2E test server running at http://localhost:8765");
});
