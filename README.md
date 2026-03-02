# Meta Ads Performance Dashboard API

Node.js/Express app that fetches ad performance data from the Meta Marketing API.

## Meta App Setup (Step by Step)

### 1. Create a Meta App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Select **Other** → **Business** type
4. Give it a name (e.g. "Ads Dashboard") and select your Business Portfolio
5. Click **Create App**

### 2. Add the Marketing API
1. In your app dashboard, click **Add Product**
2. Find **Marketing API** and click **Set Up**

### 3. Get Your Credentials
1. Go to **App Settings** → **Basic**
2. Copy your **App ID** and **App Secret**

### 4. Generate an Access Token
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Add these permissions: `ads_read`, `ads_management`, `read_insights`
5. Click **Generate Access Token** and authorize

### 5. Get a Long-Lived Token
Short-lived tokens expire in ~1 hour. Exchange it for a long-lived one (~60 days):

```bash
curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Copy the `access_token` from the response.

### 6. Find Your Ad Account ID
1. Go to [Meta Business Suite](https://business.facebook.com) → **Settings** → **Ad Accounts**
2. Your Ad Account ID looks like `act_123456789`

## Local Setup

```bash
# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# Fill in your credentials in .env:
# META_APP_ID=your_app_id
# META_APP_SECRET=your_app_secret
# META_ACCESS_TOKEN=your_long_lived_token
# META_AD_ACCOUNT_ID=act_123456789

# Start the server
npm start

# Or with auto-reload during development
npm run dev
```

## API Endpoints

### `GET /` — Health check
Returns list of available endpoints.

### `GET /api/ads/account` — Account info
Returns ad account name, currency, status, and total spend.

```bash
curl http://localhost:3000/api/ads/account
```

### `GET /api/ads/campaigns` — Campaign performance
Returns all campaigns with metrics. Defaults to last 30 days.

```bash
# Last 30 days (default)
curl http://localhost:3000/api/ads/campaigns

# Custom date range
curl "http://localhost:3000/api/ads/campaigns?date_from=2026-01-01&date_to=2026-01-31"
```

### `GET /api/ads/insights` — Account insights with breakdowns
Returns account-level metrics. Optionally break down by age, gender, placement, or device.

```bash
# Overall account insights
curl http://localhost:3000/api/ads/insights

# Broken down by age
curl "http://localhost:3000/api/ads/insights?breakdown=age"

# By device
curl "http://localhost:3000/api/ads/insights?breakdown=device"

# By placement (Facebook, Instagram, etc.)
curl "http://localhost:3000/api/ads/insights?breakdown=placement"

# By gender with date range
curl "http://localhost:3000/api/ads/insights?breakdown=gender&date_from=2026-01-01&date_to=2026-01-31"
```

### `GET /api/ads/insights/daily` — Day-by-day performance
Returns one row per day for charting/trending.

```bash
curl "http://localhost:3000/api/ads/insights/daily?date_from=2026-02-01&date_to=2026-02-22"
```

## Metrics Returned

| Metric | Description |
|--------|-------------|
| spend | Total amount spent |
| impressions | Number of times ads were shown |
| clicks | Total clicks |
| ctr | Click-through rate (%) |
| cpc | Cost per click |
| cpm | Cost per 1,000 impressions |
| actions | Conversions broken down by type (purchases, leads, etc.) |
| cost_per_action | Cost per conversion by type |
| purchase_roas | Return on ad spend for purchases |
# meta-dashboard
