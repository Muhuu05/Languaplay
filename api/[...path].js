module.exports = async (req, res) => {
  const { default: app } = await import("../Backend/api-server/dist/app.mjs");
  return app(req, res);
};
