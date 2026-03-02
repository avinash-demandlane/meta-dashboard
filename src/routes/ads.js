const { Router } = require("express");
const meta = require("../services/meta");
const { formatInsights } = require("../utils/formatters");

const router = Router();

// GET /api/ads/accounts — list all configured ad accounts
router.get("/accounts", async (req, res, next) => {
  try {
    const data = await meta.getAllAccounts();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/account?account_id= — ad account info
router.get("/account", async (req, res, next) => {
  try {
    const { account_id } = req.query;
    const data = await meta.getAccountInfo(account_id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/campaigns?account_id=&date_from=&date_to=
router.get("/campaigns", async (req, res, next) => {
  try {
    const { account_id, date_from, date_to } = req.query;
    const data = await meta.getCampaigns(account_id, date_from, date_to);
    res.json({ success: true, data: data.data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/adsets?account_id=&date_from=&date_to=
router.get("/adsets", async (req, res, next) => {
  try {
    const { account_id, date_from, date_to } = req.query;
    const data = await meta.getAdsets(account_id, date_from, date_to);
    res.json({ success: true, data: data.data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/insights?account_id=&date_from=&date_to=&breakdown=&campaign_ids=
router.get("/insights", async (req, res, next) => {
  try {
    const { account_id, date_from, date_to, breakdown, campaign_ids } = req.query;
    const ids = campaign_ids ? campaign_ids.split(",").filter(Boolean) : undefined;
    const raw = await meta.getInsights(account_id, date_from, date_to, breakdown, ids);
    res.json({ success: true, data: formatInsights(raw) });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/insights/daily?account_id=&date_from=&date_to=&campaign_ids=
router.get("/insights/daily", async (req, res, next) => {
  try {
    const { account_id, date_from, date_to, campaign_ids } = req.query;
    const ids = campaign_ids ? campaign_ids.split(",").filter(Boolean) : undefined;
    const raw = await meta.getDailyInsights(account_id, date_from, date_to, ids);
    res.json({ success: true, data: formatInsights(raw) });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/insights/hourly?account_id=&date_from=&date_to=&campaign_ids=
router.get("/insights/hourly", async (req, res, next) => {
  try {
    const { account_id, date_from, date_to, campaign_ids } = req.query;
    const ids = campaign_ids ? campaign_ids.split(",").filter(Boolean) : undefined;
    const raw = await meta.getHourlyInsights(account_id, date_from, date_to, ids);
    res.json({ success: true, data: formatInsights(raw) });
  } catch (err) {
    next(err);
  }
});

// GET /api/ads/creatives?account_id=&date_from=&date_to=
router.get("/creatives", async (req, res, next) => {
  try {
    const { account_id, date_from, date_to } = req.query;
    const data = await meta.getAds(account_id, date_from, date_to);
    res.json({ success: true, data: data.data || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
