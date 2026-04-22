/**
 * main.js — Dashboard entry point
 * Handles: global loading overlay, skeleton loading, error state,
 * data fetch, KPI rendering, page navigation with fade transitions,
 * filter buttons, sidebar toggle, and all chart initialization.
 */

import {
  renderOverviewRevenue,
  renderPriceBar, renderPriceDonut, renderPriceStats,
  renderCountryRevenue, renderCountryTx, renderUkPie, renderCountryAov,
  renderCustCount, renderCustRevenue,
  renderMonthlyTrend,
  renderTopProducts,
  renderRfmCount, renderRfmMonetary, renderRfmRadar,
  renderClusterCount, renderClusterRfm,
  renderCancelTrend, renderCancelCountry, renderAnomalyStats,
} from './charts.js';

import { renderForecast } from './forecast.js';

/* ── LUCIDE HELPER ──────────────────────────────────────── */
function initIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ================================================================
   LOADING OVERLAY
================================================================ */
const overlay = document.getElementById('loadingOverlay');

function showOverlay() {
  if (!overlay) return;
  overlay.classList.remove('fade-out', 'hidden');
}

function hideOverlay() {
  if (!overlay) return;
  overlay.classList.add('fade-out');
  // After fade completes, remove from layout entirely
  overlay.addEventListener('transitionend', () => {
    overlay.classList.add('hidden');
  }, { once: true });
}

/* ================================================================
   ERROR STATE
================================================================ */
const errorEl  = document.getElementById('errorState');
const retryBtn = document.getElementById('retryBtn');

function showError() {
  if (!errorEl) return;
  errorEl.hidden = false;
  initIcons(); // render alert-circle + refresh-cw icons
}

function hideError() {
  if (!errorEl) return;
  errorEl.hidden = true;
}

/* ================================================================
   SKELETON HELPERS
================================================================ */

/**
 * Injects skeleton placeholders into a page panel before charts render.
 * Each page has a custom skeleton structure matching its real layout.
 */
function injectSkeletons(pageId) {
  switch (pageId) {
    case 'page-overview': {
      const grid = document.getElementById('kpiGrid');
      if (grid) {
        grid.innerHTML = Array(8).fill(
          `<div class="kpi-card skeleton"></div>`
        ).join('');
      }
      // Chart area skeleton
      _skeletonifyCanvas('chartOverviewRevenue');
      break;
    }
    case 'page-unit-price': {
      const stats = document.getElementById('priceStats');
      if (stats) stats.innerHTML = Array(4).fill(
        `<div class="stat-card skeleton" style="min-height:72px;flex:1 1 150px"></div>`
      ).join('');
      _skeletonifyCanvas('chartPriceBar');
      _skeletonifyCanvas('chartPriceDonut');
      break;
    }
    case 'page-country':
      ['chartCountryRevenue','chartCountryTx','chartUkPie','chartCountryAov']
        .forEach(_skeletonifyCanvas);
      break;
    case 'page-customer':
      ['chartCustCount','chartCustRevenue'].forEach(_skeletonifyCanvas);
      break;
    case 'page-trends':
      _skeletonifyCanvas('chartMonthlyTrend');
      break;
    case 'page-products':
      _skeletonifyCanvas('chartTopProducts');
      break;
    case 'page-rfm':
      ['chartRfmCount','chartRfmMonetary','chartRfmRadar'].forEach(_skeletonifyCanvas);
      break;
    case 'page-clusters':
      ['chartClusterCount','chartClusterRfm'].forEach(_skeletonifyCanvas);
      break;
    case 'page-anomaly': {
      const stats = document.getElementById('anomalyStats');
      if (stats) stats.innerHTML = Array(4).fill(
        `<div class="stat-card skeleton" style="min-height:72px;flex:1 1 150px"></div>`
      ).join('');
      ['chartCancelTrend','chartCancelCountry'].forEach(_skeletonifyCanvas);
      break;
    }
    case 'page-forecast':
      _skeletonifyCanvas('chartForecast');
      break;
    case 'page-insights': {
      const grid = document.getElementById('insightsGrid');
      if (grid) grid.innerHTML = Array(6).fill(
        `<div class="skeleton" style="height:140px;border-radius:8px"></div>`
      ).join('');
      break;
    }
  }
}

