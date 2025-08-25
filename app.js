// ====== Editable data (update this by hand each quarter) =====================
const FUNDS = [
  {
    id: "berkshire",
    name: "Berkshire Hathaway",
    manager: "Warren Buffett",
    lastUpdated: "2025-06-30", // portfolio date; filed Aug 14, 2025
    holdings: [
      // Top U.S. equity positions per Q2'25 13F
      { ticker: "AAPL", name: "Apple Inc.", shares: 280000000, valueUSD: 0, sector: "Technology" }, // Q2 shares
      { ticker: "AXP", name: "American Express", shares: 151610700, valueUSD: 0, sector: "Financials" },
      { ticker: "BAC", name: "Bank of America", shares: 605267375, valueUSD: 0, sector: "Financials" }, // Q2 shares
      { ticker: "KO",  name: "Coca-Cola", shares: 400000000, valueUSD: 0, sector: "Consumer Staples" },
      { ticker: "CVX", name: "Chevron", shares: 122064792, valueUSD: 0, sector: "Energy" }, // Q2 shares
      // A few more sizable positions you may want tracked:
      { ticker: "OXY", name: "Occidental Petroleum", shares: 264941431, valueUSD: 0, sector: "Energy" },
      { ticker: "KHC", name: "Kraft Heinz", shares: 325634818, valueUSD: 0, sector: "Consumer Staples" }, // update if needed
      { ticker: "MCO", name: "Moody's", shares: 24166970, valueUSD: 0, sector: "Financials" }
    ]
  },

  {
    id: "scion",
    name: "Scion Asset Management",
    manager: "Michael Burry",
    lastUpdated: "2025-06-30",
    holdings: [
      // Scion’s book is option-heavy in Q2'25 — label calls/puts in the name
      { ticker: "UNH", name: "UnitedHealth (CALLS)", shares: 350000, valueUSD: 0, sector: "Options" },
      { ticker: "REGN", name: "Regeneron (CALLS)", shares: 0, valueUSD: 0, sector: "Options" },
      { ticker: "LULU", name: "Lululemon (CALLS)", shares: 0, valueUSD: 0, sector: "Options" },
      { ticker: "META", name: "Meta Platforms (CALLS)", shares: 0, valueUSD: 0, sector: "Options" }
      // add more from the filing if you like
    ]
  },

  {
    id: "tiger",
    name: "Tiger Global Management",
    manager: "Chase Coleman",
    lastUpdated: "2025-06-30",
    holdings: [
      // Top weights in Q2'25
      { ticker: "META", name: "Meta Platforms", shares: 0, valueUSD: 0, sector: "Technology" },
      { ticker: "MSFT", name: "Microsoft", shares: 0, valueUSD: 0, sector: "Technology" },
      { ticker: "SE",   name: "Sea Ltd (ADR)", shares: 0, valueUSD: 0, sector: "Consumer/Tech" },
      { ticker: "AMZN", name: "Amazon", shares: 0, valueUSD: 0, sector: "Consumer Discretionary" },
      { ticker: "GOOGL", name: "Alphabet Class A", shares: 0, valueUSD: 0, sector: "Technology" }
    ]
  },

  {
    id: "soros",
    name: "Soros Fund Management",
    manager: "George Soros / SFM",
    lastUpdated: "2025-06-30",
    holdings: [
      // SFM mixes equities & listed options in Q2'25
      { ticker: "SPY",  name: "SPDR S&P 500 (PUTS)", shares: 0, valueUSD: 0, sector: "Options" },
      { ticker: "SW",   name: "Smurfit WestRock plc", shares: 0, valueUSD: 0, sector: "Materials/Packaging" },
      { ticker: "FSLR", name: "First Solar (CALLS)", shares: 0, valueUSD: 0, sector: "Options" },
      { ticker: "IWM",  name: "iShares Russell 2000 (PUTS)", shares: 0, valueUSD: 0, sector: "Options" },
      { ticker: "QQQ",  name: "Invesco QQQ (CALLS)", shares: 0, valueUSD: 0, sector: "Options" }
    ]
  },

  {
    id: "bridgewater",
    name: "Bridgewater Associates",
    manager: "Ray Dalio (fmr) / CIOs Prince, Jensen, Karniol-Tambour",
    lastUpdated: "2025-06-30",
    holdings: [
      // Bridgewater’s top exposures (mix of ETFs + big-tech single names)
      { ticker: "SPY",  name: "SPDR S&P 500 ETF", shares: 2610360, valueUSD: 0, sector: "ETF" }, // Q2 shares
      { ticker: "IVV",  name: "iShares Core S&P 500", shares: 0, valueUSD: 0, sector: "ETF" },
      { ticker: "IEMG", name: "iShares Core MSCI EM", shares: 0, valueUSD: 0, sector: "ETF" },
      { ticker: "GOOGL", name: "Alphabet Class A", shares: 0, valueUSD: 0, sector: "Technology" },
      { ticker: "NVDA", name: "NVIDIA", shares: 0, valueUSD: 0, sector: "Technology" },
      { ticker: "MSFT", name: "Microsoft", shares: 0, valueUSD: 0, sector: "Technology" }
    ]
  }
];

