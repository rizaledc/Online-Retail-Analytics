/**
 * charts.js — All Chart.js renderers with rich professional tooltips & annotations
 */

/* ── PALETTE ─────────────────────────────────────────────── */
const C_MAROON = '#800000';
const C_ACCENT = '#c0392b';
const C_LIGHT  = '#f5e6e6';
const C_BORDER = '#e8e8e8';
const PALETTE  = ['#800000','#9b1b1b','#b52c2c','#c0392b','#cc5555','#d47777','#e0a0a0','#edc8c8'];

/* ── GLOBAL CHART DEFAULTS ───────────────────────────────── */
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#444444';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding  = 14;

/* ── SHARED DARK TOOLTIP BASE ────────────────────────────── */
function tip() {
  return {
    backgroundColor: '#1a1a1a',
    titleColor:      '#ffffff',
    bodyColor:       '#cccccc',
    borderWidth:     0,
    padding:         { x: 14, y: 10 },
    cornerRadius:    6,
    titleFont:       { family: "'Inter', sans-serif", size: 13, weight: '600' },
    bodyFont:        { family: "'Inter', sans-serif", size: 12 },
    displayColors:   false,
  };
}

/* ── ANNOTATION HELPERS ─────────────────────────────────── */
export function annoVLine(xVal, text) {
  return {
    type: 'line', scaleID: 'x', value: xVal,
    borderColor: '#800000', borderWidth: 1.5, borderDash: [6, 4],
    label: { display: true, content: text, backgroundColor: '#800000', color: '#ffffff', font: { size: 11 }, position: 'start', yAdjust: 10 },
    drawTime: 'afterDraw'
  };
}
export function annoHLine(yVal, text) {
  return {
    type: 'line', scaleID: 'y', value: yVal,
    borderColor: '#888888', borderWidth: 1, borderDash: [4, 4],
    label: { display: true, content: text, backgroundColor: 'transparent', color: '#888888', font: { size: 11 }, position: 'start', yAdjust: -12 }
  };
}
export function annoPointLabel(xVal, yVal, text, pos = 'top') {
  return [
    { type: 'point', xValue: xVal, yValue: yVal, backgroundColor: '#800000', borderColor: '#ffffff', borderWidth: 1.5, radius: 5, drawTime: 'afterDraw' },
    { type: 'label', xValue: xVal, yValue: yVal, content: text, backgroundColor: '#1a1a1a', color: '#ffffff', font: { size: 11 }, borderRadius: 4, padding: 6, yAdjust: pos === 'top' ? -28 : -28, drawTime: 'afterDraw' }
  ];
}
export function annoBox(xIdx, text) {
  return {
    type: 'box', xMin: xIdx - 0.4, xMax: xIdx + 0.4,
    backgroundColor: 'rgba(192,57,43,0.08)', borderColor: '#c0392b', borderWidth: 2,
    label: { display: true, content: text, position: 'top', backgroundColor: '#1a1a1a', color: '#ffffff', font: { size: 11 }, padding: 4 }
  };
}

