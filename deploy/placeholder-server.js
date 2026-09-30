"use strict";

// Stand-in HTTP server used only until the Next.js app image replaces this
// Dockerfile stage. Listens on PORT (default 3000) so nginx can proxy to it.

const http = require("node:http");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOSTNAME || "0.0.0.0";

const server = http.createServer((req, res) => {
  const path = (req.url || "/").split("?")[0];

  if (path === "/health") {
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end("ok\n");
    return;
  }

  if (path === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "Stackforge-Iquee deploy placeholder. Frontend owns the Next.js app build.\n",
    );
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found\n");
});

server.listen(port, host, () => {
  process.stdout.write(`placeholder listening on ${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