// =============================================================================

// ---------- Utilities ----------
const $ = sel => document.querySelector(sel);
const formatInt = n => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const formatUSD = n => (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const sumBy = (arr, key) => arr.reduce((a, x) => a + (+x[key] || 0), 0);

// ---------- State ----------
let currentFundId = null;
let searchTerm = "";
let sort = { col: "valueUSD", dir: "desc" };

// ---------- Init ----------
window.addEventListener("DOMContentLoaded", () => {
  populateFundSelect();
  // Pick from hash or default to first fund
  const fromHash = (location.hash || "").slice(1);
  const initial = FUNDS.find(f => f.id === fromHash)?.id || FUNDS[0]?.id;
  setFund(initial);
  bindEvents();
});

function populateFundSelect() {
  const sel = $("#fundSelect");
  sel.innerHTML = FUNDS.map(f => `<option value="${f.id}">${f.name}</option>`).join("");
}

function bindEvents() {
  $("#fundSelect").addEventListener("change", e => setFund(e.target.value));
  $("#searchInput").addEventListener("input", e => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderTable();
  });

  // Sort on header click
  document.querySelectorAll("#holdingsTable thead th").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-col");
      if (!col) return;
      if (sort.col === col) {
        sort.dir = sort.dir === "asc" ? "desc" : "asc";
      } else {
        sort.col = col;
        sort.dir = col === "name" || col === "ticker" || col === "sector" ? "asc" : "desc";
      }
      renderTable();
      updateSortIndicators();
    });
  });
}

function setFund(id) {
  currentFundId = id;
  $("#fundSelect").value = id;
  location.hash = "#" + id;

  const fund = FUNDS.find(f => f.id === id);
  if (!fund) return;

  // Meta
  $("#fundName").textContent = fund.name;
  $("#fundManager").textContent = fund.manager;
  $("#lastUpdated").textContent = fund.lastUpdated;

  // Stats
  const totalPositions = fund.holdings.length;
  const portfolioValue = sumBy(fund.holdings, "valueUSD");
  const top = [...fund.holdings].sort((a,b) => (b.valueUSD||0)-(a.valueUSD||0))[0];

  $("#statPositions").textContent = formatInt(totalPositions);
  $("#statValue").textContent = formatUSD(portfolioValue);
  $("#statTop").textContent = top ? `${top.ticker} · ${formatUSD(top.valueUSD)}` : "—";

  // Reset search on fund switch
  $("#searchInput").value = "";
  searchTerm = "";

  // Render table
  renderTable();
  updateSortIndicators();
}

function updateSortIndicators() {
  document.querySelectorAll("#holdingsTable thead th").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    const col = th.getAttribute("data-col");
    if (col === sort.col) th.classList.add(sort.dir === "asc" ? "sort-asc" : "sort-desc");
  });
}

function renderTable() {
  const fund = FUNDS.find(f => f.id === currentFundId);
  if (!fund) return;

  let rows = fund.holdings;

  // Filter
  if (searchTerm) {
    rows = rows.filter(h =>
      (h.ticker || "").toLowerCase().includes(searchTerm) ||
      (h.name || "").toLowerCase().includes(searchTerm)
    );
  }

  // Sort
  const dir = sort.dir === "asc" ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    const ca = a[sort.col], cb = b[sort.col];
    if (sort.col === "name" || sort.col === "ticker" || sort.col === "sector") {
      return String(ca || "").localeCompare(String(cb || "")) * dir;
    }
    return ((+ca || 0) - (+cb || 0)) * dir;
  });

  // Paint
  const tbody = $("#holdingsBody");
  tbody.innerHTML = rows.map(h => `
    <tr>
      <td>${escapeHTML(h.ticker)}</td>
      <td>${escapeHTML(h.name)}</td>
      <td class="num">${formatInt(h.shares)}</td>
      <td class="num">${formatUSD(h.valueUSD)}</td>
      <td>${escapeHTML(h.sector)}</td>
    </tr>
  `).join("");
}

// Minimal sanitizer for table content
function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}
