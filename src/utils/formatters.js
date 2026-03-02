/**
 * Flatten Meta's nested actions array into a simple key-value object.
 * Meta returns: [{ action_type: "link_click", value: "42" }, ...]
 * We return:   { link_click: 42, purchase: 5, ... }
 */
function flattenActions(actions) {
  if (!Array.isArray(actions)) return {};
  const out = {};
  for (const a of actions) {
    out[a.action_type] = Number(a.value);
  }
  return out;
}

/**
 * Flatten cost_per_action_type the same way.
 * Returns: { link_click: 1.23, purchase: 45.67, ... }
 */
function flattenCostPerAction(costPerAction) {
  if (!Array.isArray(costPerAction)) return {};
  const out = {};
  for (const a of costPerAction) {
    out[a.action_type] = Number(a.value);
  }
  return out;
}

/**
 * Format a single insights row into a clean object.
 */
function formatInsightRow(row) {
  return {
    date_start: row.date_start,
    date_stop: row.date_stop,
    spend: Number(row.spend || 0),
    impressions: Number(row.impressions || 0),
    clicks: Number(row.inline_link_clicks || row.clicks || 0),
    ctr: Number(row.inline_link_click_ctr || row.ctr || 0),
    cpc: Number(row.cost_per_inline_link_click || row.cpc || 0),
    cpm: Number(row.cpm || 0),
    frequency: Number(row.frequency || 0),
    actions: flattenActions(row.actions),
    cost_per_action: flattenCostPerAction(row.cost_per_action_type),
    purchase_roas: row.purchase_roas
      ? Number(row.purchase_roas[0]?.value || 0)
      : 0,
    // Include breakdown fields if present
    ...(row.age && { age: row.age }),
    ...(row.gender && { gender: row.gender }),
    ...(row.publisher_platform && { platform: row.publisher_platform }),
    ...(row.device_platform && { device: row.device_platform }),
    ...(row.hourly_stats_aggregated_by_advertiser_time_zone && {
      hour: row.hourly_stats_aggregated_by_advertiser_time_zone,
    }),
  };
}

/**
 * Format a full insights API response.
 */
function formatInsights(response) {
  const data = response?.data || [];
  return data.map(formatInsightRow);
}

/**
 * Format currency value with symbol.
 */
function formatCurrency(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

module.exports = { formatInsights, formatInsightRow, formatCurrency, flattenActions, flattenCostPerAction };
