/* =========================================================================
   13F Tracker — Minimal, Mobile‑friendly, Top‑4 view
   -------------------------------------------------------------------------
   How to update numbers each quarter:
   - Edit the FUNDS array below. Keep exactly 4 holdings per fund for this view.
   - 'valueUSD' and 'shares' are plain numbers (no commas). UI formats them.
   - Update 'lastUpdated' to your quarter end (e.g., "2025-06-30").
   ========================================================================= */

// ===== Editable Data ========================================================
const FUNDS = [
  {
    id: "berkshire",
    name: "Berkshire Hathaway",
    manager: "Warren Buffett",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "AAPL", name: "Apple Inc.", shares: 280000000, valueUSD: 57447600000, sector: "Technology" },
      { ticker: "AXP",  name: "American Express", shares: 151610700, valueUSD: 48360780000, sector: "Financials" },
      { ticker: "BAC",  name: "Bank of America", shares: 605267375, valueUSD: 28641251000, sector: "Financials" },
      { ticker: "KO",   name: "Coca‑Cola", shares: 400000000, valueUSD: 28300000000, sector: "Consumer Staples" }
    ]
  },
  {
    id: "scion",
    name: "Scion Asset Management",
    manager: "Michael Burry",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "EL",   name: "Estée Lauder", shares: 150000, valueUSD: 12120000, sector: "Consumer Discretionary" },
      { ticker: "LULU", name: "Lululemon Athletica", shares: 50000, valueUSD: 11879000, sector: "Consumer Discretionary" },
      { ticker: "BRKR", name: "Bruker Corp", shares: 250000, valueUSD: 10300000, sector: "Healthcare" },
      { ticker: "REGN", name: "Regeneron Pharmaceuticals", shares: 15000, valueUSD: 7875000, sector: "Healthcare" }
    ]
  },
  {
    id: "tiger",
    name: "Tiger Global Management",
    manager: "Chase Coleman",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "AMZN", name: "Amazon.com", shares: 10685541, valueUSD: 2344301000, sector: "Consumer Discretionary" },
      { ticker: "META", name: "Meta Platforms", shares: 7533525, valueUSD: 5560419000, sector: "Technology" },
      { ticker: "MSFT", name: "Microsoft", shares: 6551368, valueUSD: 3258716000, sector: "Technology" },
      { ticker: "SE",   name: "Sea Ltd (ADR)", shares: 16041335, valueUSD: 2565651000, sector: "Consumer/Tech" }
    ]
  },
  {
    id: "soros",
    name: "Soros Fund Management",
    manager: "George Soros / SFM",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "NVDA", name: "NVIDIA (Puts/Calls)", shares: 990292, valueUSD: 0, sector: "Technology" },
      { ticker: "UNH",  name: "UnitedHealth Group", shares: 28900, valueUSD: 0, sector: "Healthcare" },
      { ticker: "MSFT", name: "Microsoft", shares: 0, valueUSD: 0, sector: "Technology" },
      { ticker: "TSLA", name: "Tesla Inc.", shares: 0, valueUSD: 0, sector: "Consumer Discretionary" }
    ]
  },
  {
    id: "bridgewater",
    name: "Bridgewater Associates",
    manager: "Ray Dalio (fmr)",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "SPY",   name: "SPDR S&P 500 ETF", shares: 2610360, valueUSD: 1613000000, sector: "ETF" },
      { ticker: "IVV",   name: "iShares Core S&P 500", shares: 2310000, valueUSD: 1430000000, sector: "ETF" },
      { ticker: "NVDA",  name: "NVIDIA Corp.", shares: 7230000, valueUSD: 1140000000, sector: "Technology" },
      { ticker: "IEMG",  name: "iShares Core MSCI EM", shares: 17180000, valueUSD: 1032000000, sector: "ETF" }
    ]
  }
];
// ============================================================================

/* ---------- Small helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const fmtInt  = (n) => (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtUSD  = (n) => (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const sumBy   = (arr, key) => arr.reduce((a, x) => a + (+x[key] || 0), 0);
const esc     = (s) => String(s ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

/* ---------- State ---------- */
let currentFundId = null;
let searchTerm = "";
let sort = { col: "valueUSD", dir: "desc" };

