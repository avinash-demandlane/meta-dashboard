require("dotenv").config();
const express = require("express");
const cors = require("cors");
const adsRouter = require("./routes/ads");

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required env vars
if (!process.env.META_ACCESS_TOKEN) {
  console.warn("\n⚠  Missing env var: META_ACCESS_TOKEN");
  console.warn("   Copy .env.example to .env and fill in your Meta credentials.\n");
}
if (!process.env.META_AD_ACCOUNT_IDS && !process.env.META_AD_ACCOUNT_ID) {
  console.warn("\n⚠  Missing env var: META_AD_ACCOUNT_IDS (or META_AD_ACCOUNT_ID)");
  console.warn("   Set at least one ad account ID in .env.\n");
}

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/ads", adsRouter);

// Health check (fallback if no index.html)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    endpoints: [
      "GET /api/ads/accounts",
      "GET /api/ads/account?account_id=",
      "GET /api/ads/campaigns?account_id=&date_from=&date_to=",
      "GET /api/ads/insights?account_id=&date_from=&date_to=&breakdown=age|gender|placement|device",
      "GET /api/ads/insights/daily?account_id=&date_from=&date_to=",
      "GET /api/ads/creatives?account_id=&date_from=&date_to=",
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
