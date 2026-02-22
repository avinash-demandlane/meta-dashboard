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
    clicks: Number(row.clicks || 0),
    ctr: Number(row.ctr || 0),
    cpc: Number(row.cpc || 0),
    cpm: Number(row.cpm || 0),
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
function formatCurrency(value, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value / 100); // Meta returns amounts in smallest currency unit
}

module.exports = { formatInsights, formatInsightRow, formatCurrency, flattenActions, flattenCostPerAction };