/**
 * Replaces a canvas element's parent wrap with a skeleton div,
 * storing the canvas id so it can be restored.
 */
function _skeletonifyCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const wrap = canvas.parentElement;
  if (!wrap) return;
  // Preserve canvas (detach it) and inject skeleton in its place
  wrap.dataset.skeletonFor = canvasId;
  canvas.style.display = 'none';
  const skel = document.createElement('div');
  skel.className = 'chart-skeleton skeleton';
  skel.dataset.skelId = canvasId;
  wrap.appendChild(skel);
}

/**
 * Removes skeleton overlays and fades content in for a given page.
 */
function removeSkeletons(pageId) {
  const panel = document.getElementById(pageId);
  if (!panel) return;

  // Remove all chart skeleton divs within this page
  panel.querySelectorAll('.chart-skeleton').forEach(skel => {
    const canvas = document.getElementById(skel.dataset.skelId);
    if (canvas) canvas.style.display = '';
    skel.remove();
  });

  // Remove stat-card skeletons (but not real ones injected by JS)
  panel.querySelectorAll('.stat-card.skeleton').forEach(s => s.remove());

  // Apply fade-in class to the panel
  panel.classList.add('content-fade-in');
  panel.addEventListener('animationend', () => {
    panel.classList.remove('content-fade-in');
  }, { once: true });
}

/* ================================================================
   DATA FETCH
================================================================ */
async function loadData() {
  try {
    const res = await fetch('./dashboard_data.json');
    if (res.ok) return await res.json();
  } catch {
    console.error('Failed to fetch dashboard_data.json');
  }
  return null;
}

/* ================================================================
   KPI CARDS
================================================================ */
function fmtCurrency(v) {
  if (v >= 1_000_000) return '£' + (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000)     return '£' + (v / 1_000).toFixed(1) + 'K';
  return '£' + v.toFixed(2);
}

function renderKpis(data) {
  const kpi   = data.kpi;
  const cards = [
    { icon: 'trending-up',   label: 'Total Revenue',       value: fmtCurrency(kpi.total_revenue),               sub: 'Dec 2010 – Nov 2011' },
    { icon: 'receipt',       label: 'Total Transactions',   value: kpi.total_transactions.toLocaleString(),       sub: 'Invoices processed' },
    { icon: 'users',         label: 'Total Customers',      value: kpi.total_customers.toLocaleString(),          sub: 'Unique customer IDs' },
    { icon: 'package',       label: 'Total Products',       value: kpi.total_products.toLocaleString(),           sub: 'Unique SKUs' },
    { icon: 'globe',         label: 'Countries',            value: String(kpi.total_countries),                   sub: 'Markets served' },
    { icon: 'shopping-cart', label: 'Avg Order Value',      value: '£' + kpi.avg_order_value.toFixed(2),         sub: 'Per invoice' },
    { icon: 'x-circle',      label: 'Cancellation Rate',    value: kpi.cancellation_rate.toFixed(2) + '%',       sub: 'Of all invoices' },
    { icon: 'repeat',        label: 'Repeat Customer Rate', value: kpi.repeat_customer_rate.toFixed(2) + '%',    sub: 'Customers >1 purchase' },
  ];

  const grid = document.getElementById('kpiGrid');
  if (!grid) return;
  grid.innerHTML = cards.map(c => `
    <div class="kpi-card">
      <div class="kpi-card__icon" aria-hidden="true"><i data-lucide="${c.icon}"></i></div>
      <p class="kpi-card__label">${c.label}</p>
      <p class="kpi-card__value">${c.value}</p>
      <p class="kpi-card__sub">${c.sub}</p>
    </div>
  `).join('');
  initIcons();
}

