const axios = require("axios");

const BASE_URL = "https://graph.facebook.com/v21.0";

function getAccountIds() {
  const multi = process.env.META_AD_ACCOUNT_IDS;
  if (multi) {
    return multi.split(",").map((id) => id.trim()).filter(Boolean);
  }
  const single = process.env.META_AD_ACCOUNT_ID;
  if (single) return [single.trim()];
  return [];
}

function getClient(accountId) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error("META_ACCESS_TOKEN must be set in .env");
  }
  const resolvedId = accountId || getAccountIds()[0];
  if (!resolvedId) {
    throw new Error("No ad account ID configured. Set META_AD_ACCOUNT_IDS or META_AD_ACCOUNT_ID in .env");
  }
  return { token, accountId: resolvedId };
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
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  return { from, to };
}

async function getAccountInfo(accountId) {
  const { accountId: id } = getClient(accountId);
  return metaGet(id, {
    fields: "name,currency,account_status,amount_spent,balance,timezone_name",
  });
}

async function getAllAccounts() {
  const ids = getAccountIds();
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const info = await getAccountInfo(id);
        return { id: info.id, name: info.name, currency: info.currency, timezone: info.timezone_name };
      } catch {
        return { id, name: id, currency: "?", timezone: "?" };
      }
    })
  );
  return results;
}

async function getCampaigns(accountId, dateFrom, dateTo) {
  const { accountId: id } = getClient(accountId);
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const timeRange = JSON.stringify({
    since: dates.from,
    until: dates.to,
  });

  return metaGet(`${id}/campaigns`, {
    fields: [
      "name",
      "status",
      "objective",
      `insights.time_range(${timeRange}){spend,impressions,clicks,ctr,cpc,cpm,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,cost_per_action_type,purchase_roas}`,
    ].join(","),
    limit: 200,
  });
}

async function getAdsets(accountId, dateFrom, dateTo) {
  const { accountId: id } = getClient(accountId);
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const timeRange = JSON.stringify({
    since: dates.from,
    until: dates.to,
  });

  return metaGet(`${id}/adsets`, {
    fields: [
      "name",
      "status",
      "campaign{name}",
      `insights.time_range(${timeRange}){spend,impressions,clicks,ctr,cpc,cpm,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,cost_per_action_type}`,
    ].join(","),
    limit: 200,
  });
}

async function getInsights(accountId, dateFrom, dateTo, breakdown, campaignIds) {
  const { accountId: id } = getClient(accountId);
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const params = {
    fields: "spend,impressions,clicks,ctr,cpc,cpm,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,cost_per_action_type,purchase_roas",
    time_range: JSON.stringify({ since: dates.from, until: dates.to }),
  };

  const validBreakdowns = ["age", "gender", "publisher_platform", "device_platform"];
  if (breakdown) {
    const mapped = breakdown === "placement" ? "publisher_platform" : breakdown === "device" ? "device_platform" : breakdown;
    if (validBreakdowns.includes(mapped)) {
      params.breakdowns = mapped;
    }
  }

  if (campaignIds && campaignIds.length > 0) {
    params.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]);
  }

  return metaGet(`${id}/insights`, params);
}

async function getDailyInsights(accountId, dateFrom, dateTo, campaignIds) {
  const { accountId: id } = getClient(accountId);
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const params = {
    fields: "spend,impressions,clicks,ctr,cpc,cpm,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,cost_per_action_type,purchase_roas",
    time_range: JSON.stringify({ since: dates.from, until: dates.to }),
    time_increment: 1,
    limit: 90,
  };

  if (campaignIds && campaignIds.length > 0) {
    params.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]);
  }

  return metaGet(`${id}/insights`, params);
}

async function getHourlyInsights(accountId, dateFrom, dateTo, campaignIds) {
  const { accountId: id } = getClient(accountId);
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const params = {
    fields: "spend,impressions,clicks,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,cost_per_action_type",
    time_range: JSON.stringify({ since: dates.from, until: dates.to }),
    breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
    limit: 500,
  };

  if (campaignIds && campaignIds.length > 0) {
    params.filtering = JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]);
  }

  return metaGet(`${id}/insights`, params);
}

async function getAds(accountId, dateFrom, dateTo) {
  const { accountId: id } = getClient(accountId);
  const dates = dateFrom && dateTo
    ? { from: dateFrom, to: dateTo }
    : defaultDateRange();

  const timeRange = JSON.stringify({
    since: dates.from,
    until: dates.to,
  });

  return metaGet(`${id}/ads`, {
    fields: [
      "id",
      "name",
      "status",
      "campaign{name}",
      "adset{name}",
      "adcreatives{thumbnail_url,body,title,call_to_action_type,image_url}",
      `insights.time_range(${timeRange}){spend,impressions,clicks,ctr,cpc,cpm,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,cost_per_action_type,purchase_roas}`,
    ].join(","),
    limit: 200,
  });
}

module.exports = { getAccountIds, getAccountInfo, getAllAccounts, getCampaigns, getAdsets, getInsights, getDailyInsights, getHourlyInsights, getAds };