/* ---------- Init ---------- */
window.addEventListener("DOMContentLoaded", () => {
  populateFundSelect();

  // Pick fund from hash or default to first
  const fromHash = (location.hash || "").slice(1);
  const initial = FUNDS.find(f => f.id === fromHash)?.id || FUNDS[0]?.id;
  setFund(initial);

  bindEvents();
  setStickyOffset();  // compute header offset for sticky thead
});
window.addEventListener("resize", setStickyOffset);

function populateFundSelect(){
  const sel = $("#fundSelect");
  sel.innerHTML = FUNDS.map(f => `<option value="${f.id}">${esc(f.name)}</option>`).join("");
}

function bindEvents(){
  $("#fundSelect").addEventListener("change", (e) => setFund(e.target.value));
  $("#searchInput").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderTable();
    updateStats();
  });

  // Sort on header click
  document.querySelectorAll("#holdingsTable thead th").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-col");
      if (!col) return;
      sort = (sort.col === col)
        ? { col, dir: sort.dir === "asc" ? "desc" : "asc" }
        : { col, dir: ["name","ticker","sector"].includes(col) ? "asc" : "desc" };
      renderTable();
      updateSortIndicators();
    });
  });
}

function setFund(id){
  currentFundId = id;
  $("#fundSelect").value = id;
  location.hash = "#" + id;

  const fund = FUNDS.find(f => f.id === id);
  if (!fund) return;

  $("#fundName").textContent = fund.name;
  $("#fundManager").textContent = fund.manager;
  $("#lastUpdated").textContent = fund.lastUpdated;

  $("#searchInput").value = "";
  searchTerm = "";

  renderTable();
  updateSortIndicators();
  updateStats();
}

function renderTable(){
  const fund = FUNDS.find(f => f.id === currentFundId);
  if (!fund) return;

  // Filter
  let rows = fund.holdings;
  if (searchTerm){
    rows = rows.filter(h =>
      (h.ticker || "").toLowerCase().includes(searchTerm) ||
      (h.name   || "").toLowerCase().includes(searchTerm)
    );
  }

  // Sort
  const dir = sort.dir === "asc" ? 1 : -1;
  rows = [...rows].sort((a,b) => {
    const ca = a[sort.col], cb = b[sort.col];
    if (["name","ticker","sector"].includes(sort.col)){
      return String(ca||"").localeCompare(String(cb||"")) * dir;
    }
    return ((+ca||0) - (+cb||0)) * dir;
  });

  // Show exactly Top 4 when NOT searching; show all matches when searching
  if (!searchTerm) rows = rows.slice(0, 4);

  // Paint
  $("#holdingsBody").innerHTML = rows.map(h => `
    <tr>
      <td>${esc(h.ticker)}</td>
      <td>${esc(h.name)}</td>
      <td class="num">${fmtInt(h.shares)}</td>
      <td class="num">${fmtUSD(h.valueUSD)}</td>
      <td>${esc(h.sector)}</td>
    </tr>
  `).join("");
}

function updateStats(){
  const fund = FUNDS.find(f => f.id === currentFundId);
  if (!fund) return;

  const shownRows = $("#holdingsBody").children.length;
  const portfolioValue = sumBy(fund.holdings, "valueUSD");
  const top = [...fund.holdings].sort((a,b) => (b.valueUSD||0)-(a.valueUSD||0))[0];

  $("#statPositions").textContent = shownRows;        // number of rows currently displayed
  $("#statValue").textContent = fmtUSD(portfolioValue);
  $("#statTop").textContent = top ? `${top.ticker} · ${fmtUSD(top.valueUSD)}` : "—";
}

function updateSortIndicators(){
  document.querySelectorAll("#holdingsTable thead th").forEach(th => {
    th.classList.remove("sort-asc","sort-desc");
    const col = th.getAttribute("data-col");
    if (col === sort.col){
      th.classList.add(sort.dir === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

/* ---------- Sticky header offset (matches real topbar height) ---------- */
function setStickyOffset(){
  const topbar = document.querySelector(".topbar");
  const h = topbar ? topbar.offsetHeight : 60; // px
  document.documentElement.style.setProperty("--sticky-offset", `${h}px`);
}