/* ================================================================
   INSIGHTS
================================================================ */
function renderInsights() {
  const insights = [
    {
      icon: 'gem',
      title: 'Champions Jadi Tulang Punggung Bisnis',
      finding: '962 pelanggan Champions rata-rata menghasilkan £6,039 per orang — nilai monetar tertinggi di antara semua segmen — dengan recency kurang dari 13 hari. Kehilangan sebagian kecil saja dari mereka bisa berdampak besar ke pendapatan.',
      rec: 'Buat program loyalitas VIP dengan penawaran early-access eksklusif, account manager khusus, dan hadiah apresiasi per kuartal untuk mempertahankan pelanggan Champions.'
    },
    {
      icon: 'alert-triangle',
      title: '643 Pelanggan At-Risk Butuh Perhatian Segera',
      finding: 'Segmen At-Risk punya rata-rata recency 153 hari dan nilai monetar £1,245. Ini adalah pendapatan yang masih bisa diselamatkan sebelum mereka benar-benar pindah ke segmen Lost.',
      rec: 'Kirim email win-back yang dipersonalisasi dengan rekomendasi produk dan diskon terbatas 15% — dorong mereka untuk kembali berbelanja dalam 30 hari ke depan.'
    },
    {
      icon: 'x-circle',
      title: 'Tingkat Pembatalan 19.2% Perlu Segera Ditangani',
      finding: '3,836 invoice dibatalkan dengan estimasi kerugian pendapatan £896,812. UK mendominasi (3,372 pembatalan), disusul Germany (146) dan EIRE (72).',
      rec: 'Cari akar masalahnya — apakah karena stok habis, keterlambatan pengiriman, atau dispute harga. Terapkan pengecekan stok real-time saat checkout dan survei pasca-pembatalan.'
    },
    {
      icon: 'globe',
      title: 'Pasar Internasional Punya Nilai Order yang Jauh Lebih Tinggi',
      finding: 'Netherlands (£121), Australia (£117), Japan (£117), dan Sweden (£85) memiliki rata-rata nilai order yang jauh lebih tinggi dibanding UK (£18.60).',
      rec: 'Investasikan di pemasaran lokal, dukungan multi-mata uang, dan opsi pengiriman khusus untuk 5 pasar non-UK teratas agar potensi mereka bisa dimaksimalkan.'
    },
    {
      icon: 'trending-up',
      title: 'Lonjakan Q4 Sudah Bisa Diprediksi',
      finding: 'Pendapatan melonjak tajam di Sep–Nov (£1.06M → £1.15M → £1.51M), sesuai pola musim liburan. Tren kuantitas dan jumlah transaksi mengikuti pola yang sama.',
      rec: 'Siapkan stok, logistik, dan tim support 8–10 minggu sebelum November. Negosiasikan tarif pengiriman massal lebih awal dan mulai kampanye promosi di awal September.'
    },
    {
      icon: 'award',
      title: 'Pelanggan Loyal Sumbang 47% dari Total Pendapatan',
      finding: 'Pelanggan Loyal (>10 pembelian) hanya 8% dari total basis pelanggan, tapi berkontribusi £4.39M — atau 47% dari total pendapatan. Sementara pembeli sekali saja hanya menyumbang di bawah 7%.',
      rec: 'Alihkan sebagian anggaran akuisisi ke retensi. Buat urutan follow-up pasca-pembelian untuk mengkonversi pembeli satu kali menjadi repeat buyer dalam 60 hari.'
    },
    {
      icon: 'package',
      title: 'Produk Murah Mendominasi Volume Transaksi',
      finding: 'Lebih dari 400K transaksi berada di rentang harga £1–£5. Produk di bawah £1 mencakup 111K transaksi — menandakan bauran produk bervolume tinggi dengan margin rendah.',
      rec: 'Bundling produk murah menjadi paket hadiah yang menarik untuk mendongkrak nilai belanja. Coba juga strategi gratis ongkir dengan minimum pembelian (misal di atas £30) untuk mendorong keranjang yang lebih besar.'
    },
    {
      icon: 'cpu',
      title: 'Forecast Kuantitas Menunjukkan Tren Naik',
      finding: 'Model Prophet memproyeksikan kuantitas tumbuh dari ~666K (Des 2011) ke ~827K (Mei 2012) dengan MAPE 11.5%. Forecast pendapatan lebih bersifat indikatif saja (MAPE 44%).',
      rec: 'Gunakan forecast kuantitas untuk perencanaan pengadaan. Untuk pendapatan, lengkapi dengan pemodelan strategi harga agar proyeksi lebih akurat.'
    },
    {
      icon: 'pie-chart',
      title: 'Cluster High-Value Kecil tapi Dampaknya Besar',
      finding: 'Hanya 242 pelanggan High-Value (5.6% dari total), tapi rata-rata nilai monetar mereka mencapai £17,459 dengan frekuensi rata-rata 24.3 dan recency kurang dari 11 hari.',
      rec: 'Buat program account management high-touch khusus untuk kluster ini. Cegah churn dengan komunikasi proaktif, preview produk baru, dan penawaran eksklusif sebelum mereka pergi.'
    },
    {
      icon: 'users',
      title: 'Pelanggan Occasional Adalah Peluang Pertumbuhan Terbesar',
      finding: '1,820 pelanggan Occasional (42% dari basis) punya recency tinggi (80 hari) dan frekuensi rendah (2×), tapi nilai monetar yang cukup lumayan (£805).',
      rec: 'Sasar pelanggan Occasional dengan kampanye yang mendorong frekuensi: nudge langganan, diskon bundle setelah pembelian pertama, dan email reaktivasi di hari ke-60.'
    },
    {
      icon: 'tag',
      title: 'Distribusi Harga Condong ke Bawah £5',
      finding: 'Median harga satuan hanya £2.08 dibanding rata-rata £3.91. Harga maksimum £13,541 menunjukkan ada sejumlah kecil produk specialty bernilai tinggi.',
      rec: 'Kembangkan lini produk premium atau bundle yang menyasar segmen harga £10–£50 untuk memperbaiki komposisi margin tanpa mengorbankan volume yang sudah ada.'
    },
  ];

  const grid = document.getElementById('insightsGrid');
  if (!grid) return;
  grid.innerHTML = insights.map(ins => `
    <article class="insight-card">
      <div class="insight-icon" aria-hidden="true"><i data-lucide="${ins.icon}"></i></div>
      <div class="insight-body">
        <h3 class="insight-title">${ins.title}</h3>
        <p class="insight-finding">${ins.finding}</p>
        <p class="insight-rec-label">Rekomendasi</p>
        <p class="insight-rec">${ins.rec}</p>
      </div>
    </article>
  `).join('');
  initIcons();
}

