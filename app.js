// ====== Editable data (update this by hand each quarter) =====================
const FUNDS = [
  {
    id: "berkshire",
    name: "Berkshire Hathaway",
    manager: "Warren Buffett",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "AAPL", name: "Apple Inc.", shares: 790000000, valueUSD: 150000000000, sector: "Technology" },
      { ticker: "KO",   name: "Coca‑Cola Co.", shares: 400000000, valueUSD: 24000000000,  sector: "Consumer Staples" },
      { ticker: "AXP",  name: "American Express", shares: 150000000, valueUSD: 32000000000, sector: "Financials" }
    ]
  },
  {
    id: "scion",
    name: "Scion Asset Management",
    manager: "Michael Burry",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "GOOGL", name: "Alphabet Class A", shares: 1200000, valueUSD: 210000000, sector: "Communication Services" },
      { ticker: "BABA",  name: "Alibaba Group", shares: 900000, valueUSD: 72000000, sector: "Consumer Discretionary" }
    ]
  },
  {
    id: "tiger",
    name: "Tiger Global Management",
    manager: "Chase Coleman",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "META", name: "Meta Platforms", shares: 2800000, valueUSD: 1350000000, sector: "Communication Services" },
      { ticker: "AMZN", name: "Amazon.com", shares: 3500000, valueUSD: 650000000, sector: "Consumer Discretionary" }
    ]
  },
  {
    id: "soros",
    name: "Soros Fund Management",
    manager: "George Soros",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "SPY",  name: "SPDR S&P 500 ETF", shares: 2000000, valueUSD: 1000000000, sector: "ETF" },
      { ticker: "NVDA", name: "NVIDIA Corp.", shares: 500000, valueUSD: 600000000, sector: "Technology" }
    ]
  },
  {
    id: "arkk",
    name: "ARK Innovation ETF (sample)",
    manager: "Cathie Wood",
    lastUpdated: "2025-06-30",
    holdings: [
      { ticker: "TSLA", name: "Tesla Inc.", shares: 2000000, valueUSD: 500000000, sector: "Consumer Discretionary" },
      { ticker: "ROKU", name: "Roku Inc.", shares: 3000000, valueUSD: 210000000, sector: "Communication Services" }
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