/* ── FORMATTERS ─────────────────────────────────────────── */
export function fmtCurrency(v) {
  if (v == null) return '—';
  return '£' + Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function fmtNum(v) {
  if (v == null) return '—';
  return Number(v).toLocaleString('en-GB');
}

/* ── CHART EXPORT ───────────────────────────────────────── */
export function addExportButton(chartInstance, cardElement, filename) {
  if (!cardElement || !chartInstance) return;
  let btn = cardElement.querySelector('.chart-export-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'chart-export-btn';
    btn.innerHTML = `<i data-lucide="download"></i> PNG`;
    cardElement.appendChild(btn);
  }
  
  btn.onclick = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.download = `chart-${filename}-${Date.now()}.png`;
    link.href = chartInstance.canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── CHART REGISTRY ─────────────────────────────────────── */
const _charts = {};
export function createChart(id, config) {
  if (_charts[id]) _charts[id].destroy();
  const el = document.getElementById(id);
  if (!el) return null;
  
  _charts[id] = new Chart(el.getContext('2d'), config);
  
  const card = el.closest('.chart-card');
  if (card) {
    addExportButton(_charts[id], card, id.replace('chart', '').toLowerCase());
  }
  
  return _charts[id];
}

/* ── AXIS HELPERS ────────────────────────────────────────── */
const axX = (extra = {}) => ({ grid: { display: false }, border: { display: false }, ...extra });
const axY = (extra = {}) => ({ border: { display: false }, grid: { color: C_BORDER }, ...extra });

/* ======================================================
   OVERVIEW — monthly revenue
====================================================== */
export function renderOverviewRevenue(data) {
  const months  = data.monthly_trends.months;
  const revenue = data.monthly_trends.revenue;
  createChart('chartOverviewRevenue', {
    type: 'line',
    data: { labels: months, datasets: [{ label: 'Revenue', data: revenue,
      borderColor: C_MAROON, backgroundColor: 'rgba(128,0,0,0.07)',
      pointBackgroundColor: C_MAROON, pointRadius: 4, pointHoverRadius: 6,
      fill: true, tension: 0.35, borderWidth: 2.5 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tip(), mode: 'index', intersect: false,
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx => `  Pendapatan: ${fmtCurrency(ctx.parsed.y)}`,
          }
        }
      },
      scales: { x: axX(), y: axY({ ticks: { callback: v => fmtCurrency(v) } }) }
    }
  });
}

/* ======================================================
   UNIT PRICE
====================================================== */
export function renderPriceBar(data) {
  createChart('chartPriceBar', {
    type: 'bar',
    data: { labels: data.unit_price.segments, datasets: [{ label: 'Count', data: data.unit_price.counts,
      backgroundColor: PALETTE.slice(0,5), borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => `Segmen Harga: ${ctx[0].label}`,
          label: ctx => `  Jumlah Transaksi: ${fmtNum(ctx.parsed.y)}`,
        }}
      },
      scales: { x: axX(), y: axY({ ticks: { callback: v => fmtNum(v) } }) }
    }
  });
}

export function renderPriceDonut(data) {
  createChart('chartPriceDonut', {
    type: 'doughnut',
    data: { labels: data.unit_price.segments, datasets: [{ data: data.unit_price.counts,
      backgroundColor: PALETTE.slice(0,5), borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { ...tip(), callbacks: {
          title: ctx => `Segmen: ${ctx[0].label}`,
          label: ctx => {
            const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
            return [`  Jumlah: ${fmtNum(ctx.parsed)}`, `  Proporsi: ${((ctx.parsed/total)*100).toFixed(1)}%`];
          }
        }}
      }
    }
  });
}

export function renderPriceStats(data) {
  const s  = data.unit_price.stats;
  const el = document.getElementById('priceStats');
  if (!el) return;
  el.innerHTML = [
    { label: 'Mean Price',   value: fmtCurrency(s.mean)   },
    { label: 'Median Price', value: fmtCurrency(s.median) },
    { label: 'Min Price',    value: fmtCurrency(s.min)    },
    { label: 'Max Price',    value: fmtCurrency(s.max)    },
  ].map(c => `<div class="stat-card"><p class="stat-card__label">${c.label}</p><p class="stat-card__value">${c.value}</p></div>`).join('');
}

/* ======================================================
   COUNTRY ANALYSIS
====================================================== */
export function renderCountryRevenue(data) {
  const countries = data.country.countries;
  const metrics = {
    revenue: { label: 'Revenue', data: data.country.revenue, title: 'Top 15 Countries by Revenue', fmt: fmtCurrency },
    transactions: { label: 'Transactions', data: data.country.transactions, title: 'Top 15 Countries by Transactions', fmt: fmtNum },
    avg_order_value: { label: 'Avg Order Value', data: data.country.avg_order_value, title: 'Top 15 Countries by Avg Order Value', fmt: fmtCurrency }
  };

  let currentMetric = 'revenue';
  const titleEl = document.getElementById('chartCountryRevenue').closest('.chart-card').querySelector('.chart-title');

  const chart = createChart('chartCountryRevenue', {
    type: 'bar',
    data: { labels: countries, datasets: [{ label: metrics[currentMetric].label, data: metrics[currentMetric].data,
      backgroundColor: C_MAROON, borderRadius: 4, borderSkipped: false }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => {
            const m = metrics[currentMetric];
            return `  ${m.label} : ${m.fmt(ctx.parsed.x)}`;
          }
        }}
      },
      scales: { x: axY({ ticks: { callback: v => metrics[currentMetric].fmt(v) } }), y: axX({ ticks: { font: { size: 11 } } }) }
    }
  });

  const btns = document.querySelectorAll('#page-country .filter-btn');
  btns.forEach(btn => {
    // Prevent multiple listeners if re-rendered
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
      document.querySelectorAll('#page-country .filter-btn').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');
      currentMetric = newBtn.dataset.metric;
      
      const m = metrics[currentMetric];
      if (titleEl) titleEl.textContent = m.title;
      chart.data.datasets[0].label = m.label;
      chart.data.datasets[0].data = m.data;
      chart.options.scales.x.ticks.callback = v => m.fmt(v);
      chart.update();
    });
  });
}

