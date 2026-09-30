/** Compose and nginx probe this path. It must stay anonymous. */
export function GET() {
  return new Response("ok\n", {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
