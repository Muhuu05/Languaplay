function ensureApiPrefix(req) {
  const [pathname, query = ""] = req.url.split("?");
  if (pathname === "/api" || pathname.startsWith("/api/")) return;

  req.url = `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  if (query) req.url += `?${query}`;
}

module.exports = async (req, res) => {
  ensureApiPrefix(req);

  const { default: app } = await import("../Backend/api-server/dist/app.mjs");
  return app(req, res);
};
