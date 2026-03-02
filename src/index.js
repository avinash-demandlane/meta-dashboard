require("dotenv").config();
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const adsRouter = require("./routes/ads");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Auth Config ──────────────────────────────────────────────────────────────
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "Demandlane@123";
const AUTH_TOKEN = crypto.createHash("sha256").update(DASHBOARD_PASSWORD + "_meta_dash").digest("hex").slice(0, 32);

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (header) {
    header.split(";").forEach((c) => {
      const [key, ...rest] = c.split("=");
      cookies[key.trim()] = rest.join("=").trim();
    });
  }
  return cookies;
}

const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login — Creative Performance Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>body { font-family: 'Inter', system-ui, sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-200 min-h-screen flex items-center justify-center">
  <div class="w-full max-w-sm mx-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <h1 class="text-xl font-bold text-white text-center mb-1">Creative Performance Dashboard</h1>
      <p class="text-sm text-slate-400 text-center mb-6">Enter password to continue</p>
      <form id="loginForm" class="space-y-4">
        <input type="password" id="pwd" autofocus placeholder="Password"
          class="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        <button type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition">
          Sign In
        </button>
        <p id="err" class="text-red-400 text-xs text-center hidden">Incorrect password</p>
      </form>
    </div>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      document.getElementById('err').classList.add('hidden');
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: document.getElementById('pwd').value }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        document.getElementById('err').classList.remove('hidden');
        document.getElementById('pwd').select();
      }
    });
  </script>
</body>
</html>`;

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

// ─── Login endpoint (before auth middleware) ──────────────────────────────────
app.post("/api/login", (req, res) => {
  if (req.body.password === DASHBOARD_PASSWORD) {
    res.cookie("dash_auth", AUTH_TOKEN, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    });
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: "Invalid password" });
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const cookies = parseCookies(req);
  if (cookies.dash_auth === AUTH_TOKEN) return next();

  // API calls get 401 JSON
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // Everything else gets the login page
  res.send(LOGIN_PAGE);
});

// ─── Static files & routes (protected) ───────────────────────────────────────
app.use(express.static(path.join(__dirname, "..", "public")));

// Routes
app.use("/api/ads", adsRouter);

// Health check
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