export function renderCountryTx(data) {
  const countries = data.country.countries.slice(0, 10);
  const tx        = data.country.transactions.slice(0, 10);
  createChart('chartCountryTx', {
    type: 'bar',
    data: { labels: countries, datasets: [{ label: 'Transactions', data: tx,
      backgroundColor: C_ACCENT, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => `  Transaksi: ${fmtNum(ctx.parsed.y)}`,
        }}
      },
      scales: { x: axX({ ticks: { maxRotation: 45, font: { size: 10 } } }), y: axY({ ticks: { callback: v => fmtNum(v) } }) }
    }
  });
}

export function renderUkPie(data) {
  const total = data.kpi.total_revenue;
  const uk    = data.country.revenue[0];
  createChart('chartUkPie', {
    type: 'pie',
    data: { labels: ['United Kingdom', 'Non-UK'], datasets: [{ data: [uk, total - uk],
      backgroundColor: [C_MAROON, '#d4a0a0'], borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => {
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return [`  Pendapatan: ${fmtCurrency(ctx.parsed)}`, `  Proporsi: ${pct}%`];
          }
        }}
      }
    }
  });
}

export function renderCountryAov(data) {
  const countries = data.country.countries.slice(0, 10);
  const aov       = data.country.avg_order_value.slice(0, 10);
  const revenue   = data.country.revenue.slice(0, 10);
  createChart('chartCountryAov', {
    type: 'bar',
    data: { labels: countries, datasets: [{ label: 'Avg Order Value (£)', data: aov,
      backgroundColor: PALETTE.slice(0,10).reverse(), borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => {
            const i = ctx.dataIndex;
            return [`  Avg Order Value: ${fmtCurrency(aov[i])}`, `  Total Pendapatan: ${fmtCurrency(revenue[i])}`];
          }
        }}
      },
      scales: { x: axX({ ticks: { maxRotation: 45, font: { size: 10 } } }), y: axY({ ticks: { callback: v => '£' + v } }) }
    }
  });
}

/* ======================================================
   CUSTOMER BEHAVIOR
====================================================== */
export function renderCustCount(data) {
  createChart('chartCustCount', {
    type: 'bar',
    data: { labels: data.customer_type.types, datasets: [{ label: 'Customers', data: data.customer_type.counts,
      backgroundColor: PALETTE.slice(0,4), borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => `  Jumlah Pelanggan: ${fmtNum(ctx.parsed.y)}`,
        }}
      },
      scales: { x: axX(), y: axY() }
    }
  });
}

export function renderCustRevenue(data) {
  createChart('chartCustRevenue', {
    type: 'bar',
    data: { labels: data.customer_type.types, datasets: [{ label: 'Revenue (£)', data: data.customer_type.revenue,
      backgroundColor: [C_LIGHT, '#d4a0a0', C_ACCENT, C_MAROON], borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => `  Pendapatan: ${fmtCurrency(ctx.parsed.y)}`,
        }}
      },
      scales: { x: axX(), y: axY({ ticks: { callback: v => fmtCurrency(v) } }) }
    }
  });
}

