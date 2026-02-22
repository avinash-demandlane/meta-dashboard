require("dotenv").config();
const express = require("express");
const cors = require("cors");
const adsRouter = require("./routes/ads");

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required env vars
const required = ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`\n⚠  Missing env vars: ${missing.join(", ")}`);
  console.warn("   Copy .env.example to .env and fill in your Meta credentials.\n");
}

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/ads", adsRouter);

// Health check
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    endpoints: [
      "GET /api/ads/account",
      "GET /api/ads/campaigns?date_from=&date_to=",
      "GET /api/ads/insights?date_from=&date_to=&breakdown=age|gender|placement|device",
      "GET /api/ads/insights/daily?date_from=&date_to=",
    ],
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message,
    ...(err.meta && { meta_error: err.meta }),
  });
});

app.listen(PORT, () => {
  console.log(`Meta Ads Dashboard API running on http://localhost:${PORT}`);
});
