/**
 * charts.js — All Chart.js chart renderers
 * Receives data from main.js after JSON fetch
 */

/* ── PALETTE ────────────────────────────────────────────── */
const MAROON   = '#800000';
const ACCENT   = '#c0392b';
const LIGHT    = '#f5e6e6';
const BORDER   = '#e8e8e8';
const MUTED    = '#888888';

/* A sequential maroon-to-light palette for multi-series */
const PALETTE = [
  '#800000', '#9b1b1b', '#b52c2c', '#c0392b',
  '#d45f5f', '#e08080', '#ebb5b5', '#f5e6e6'
];

/* Neutral palette for grouped charts */
const GROUP_PALETTE = ['#800000', '#c0392b', '#d4a0a0'];

/* ── SHARED DEFAULTS ────────────────────────────────────── */
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#444444';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding  = 14;

function tooltipDefaults() {
  return {
    backgroundColor: '#fff',
    titleColor: '#1a1a1a',
    bodyColor: '#444',
    borderColor: '#e8e8e8',
    borderWidth: 1,
    padding: 12,
    cornerRadius: 6,
  };
}

/* ── HELPERS ────────────────────────────────────────────── */
function fmtCurrency(v) {
  if (v >= 1_000_000) return '£' + (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000)     return '£' + (v / 1_000).toFixed(1) + 'K';
  return '£' + v.toFixed(2);
}

function fmtNum(v) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
  return String(v);
}

/* ── CHART REGISTRY (for destroy on re-render) ──────────── */
const chartInstances = {};

function createChart(id, config) {
  if (chartInstances[id]) chartInstances[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return;
  chartInstances[id] = new Chart(ctx.getContext('2d'), config);
  return chartInstances[id];
}

/* ======================================================== */
/*  SECTION 2 — UNIT PRICE ANALYSIS                        */
/* ======================================================== */

export function renderPriceBar(data) {
  createChart('chartPriceBar', {
    type: 'bar',
    data: {
      labels: data.unit_price.segments,
      datasets: [{
        label: 'Transaction Count',
        data: data.unit_price.counts,
        backgroundColor: PALETTE.slice(0, 5),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => ' ' + fmtNum(ctx.parsed.y) + ' transactions'
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => fmtNum(v) }
        }
      }
    }
  });
}