/* ======================================================
   MONTHLY TRENDS (with % change & annotations)
====================================================== */
export function renderMonthlyTrend(data, metric = 'revenue') {
  const isCurrency = metric === 'revenue';
  const label      = { revenue: 'Revenue', quantity: 'Quantity', transactions: 'Transactions' }[metric];
  const values     = data.monthly_trends[metric];
  const months     = data.monthly_trends.months;

  // Compute dynamic points for annotations
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const maxIdx = values.indexOf(maxVal);
  const minIdx = values.indexOf(minVal);
  
  const annos = [];
  if (metric === 'revenue') {
    const sepIdx = months.indexOf('2011-09');
    if (sepIdx !== -1) annos.push(annoVLine(sepIdx, 'Tren naik dimulai'));
    annos.push(...annoPointLabel(maxIdx, maxVal, `Puncak Revenue ${fmtCurrency(maxVal)}`, 'top'));
    annos.push(...annoPointLabel(minIdx, minVal, `Terendah ${fmtCurrency(minVal)}`, 'bottom'));
  } else if (metric === 'quantity') {
    const sepIdx = months.indexOf('2011-09');
    if (sepIdx !== -1) annos.push(annoVLine(sepIdx, 'Akselerasi pertumbuhan'));
    annos.push(...annoPointLabel(maxIdx, maxVal, `Puncak Quantity ${fmtNum(maxVal)} unit`, 'top'));
  } else if (metric === 'transactions') {
    annos.push(...annoPointLabel(maxIdx, maxVal, `Transaksi tertinggi ${fmtNum(maxVal)}`, 'top'));
    annos.push(...annoPointLabel(minIdx, minVal, `Terendah ${fmtNum(minVal)}`, 'bottom'));
  }

  const canvasId = metric === 'revenue' ? 'chartTrendRevenue' : 
                   metric === 'quantity' ? 'chartTrendQuantity' : 'chartTrendTransactions';

  createChart(canvasId, {
    type: 'line',
    data: { labels: months, datasets: [{ label, data: values,
      borderColor: C_MAROON, backgroundColor: 'rgba(128,0,0,0.07)',
      pointBackgroundColor: C_MAROON, pointRadius: 4, pointHoverRadius: 7,
      fill: true, tension: 0.35, borderWidth: 2.5 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 35, bottom: 35, left: 20, right: 50 } },
      plugins: {
        legend: { display: false },
        annotation: { clip: false, annotations: annos },
        tooltip: { ...tip(), mode: 'index', intersect: false,
          callbacks: {
            title: ctx => `Bulan: ${ctx[0].label}`,
            label: ctx => {
              const i    = ctx.dataIndex;
              const val  = ctx.parsed.y;
              const fVal = isCurrency ? fmtCurrency(val) : fmtNum(val);
              if (i === 0) return [`  ${label}: ${fVal}`, '  Perubahan: —'];
              const prev = values[i - 1];
              const pct  = ((val - prev) / prev) * 100;
              const sign = pct >= 0 ? '▲' : '▼';
              return [`  ${label}: ${fVal}`, `  ${sign} ${Math.abs(pct).toFixed(1)}% vs bulan lalu`];
            }
          }
        }
      },
      scales: {
        x: axX(),
        y: axY({ ticks: { callback: v => isCurrency ? fmtCurrency(v) : fmtNum(v) } })
      }
    }
  });
}

/* ======================================================
   TOP PRODUCTS
====================================================== */
export function renderTopProducts(data) {
  const products = data.top_products.products;
  const qty      = data.top_products.quantity;
  createChart('chartTopProducts', {
    type: 'bar',
    data: { labels: products, datasets: [{ label: 'Quantity', data: qty,
      backgroundColor: PALETTE.slice(0,10), borderRadius: 4, borderSkipped: false }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => products[ctx[0].dataIndex],
          label: ctx => `  Terjual: ${fmtNum(ctx.parsed.x)} unit`,
        }}
      },
      scales: { x: axY({ ticks: { callback: v => fmtNum(v) } }), y: axX({ ticks: { font: { size: 10 } } }) }
    }
  });
}

