const axios = require("axios");

const BASE_URL = "https://graph.facebook.com/v21.0";

function getClient() {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set in .env");
  }

  return { token, accountId };
}

function buildUrl(path, params = {}) {
  const { token } = getClient();
  const url = new URL(`${BASE_URL}/${path}`);
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function metaGet(path, params = {}) {
  const url = buildUrl(path, params);
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    const meta = err.response?.data?.error;
    if (meta) {
      const error = new Error(meta.message);
      error.status = meta.code === 17 ? 429 : err.response.status;
      error.meta = meta;
      throw error;
    }
    throw err;
  }
}

function defaultDateRange() {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return { from, to };
}

async function getAccountInfo() {
  const { accountId } = getClient();
  return metaGet(accountId, {
    fields: "name,currency,account_status,amount_spent,balance",
  });
}

async function getCampaigns(dateFrom, dateTo) {
  const { accountId } = getClient();
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const timeRange = JSON.stringify({
    since: dates.from,
    until: dates.to,
  });

  return metaGet(`${accountId}/campaigns`, {
    fields: [
      "name",
      "status",
      "objective",
      `insights.time_range(${timeRange}){spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type,purchase_roas}`,
    ].join(","),
    limit: 100,
  });
}

async function getInsights(dateFrom, dateTo, breakdown) {
  const { accountId } = getClient();
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const params = {
    fields: "spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type,purchase_roas",
    time_range: JSON.stringify({ since: dates.from, until: dates.to }),
  };

  const validBreakdowns = ["age", "gender", "publisher_platform", "device_platform"];
  if (breakdown) {
    const mapped = breakdown === "placement" ? "publisher_platform" : breakdown === "device" ? "device_platform" : breakdown;
    if (validBreakdowns.includes(mapped)) {
      params.breakdowns = mapped;
    }
  }

  return metaGet(`${accountId}/insights`, params);
}

async function getDailyInsights(dateFrom, dateTo) {
  const { accountId } = getClient();
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  return metaGet(`${accountId}/insights`, {
    fields: "spend,impressions,clicks,ctr,cpc,cpm,actions,cost_per_action_type,purchase_roas",
    time_range: JSON.stringify({ since: dates.from, until: dates.to }),
    time_increment: 1,
    limit: 90,
  });
}

module.exports = { getAccountInfo, getCampaigns, getInsights, getDailyInsights };
