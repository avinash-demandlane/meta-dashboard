const { Router } = require("express");
const meta = require("../services/meta");
const { formatInsights } = require("../utils/formatters");

const router = Router();

// GET /api/ads/account — ad account info
router.get("/account", async (req, res, next) => {
  try {
    const data = await meta.getAccountInfo();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/campaigns?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
router.get("/campaigns", async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    const data = await meta.getCampaigns(date_from, date_to);
    res.json({ success: true, data: data.data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/insights?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&breakdown=age|gender|placement|device
router.get("/insights", async (req, res, next) => {
  try {
    const { date_from, date_to, breakdown } = req.query;
    const raw = await meta.getInsights(date_from, date_to, breakdown);
    res.json({ success: true, data: formatInsights(raw) });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/insights/daily?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
router.get("/insights/daily", async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;
    const raw = await meta.getDailyInsights(date_from, date_to);
    res.json({ success: true, data: formatInsights(raw) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