/* ======================================================
   RFM SEGMENTATION
====================================================== */
function rfmTooltipLines(data, i) {
  return [
    `  Pelanggan  : ${fmtNum(data.rfm.counts[i])}`,
    `  Recency    : ${data.rfm.avg_recency[i].toFixed(1)} hari`,
    `  Frequency  : ${data.rfm.avg_frequency[i].toFixed(2)}x`,
    `  Monetary   : ${fmtCurrency(data.rfm.avg_monetary[i])}`,
  ];
}

export function renderRfmCount(rfmData) {
  createChart('chartRfmCount', {
    type: 'bar',
    data: { labels: rfmData.rfm.segments, datasets: [{ label: 'Customers', data: rfmData.rfm.counts,
      backgroundColor: PALETTE.slice(0,6), borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => `Segmen: ${ctx[0].label}`,
          label: ctx => rfmTooltipLines(rfmData, ctx.dataIndex),
        }}
      },
      scales: { x: axX({ ticks: { font: { size: 10 }, maxRotation: 30 } }), y: axY() }
    }
  });
}

export function renderRfmMonetary(rfmData) {
  const avg = rfmData.kpi.total_revenue / rfmData.kpi.total_customers;
  const annos = [ annoHLine(avg, `Rata-rata keseluruhan ${fmtCurrency(avg)}`) ];

  createChart('chartRfmMonetary', {
    type: 'bar',
    data: { labels: rfmData.rfm.segments, datasets: [{ label: 'Avg Monetary (£)', data: rfmData.rfm.avg_monetary,
      backgroundColor: [C_LIGHT, C_MAROON, '#f0c0c0', '#b52c2c', '#e08080', '#9b1b1b'],
      borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: { annotations: annos },
        tooltip: { ...tip(), callbacks: {
          title: ctx => `Segmen: ${ctx[0].label}`,
          label: ctx => rfmTooltipLines(rfmData, ctx.dataIndex),
        }}
      },
      scales: { x: axX({ ticks: { font: { size: 10 }, maxRotation: 30 } }), y: axY({ ticks: { callback: v => '£' + fmtNum(v) } }) }
    }
  });
}

export function renderRfmRadar(data) {
  const norm  = arr => { const m = Math.max(...arr); return arr.map(v => Math.round((v/m)*100)); };
  const maxR  = Math.max(...data.rfm.avg_recency);
  const recInv = data.rfm.avg_recency.map(v => Math.round(((maxR-v)/maxR)*100));

  createChart('chartRfmRadar', {
    type: 'radar',
    data: { labels: data.rfm.segments, datasets: [
      { label: 'Recency (inv.)', data: recInv, borderColor: C_MAROON, backgroundColor: 'rgba(128,0,0,0.10)', borderWidth: 2, pointBackgroundColor: C_MAROON, pointRadius: 3 },
      { label: 'Frequency',      data: norm(data.rfm.avg_frequency), borderColor: C_ACCENT, backgroundColor: 'rgba(192,57,43,0.08)', borderWidth: 2, pointBackgroundColor: C_ACCENT, pointRadius: 3 },
      { label: 'Monetary',       data: norm(data.rfm.avg_monetary),  borderColor: '#d4a0a0', backgroundColor: 'rgba(212,160,160,0.10)', borderWidth: 2, pointBackgroundColor: '#d4a0a0', pointRadius: 3 },
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' }, tooltip: { ...tip() } },
      scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: C_BORDER }, pointLabels: { font: { size: 10 } } } }
    }
  });
}

/* ======================================================
   CUSTOMER CLUSTERING
====================================================== */
const CLUSTER_DESC = {
  'High-Value':    'Pelanggan paling berharga, transaksi sangat sering',
  'Loyal Active':  'Aktif dan konsisten, potensi upgrade ke High-Value',
  'Occasional':    'Pembelian tidak rutin, perlu stimulus',
  'Dormant':       'Tidak aktif lama, kandidat win-back campaign',
};

export function renderClusterCount(data) {
  const labels = data.clusters.labels;
  createChart('chartClusterCount', {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Customers', data: data.clusters.counts,
      backgroundColor: PALETTE.slice(0,4), borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => `Cluster: ${ctx[0].label}`,
          label: ctx => [
            `  Jumlah Pelanggan: ${fmtNum(ctx.parsed.y)}`,
            `  "${CLUSTER_DESC[ctx.label] || ''}"`,
          ],
        }}
      },
      scales: { x: axX(), y: axY() }
    }
  });
}