/* ================================================================
   PAGE NAVIGATION
================================================================ */
const PAGE_TITLES = {
  'page-exec-summary': 'Executive Summary',
  'page-overview':   'Overview',
  'page-unit-price': 'Unit Price Analysis',
  'page-country':    'Country Analysis',
  'page-customer':   'Customer Behavior',
  'page-trends':     'Monthly Trends',
  'page-products':   'Top Products',
  'page-rfm':        'RFM Segmentation',
  'page-clusters':   'Customer Clustering',
  'page-anomaly':    'Anomaly Detection',
  'page-forecast':   'Forecasting',
  'page-insights':   'Insights & Recommendations',
};

// Pages already rendered (lazy render on first visit)
const rendered = new Set();

function switchPage(targetId, data) {
  // ── 1. Hide all panels ──
  document.querySelectorAll('.page-panel').forEach(p => p.classList.remove('active'));

  // ── 2. Show target (CSS animation handles the 150ms fade) ──
  const panel = document.getElementById(targetId);
  if (panel) panel.classList.add('active');

  // ── 3. Update topbar title ──
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[targetId] || '';

  // ── 4. Update sidebar active state ──
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.target === targetId);
  });

  // ── 5. Lazy render on first visit ──
  if (!rendered.has(targetId) && data) {
    rendered.add(targetId);

    // Show skeletons first, then render
    injectSkeletons(targetId);

    // Use a minimal delay so skeletons paint before heavy chart rendering
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderPageCharts(targetId, data);
        removeSkeletons(targetId);
      });
    });
  }
}