export function renderPriceDonut(data) {
  createChart('chartPriceDonut', {
    type: 'doughnut',
    data: {
      labels: data.unit_price.segments,
      datasets: [{
        data: data.unit_price.counts,
        backgroundColor: PALETTE.slice(0, 5),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${fmtNum(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

export function renderPriceStats(data) {
  const s = data.unit_price.stats;
  const container = document.getElementById('priceStats');
  if (!container) return;
  container.innerHTML = [
    { label: 'Mean Price',   value: '£' + s.mean.toFixed(2) },
    { label: 'Median Price', value: '£' + s.median.toFixed(2) },
    { label: 'Min Price',    value: '£' + s.min.toFixed(2) },
    { label: 'Max Price',    value: '£' + s.max.toLocaleString() },
  ].map(c => `
    <div class="stat-card">
      <p class="stat-card__label">${c.label}</p>
      <p class="stat-card__value">${c.value}</p>
    </div>
  `).join('');
}

/* ======================================================== */
/*  SECTION 3 — COUNTRY ANALYSIS                           */
/* ======================================================== */

export function renderCountryRevenue(data) {
  createChart('chartCountryRevenue', {
    type: 'bar',
    data: {
      labels: data.country.countries,
      datasets: [{
        label: 'Revenue',
        data: data.country.revenue,
        backgroundColor: MAROON,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: { label: ctx => ' ' + fmtCurrency(ctx.parsed.x) }
        }
      },
      scales: {
        x: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => fmtCurrency(v) }
        },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}

export function renderCountryTx(data) {
  // Top 10 only
  const labels = data.country.countries.slice(0, 10);
  const txData = data.country.transactions.slice(0, 10);

  createChart('chartCountryTx', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Transactions',
        data: txData,
        backgroundColor: ACCENT,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: { label: ctx => ' ' + fmtNum(ctx.parsed.y) + ' transactions' }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
        y: { border: { display: false }, grid: { color: BORDER }, ticks: { callback: v => fmtNum(v) } }
      }
    }
  });
}

export function renderUkPie(data) {
  const totalRevenue = data.kpi.total_revenue;
  const ukRevenue    = data.country.revenue[0]; // UK is first
  const nonUk        = totalRevenue - ukRevenue;

  createChart('chartUkPie', {
    type: 'pie',
    data: {
      labels: ['United Kingdom', 'Non-UK'],
      datasets: [{
        data: [ukRevenue, nonUk],
        backgroundColor: [MAROON, '#d4a0a0'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => {
              const pct = ((ctx.parsed / totalRevenue) * 100).toFixed(1);
              return ` ${fmtCurrency(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

export function renderCountryAov(data) {
  const labels = data.country.countries.slice(0, 10);
  const aovData = data.country.avg_order_value.slice(0, 10);

  createChart('chartCountryAov', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Order Value',
        data: aovData,
        backgroundColor: PALETTE.slice(0, 10).reverse(),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: { label: ctx => ' £' + ctx.parsed.y.toFixed(2) }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
        y: { border: { display: false }, grid: { color: BORDER }, ticks: { callback: v => '£' + v } }
      }
    }
  });
}

/* ======================================================== */
/*  SECTION 4 — CUSTOMER BEHAVIOR                          */
/* ======================================================== */

export function renderCustCount(data) {
  createChart('chartCustCount', {
    type: 'bar',
    data: {
      labels: data.customer_type.types,
      datasets: [{
        label: 'Customers',
        data: data.customer_type.counts,
        backgroundColor: PALETTE.slice(0, 4),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { border: { display: false }, grid: { color: BORDER } }
      }
    }
  });
}

export function renderCustRevenue(data) {
  createChart('chartCustRevenue', {
    type: 'bar',
    data: {
      labels: data.customer_type.types,
      datasets: [{
        label: 'Revenue',
        data: data.customer_type.revenue,
        backgroundColor: [LIGHT, '#d4a0a0', ACCENT, MAROON],
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: { label: ctx => ' ' + fmtCurrency(ctx.parsed.y) }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => fmtCurrency(v) }
        }
      }
    }
  });
}

export function renderOrderDist(data) {
  // Approximate histogram using customer_type counts as bins
  createChart('chartOrderDist', {
    type: 'bar',
    data: {
      labels: ['1 order', '2–3 orders', '4–10 orders', '>10 orders'],
      datasets: [{
        label: 'Customers',
        data: data.customer_type.counts,
        backgroundColor: MAROON + 'cc',
        borderColor: MAROON,
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { border: { display: false }, grid: { color: BORDER } }
      }
    }
  });
}

/* ======================================================== */
/*  SECTION 5 — MONTHLY TRENDS                             */
/* ======================================================== */

export function renderMonthlyTrend(data, metric = 'revenue') {
  const labels     = data.monthly_trends.months;
  const metricData = data.monthly_trends[metric];

  const isCurrency = metric === 'revenue';
  const label      = metric.charAt(0).toUpperCase() + metric.slice(1);

  const titleMap = {
    revenue:      'Monthly Revenue Trend',
    quantity:     'Monthly Quantity Sold Trend',
    transactions: 'Monthly Transaction Count Trend',
  };
  const titleEl = document.getElementById('trendChartTitle');
  if (titleEl) titleEl.textContent = titleMap[metric];

  createChart('chartMonthlyTrend', {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: metricData,
        borderColor: MAROON,
        backgroundColor: 'rgba(128,0,0,0.08)',
        pointBackgroundColor: MAROON,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => isCurrency
              ? ' ' + fmtCurrency(ctx.parsed.y)
              : ' ' + fmtNum(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => isCurrency ? fmtCurrency(v) : fmtNum(v) }
        }
      }
    }
  });
}

/* ======================================================== */
/*  SECTION 6 — TOP PRODUCTS                               */
/* ======================================================== */

export function renderTopProducts(data) {
  createChart('chartTopProducts', {
    type: 'bar',
    data: {
      labels: data.top_products.products,
      datasets: [{
        label: 'Quantity Sold',
        data: data.top_products.quantity,
        backgroundColor: PALETTE.slice(0, 10),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: { label: ctx => ' ' + fmtNum(ctx.parsed.x) + ' units' }
        }
      },
      scales: {
        x: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => fmtNum(v) }
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/* ======================================================== */
/*  SECTION 7 — RFM SEGMENTATION                          */
/* ======================================================== */

export function renderRfmCount(data) {
  createChart('chartRfmCount', {
    type: 'bar',
    data: {
      labels: data.rfm.segments,
      datasets: [{
        label: 'Customers',
        data: data.rfm.counts,
        backgroundColor: PALETTE.slice(0, 6),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, maxRotation: 35 } },
        y: { border: { display: false }, grid: { color: BORDER } }
      }
    }
  });
}

export function renderRfmMonetary(data) {
  createChart('chartRfmMonetary', {
    type: 'bar',
    data: {
      labels: data.rfm.segments,
      datasets: [{
        label: 'Avg Monetary (£)',
        data: data.rfm.avg_monetary,
        backgroundColor: [LIGHT, MAROON, '#f0c0c0', '#b52c2c', '#e08080', '#9b1b1b'],
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: { label: ctx => ' £' + ctx.parsed.y.toLocaleString() }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, maxRotation: 35 } },
        y: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => '£' + fmtNum(v) }
        }
      }
    }
  });
}

export function renderRfmRadar(data) {
  // Normalise values 0-100 for radar readability
  const normalize = (arr) => {
    const max = Math.max(...arr);
    return arr.map(v => Math.round((v / max) * 100));
  };

  const recNorm = normalize(data.rfm.avg_recency.map(v => 250 - v)); // invert (lower recency = better)
  const freqNorm = normalize(data.rfm.avg_frequency);
  const monNorm  = normalize(data.rfm.avg_monetary);

  createChart('chartRfmRadar', {
    type: 'radar',
    data: {
      labels: data.rfm.segments,
      datasets: [
        {
          label: 'Recency (inv.)',
          data: recNorm,
          borderColor: MAROON,
          backgroundColor: 'rgba(128,0,0,0.12)',
          borderWidth: 2,
          pointBackgroundColor: MAROON,
          pointRadius: 3,
        },
        {
          label: 'Frequency',
          data: freqNorm,
          borderColor: ACCENT,
          backgroundColor: 'rgba(192,57,43,0.08)',
          borderWidth: 2,
          pointBackgroundColor: ACCENT,
          pointRadius: 3,
        },
        {
          label: 'Monetary',
          data: monNorm,
          borderColor: '#d4a0a0',
          backgroundColor: 'rgba(212,160,160,0.12)',
          borderWidth: 2,
          pointBackgroundColor: '#d4a0a0',
          pointRadius: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: BORDER },
          pointLabels: { font: { size: 10 } }
        }
      }
    }
  });
}

/* ======================================================== */
/*  SECTION 8 — CLUSTERING                                 */
/* ======================================================== */

export function renderClusterCount(data) {
  createChart('chartClusterCount', {
    type: 'bar',
    data: {
      labels: data.clusters.labels,
      datasets: [{
        label: 'Customers',
        data: data.clusters.counts,
        backgroundColor: PALETTE.slice(0, 4),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { border: { display: false }, grid: { color: BORDER } }
      }
    }
  });
}

export function renderClusterRfm(data) {
  createChart('chartClusterRfm', {
    type: 'bar',
    data: {
      labels: data.clusters.labels,
      datasets: [
        {
          label: 'Avg Recency (days)',
          data: data.clusters.avg_recency,
          backgroundColor: '#d4a0a0',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Avg Frequency',
          data: data.clusters.avg_frequency,
          backgroundColor: ACCENT,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Avg Monetary (÷10)',
          data: data.clusters.avg_monetary.map(v => v / 10),
          backgroundColor: MAROON,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          ...tooltipDefaults(),
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              if (ctx.datasetIndex === 2) return ` £${(v * 10).toLocaleString()} monetary`;
              if (ctx.datasetIndex === 1) return ` ${v} frequency`;
              return ` ${v} days recency`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { border: { display: false }, grid: { color: BORDER } }
      }
    }
  });
}

/* ======================================================== */
/*  SECTION 9 — ANOMALY DETECTION                         */
/* ======================================================== */

export function renderCancelTrend(data) {
  createChart('chartCancelTrend', {
    type: 'bar',
    data: {
      labels: data.cancellations.months,
      datasets: [{
        label: 'Cancellations',
        data: data.cancellations.counts,
        backgroundColor: ACCENT,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { border: { display: false }, grid: { color: BORDER } }
      }
    }
  });
}

export function renderCancelCountry(data) {
  createChart('chartCancelCountry', {
    type: 'bar',
    data: {
      labels: data.cancellations.top_countries,
      datasets: [{
        label: 'Cancellations',
        data: data.cancellations.top_countries_count,
        backgroundColor: PALETTE.slice(0, 10),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults() }
      },
      scales: {
        x: { border: { display: false }, grid: { color: BORDER } },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}

export function renderAnomalyStats(data) {
  const container = document.getElementById('anomalyStats');
  if (!container) return;
  const c = data.cancellations;
  container.innerHTML = [
    { label: 'Total Cancelled Invoices', value: c.total_cancelled_invoices.toLocaleString() },
    { label: 'Revenue Loss',             value: '£' + Math.abs(c.total_cancel_revenue_loss).toLocaleString() },
    { label: 'Cancellation Rate',        value: data.kpi.cancellation_rate.toFixed(2) + '%' },
    { label: 'Peak Cancel Month',        value: 'Nov 2011 (441)' },
  ].map(c => `
    <div class="stat-card">
      <p class="stat-card__label">${c.label}</p>
      <p class="stat-card__value">${c.value}</p>
    </div>
  `).join('');
}