export function renderClusterRfm(data) {
  const labels     = data.clusters.labels;
  const monetaryRaw = data.clusters.avg_monetary;
  createChart('chartClusterRfm', {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Avg Recency (days)', data: data.clusters.avg_recency,   backgroundColor: '#d4a0a0', borderRadius: 4, borderSkipped: false },
      { label: 'Avg Frequency',      data: data.clusters.avg_frequency, backgroundColor: C_ACCENT,  borderRadius: 4, borderSkipped: false },
      { label: 'Avg Monetary (÷10)', data: monetaryRaw.map(v => v/10),  backgroundColor: C_MAROON,  borderRadius: 4, borderSkipped: false },
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { ...tip(), mode: 'index', intersect: false,
          callbacks: {
            title: ctx => `Cluster: ${labels[ctx[0].dataIndex]}`,
            label: ctx => {
              const i    = ctx.dataIndex;
              const dsIdx = ctx.datasetIndex;
              if (dsIdx === 0) return `  Avg Recency  : ${data.clusters.avg_recency[i].toFixed(1)} hari`;
              if (dsIdx === 1) return `  Avg Frequency: ${data.clusters.avg_frequency[i].toFixed(2)}x`;
              return `  Avg Monetary : ${fmtCurrency(monetaryRaw[i])}`;
            },
            afterBody: ctx => {
              const label = labels[ctx[0].dataIndex];
              return [``, `  ${CLUSTER_DESC[label] || ''}`];
            }
          }
        }
      },
      scales: { x: axX(), y: axY() }
    }
  });
}

/* ======================================================
   ANOMALY / CANCELLATIONS
====================================================== */
export function renderCancelTrend(data) {
  const counts   = data.cancellations.counts;
  const months   = data.cancellations.months;
  const maxCount = Math.max(...counts);
  const maxIdx   = counts.indexOf(maxCount);

  const annos = [ annoBox(maxIdx, 'Puncak pembatalan') ];

  createChart('chartCancelTrend', {
    type: 'bar',
    data: { labels: months, datasets: [{ label: 'Cancellations', data: counts,
      backgroundColor: C_ACCENT, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: { annotations: annos },
        tooltip: { ...tip(), callbacks: {
          title: ctx => `Bulan: ${ctx[0].label}`,
          label: ctx => {
            const count = ctx.parsed.y;
            const lines = [`  Invoice Dibatalkan: ${fmtNum(count)}`];
            if (count === maxCount) lines.push('  ⚠ Puncak pembatalan');
            return lines;
          }
        }}
      },
      scales: { x: axX(), y: axY() }
    }
  });
}

export function renderCancelCountry(data) {
  createChart('chartCancelCountry', {
    type: 'bar',
    data: { labels: data.cancellations.top_countries, datasets: [{ label: 'Cancellations', data: data.cancellations.top_countries_count,
      backgroundColor: PALETTE.slice(0,10), borderRadius: 4, borderSkipped: false }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip(), callbacks: {
          title: ctx => ctx[0].label,
          label: ctx => `  Pembatalan: ${fmtNum(ctx.parsed.x)}`,
        }}
      },
      scales: { x: axY({ ticks: { callback: v => fmtNum(v) } }), y: axX() }
    }
  });
}

export function renderAnomalyStats(data) {
  const el = document.getElementById('anomalyStats');
  if (!el) return;
  const c = data.cancellations;
  el.innerHTML = [
    { label: 'Cancelled Invoices', value: fmtNum(c.total_cancelled_invoices)             },
    { label: 'Revenue Loss',       value: fmtCurrency(Math.abs(c.total_cancel_revenue_loss)) },
    { label: 'Cancellation Rate',  value: data.kpi.cancellation_rate.toFixed(2) + '%'   },
    { label: 'Peak Cancel Month',  value: 'Nov 2011 (441)'                               },
  ].map(s => `<div class="stat-card"><p class="stat-card__label">${s.label}</p><p class="stat-card__value">${s.value}</p></div>`).join('');
}