function renderPageCharts(pageId, data) {
  switch (pageId) {
    case 'page-exec-summary':
      renderExecSummary(data);
      break;
    case 'page-overview':
      renderKpis(data);
      renderOverviewRevenue(data);
      break;
    case 'page-unit-price':
      renderPriceStats(data);
      renderPriceBar(data);
      renderPriceDonut(data);
      break;
    case 'page-country':
      renderCountryRevenue(data);
      renderCountryTx(data);
      renderUkPie(data);
      renderCountryAov(data);
      renderCountryTable(data);
      break;
    case 'page-customer':
      renderCustCount(data);
      renderCustRevenue(data);
      break;
    case 'page-trends':
      renderMonthlyTrend(data, 'revenue');
      break;
    case 'page-products':
      renderTopProducts(data);
      renderTopProductsTable(data);
      break;
    case 'page-rfm':
      renderRfmCount(data);
      renderRfmMonetary(data);
      renderRfmRadar(data);
      renderRfmTable(data);
      break;
    case 'page-clusters':
      renderClusterCount(data);
      renderClusterRfm(data);
      renderClustersTable(data);
      break;
    case 'page-anomaly':
      renderAnomalyStats(data);
      renderCancelTrend(data);
      renderCancelCountry(data);
      break;
    case 'page-forecast':
      renderForecast(data, 'revenue');
      renderForecastTable(data, 'revenue');
      break;
    case 'page-insights':
      renderInsights();
      break;
  }
}

/* ================================================================
   EXECUTIVE SUMMARY
================================================================ */
function renderExecModelTable(data) {
  const tableData = [
    {
      metric: 'Revenue',
      model: 'Prophet',
      mape: data.forecast.revenue.mape + '%',
      mae: '£' + data.forecast.revenue.mae.toLocaleString('en-GB', {minimumFractionDigits:0, maximumFractionDigits:0}),
      interpretation: 'Gunakan sebagai indikasi arah tren, bukan angka pasti'
    },
    {
      metric: 'Quantity',
      model: 'Prophet',
      mape: data.forecast.quantity.mape + '%',
      mae: '-',
      interpretation: 'Andal untuk perencanaan pengadaan stok'
    },
    {
      metric: 'Transaksi',
      model: 'Prophet',
      mape: data.forecast.transactions.mape + '%',
      mae: '-',
      interpretation: 'Andal untuk perencanaan kapasitas operasional'
    }
  ];

  renderSortableTable('tableExecModel', [
    { id: 'metric', label: 'Metrik', align: 'left' },
    { id: 'model', label: 'Model', align: 'left' },
    { id: 'mape', label: 'MAPE', align: 'right' },
    { id: 'mae', label: 'MAE', align: 'right' },
    { id: 'interpretation', label: 'Interpretasi', align: 'left' }
  ], tableData, 'metric', true);
}

function renderExecClusterTable(data) {
  const strategyMap = {
    'High-Value': 'Pertahankan dengan program VIP',
    'Loyal Active': 'Upgrade ke High-Value dengan insentif',
    'Occasional': 'Stimulus frekuensi dengan bundle offer',
    'Dormant': 'Win-back campaign atau deprioritize'
  };

  const tableData = data.clusters.labels.map((lbl, i) => ({
    cluster: lbl,
    count: data.clusters.counts[i],
    recency: data.clusters.avg_recency[i],
    frequency: data.clusters.avg_frequency[i],
    monetary: data.clusters.avg_monetary[i],
    strategy: strategyMap[lbl] || ''
  }));

  renderSortableTable('tableExecCluster', [
    { id: 'cluster', label: 'Cluster', align: 'left' },
    { id: 'count', label: 'Jumlah Customer', align: 'right', render: v => v.toLocaleString() },
    { id: 'recency', label: 'Avg Recency', align: 'right', render: v => v.toFixed(0) + ' hari' },
    { id: 'frequency', label: 'Avg Frequency', align: 'right', render: v => v.toFixed(0) + 'x' },
    { id: 'monetary', label: 'Avg Monetary (£)', align: 'right', render: v => '£' + v.toLocaleString('en-GB', {minimumFractionDigits: 0, maximumFractionDigits: 0}) },
    { id: 'strategy', label: 'Strategi', align: 'left' }
  ], tableData, 'monetary', false);
}

