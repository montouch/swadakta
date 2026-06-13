const { handleSumsubWebhook } = require("./start-verification");

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  await handleSumsubWebhook(req, res);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