function renderExecSummary(data) {
  const dateEl = document.getElementById('execDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const grid = document.getElementById('execKpiGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="exec-kpi-card">
        <span class="exec-kpi-card__label">Total Revenue (£)</span>
        <span class="exec-kpi-card__value">£${(data.kpi.total_revenue / 1000000).toFixed(2)}M</span>
      </div>
      <div class="exec-kpi-card">
        <span class="exec-kpi-card__label">Total Transactions</span>
        <span class="exec-kpi-card__value">${data.kpi.total_transactions.toLocaleString('en-GB')}</span>
      </div>
      <div class="exec-kpi-card">
        <span class="exec-kpi-card__label">Total Customers</span>
        <span class="exec-kpi-card__value">${data.kpi.total_customers.toLocaleString('en-GB')}</span>
      </div>
      <div class="exec-kpi-card">
        <span class="exec-kpi-card__label">Cancellation Rate</span>
        <span class="exec-kpi-card__value">${data.kpi.cancellation_rate.toFixed(2)}%</span>
      </div>
    `;
  }

  renderExecModelTable(data);
  renderExecClusterTable(data);
}

/* ================================================================
   SORTABLE DATA TABLES
================================================================ */
function renderSortableTable(containerId, columns, data, defaultSortBy = null, defaultSortAsc = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let currentData = [...data];
  let sortCol = defaultSortBy || columns[0].id;
  let sortAsc = defaultSortAsc;

  const table = document.createElement('table');
  table.className = 'data-table';
  
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    th.className = col.align === 'right' ? 'align-right' : 'align-left';
    th.addEventListener('click', () => {
      if (sortCol === col.id) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col.id;
        sortAsc = false;
      }
      render();
    });
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);

  function render() {
    currentData.sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    const ths = thead.querySelectorAll('th');
    columns.forEach((col, idx) => {
      ths[idx].className = col.align === 'right' ? 'align-right' : 'align-left';
      if (col.id === sortCol) {
        ths[idx].classList.add(sortAsc ? 'sort-asc' : 'sort-desc');
      }
    });

    tbody.innerHTML = '';
    currentData.forEach(row => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.className = col.align === 'right' ? 'align-right' : 'align-left';
        td.innerHTML = col.render ? col.render(row[col.id], row) : row[col.id];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  render();
}

// 1. Country Analysis Table
function renderCountryTable(data) {
  const tableData = data.country.countries.map((c, i) => ({
    rank: i + 1,
    country: c,
    revenue: data.country.revenue[i],
    transactions: data.country.transactions[i],
    aov: data.country.avg_order_value[i],
    pct: (data.country.revenue[i] / data.kpi.total_revenue) * 100
  }));

  renderSortableTable('tableCountry', [
    { id: 'rank', label: 'Rank', align: 'right' },
    { id: 'country', label: 'Country', align: 'left' },
    { id: 'revenue', label: 'Total Revenue (£)', align: 'right', render: v => '£' + v.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2}) },
    { id: 'transactions', label: 'Transactions', align: 'right', render: v => v.toLocaleString() },
    { id: 'aov', label: 'Avg Order Value (£)', align: 'right', render: v => '£' + v.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2}) },
    { id: 'pct', label: '% of Total Revenue', align: 'right', render: v => v.toFixed(2) + '%' }
  ], tableData, 'revenue', false);
}

// 2. Top Products Table
function renderTopProductsTable(data) {
  const totalQty = data.monthly_trends.quantity.reduce((a,b)=>a+b, 0);
  const tableData = data.top_products.products.map((p, i) => ({
    rank: i + 1,
    product: p,
    qty: data.top_products.quantity[i],
    pct: (data.top_products.quantity[i] / totalQty) * 100
  }));

  renderSortableTable('tableTopProducts', [
    { id: 'rank', label: 'Rank', align: 'right' },
    { id: 'product', label: 'Product Name', align: 'left' },
    { id: 'qty', label: 'Quantity Sold', align: 'right', render: v => v.toLocaleString() },
    { id: 'pct', label: '% of Total Quantity', align: 'right', render: v => v.toFixed(2) + '%' }
  ], tableData, 'qty', false);
}

// 3. RFM Table
function renderRfmTable(data) {
  const tableData = data.rfm.segments.map((s, i) => ({
    segment: s,
    count: data.rfm.counts[i],
    pct: (data.rfm.counts[i] / data.kpi.total_customers) * 100,
    recency: data.rfm.avg_recency[i],
    frequency: data.rfm.avg_frequency[i],
    monetary: data.rfm.avg_monetary[i]
  }));

  renderSortableTable('tableRfm', [
    { id: 'segment', label: 'Segment', align: 'left' },
    { id: 'count', label: 'Customer Count', align: 'right', render: v => v.toLocaleString() },
    { id: 'pct', label: '% of Total', align: 'right', render: v => v.toFixed(2) + '%' },
    { id: 'recency', label: 'Avg Recency (days)', align: 'right', render: v => v.toFixed(1) },
    { id: 'frequency', label: 'Avg Frequency (orders)', align: 'right', render: v => v.toFixed(2) },
    { id: 'monetary', label: 'Avg Monetary (£)', align: 'right', render: v => '£' + v.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }
  ], tableData, 'monetary', false);
}

// 4. Clusters Table
function renderClustersTable(data) {
  const tableData = data.clusters.labels.map((l, i) => ({
    cluster: l,
    count: data.clusters.counts[i],
    recency: data.clusters.avg_recency[i],
    frequency: data.clusters.avg_frequency[i],
    monetary: data.clusters.avg_monetary[i]
  }));

  renderSortableTable('tableClusters', [
    { id: 'cluster', label: 'Cluster', align: 'left' },
    { id: 'count', label: 'Customer Count', align: 'right', render: v => v.toLocaleString() },
    { id: 'recency', label: 'Avg Recency (days)', align: 'right', render: v => v.toFixed(1) },
    { id: 'frequency', label: 'Avg Frequency (orders)', align: 'right', render: v => v.toFixed(2) },
    { id: 'monetary', label: 'Avg Monetary (£)', align: 'right', render: v => '£' + v.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }
  ], tableData, 'monetary', false);
}

// 5. Forecast Table
function renderForecastTable(data, metric) {
  const isCurrency = metric === 'revenue';
  const fc = data.forecast[metric];
  
  const tableData = fc.months.map((m, i) => ({
    month: m,
    forecast: fc.forecast[i],
    lower: fc.lower[i],
    upper: fc.upper[i],
    range: fc.upper[i] - fc.lower[i]
  }));

  const fmt = v => isCurrency ? '£' + v.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : v.toLocaleString('en-GB');

  renderSortableTable('tableForecast', [
    { id: 'month', label: 'Month', align: 'left' },
    { id: 'forecast', label: 'Forecast Value', align: 'right', render: fmt },
    { id: 'lower', label: 'Lower Bound', align: 'right', render: fmt },
    { id: 'upper', label: 'Upper Bound', align: 'right', render: fmt },
    { id: 'range', label: 'Confidence Range', align: 'right', render: fmt }
  ], tableData, 'month', true);
}


/* ================================================================
   FILTER BUTTONS
================================================================ */
function initTrendFilter(data) {
  const btns = document.querySelectorAll('#page-trends .filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMonthlyTrend(data, btn.dataset.metric);
    });
  });
}

function initForecastFilter(data) {
  const btns = document.querySelectorAll('#page-forecast .filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderForecast(data, btn.dataset.fc);
      renderForecastTable(data, btn.dataset.fc);
    });
  });
}

/* ================================================================
   SIDEBAR TOGGLE (mobile)
================================================================ */
function initSidebarToggle() {
  const sidebar  = document.getElementById('sidebar');
  const openBtn  = document.getElementById('sidebarToggleBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  const sidebarOverlay = document.createElement('div');
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);

  const open  = () => { sidebar.classList.add('open');    sidebarOverlay.classList.add('visible'); };
  const close = () => { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('visible'); };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  sidebarOverlay.addEventListener('click', close);
}

/* ================================================================
   NAV WIRING
================================================================ */
function initNav(data) {
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.target;
      if (!target) return;
      switchPage(target, data);
      // Auto-close sidebar on mobile
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('visible');
      }
    });
  });
}

/* ================================================================
   MAIN INIT
================================================================ */
async function init() {
  showOverlay();
  initSidebarToggle();
  initIcons(); // sidebar static icons

  const data = await loadData();

  if (!data) {
    // Data fetch failed → hide overlay, show error state
    hideOverlay();
    showError();

    // Wire retry button
    retryBtn?.addEventListener('click', () => {
      hideError();
      init();
    });
    return;
  }

  // Success — hide overlay, set up dashboard
  hideOverlay();
  hideError();

  initNav(data);
  initTrendFilter(data);
  initForecastFilter(data);

  // Boot to Executive Summary
  switchPage('page-exec-summary', data);
}

document.addEventListener('DOMContentLoaded', init);
