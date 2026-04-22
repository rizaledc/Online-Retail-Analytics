/**
 * forecast.js — Prophet forecast chart with confidence interval band
 * Uses Chart.js fill between upper/lower bound datasets
 */

const MAROON = '#800000';
const ACCENT = '#c0392b';
const BORDER = '#e8e8e8';

let forecastChartInstance = null;

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

function fmtValue(v, metric) {
  if (metric === 'revenue') {
    if (v >= 1_000_000) return '£' + (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000)     return '£' + (v / 1_000).toFixed(1) + 'K';
    return '£' + v.toFixed(0);
  }
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
  return String(v);
}

/**
 * renderForecast
 * @param {Object} data  - full dashboard_data.json object
 * @param {string} metric - 'revenue' | 'quantity' | 'transactions'
 */
export function renderForecast(data, metric = 'revenue') {
  const fc = data.forecast[metric];
  const isCurrency = metric === 'revenue';

  // Title
  const titleMap = {
    revenue:      'Revenue Forecast (Dec 2011 – May 2012)',
    quantity:     'Quantity Forecast (Dec 2011 – May 2012)',
    transactions: 'Transactions Forecast (Dec 2011 – May 2012)',
  };
  const titleEl = document.getElementById('forecastChartTitle');
  if (titleEl) titleEl.textContent = titleMap[metric];

  // Badges
  const badgesEl = document.getElementById('forecastBadges');
  if (badgesEl) {
    badgesEl.innerHTML = `
      <div class="metric-badge">
        <span class="metric-badge__label">MAPE</span>
        <span class="metric-badge__value">${fc.mape}%</span>
      </div>
      ${fc.mae ? `
      <div class="metric-badge">
        <span class="metric-badge__label">MAE</span>
        <span class="metric-badge__value">${fmtValue(fc.mae, metric)}</span>
      </div>` : ''}
    `;
  }

  // Combine actual months + forecast months for full timeline
  const actualMonths = data.monthly_trends.months;
  const actualValues = data.monthly_trends[metric];

  // Merge labels: actual (hist) + forecast
  // Forecast months may overlap last actual month (2011-12)
  const forecastMonths = fc.months;

  // Build combined labels (no duplicates)
  const allLabels = [...actualMonths];
  forecastMonths.forEach(m => { if (!allLabels.includes(m)) allLabels.push(m); });

  // Map actual data
  const actualSeries = allLabels.map(m => {
    const idx = actualMonths.indexOf(m);
    return idx !== -1 ? actualValues[idx] : null;
  });

  // Map forecast data (starts at first forecast month)
  const forecastSeries = allLabels.map(m => {
    const idx = forecastMonths.indexOf(m);
    return idx !== -1 ? fc.forecast[idx] : null;
  });

  const upperSeries = allLabels.map(m => {
    const idx = forecastMonths.indexOf(m);
    return idx !== -1 ? fc.upper[idx] : null;
  });

  const lowerSeries = allLabels.map(m => {
    const idx = forecastMonths.indexOf(m);
    return idx !== -1 ? fc.lower[idx] : null;
  });

  // Destroy previous instance
  if (forecastChartInstance) {
    forecastChartInstance.destroy();
    forecastChartInstance = null;
  }

  const ctx = document.getElementById('chartForecast');
  if (!ctx) return;

  forecastChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        /* 1. Upper confidence bound (invisible line, fill down to lower) */
        {
          label: 'Upper Bound',
          data: upperSeries,
          borderColor: 'transparent',
          backgroundColor: 'rgba(128,0,0,0.10)',
          pointRadius: 0,
          fill: '+1',       // fill down to next dataset (lower)
          tension: 0.35,
          order: 3,
        },
        /* 2. Lower confidence bound */
        {
          label: 'Lower Bound',
          data: lowerSeries,
          borderColor: 'transparent',
          backgroundColor: 'rgba(128,0,0,0.10)',
          pointRadius: 0,
          fill: false,
          tension: 0.35,
          order: 4,
        },
        /* 3. Forecast line */
        {
          label: 'Forecast',
          data: forecastSeries,
          borderColor: ACCENT,
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [6, 4],
          pointBackgroundColor: ACCENT,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.35,
          order: 2,
        },
        /* 4. Actual historical line */
        {
          label: 'Actual',
          data: actualSeries,
          borderColor: MAROON,
          backgroundColor: 'rgba(128,0,0,0.06)',
          borderWidth: 2.5,
          pointBackgroundColor: MAROON,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.35,
          order: 1,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            filter: item => item.text !== 'Upper Bound' && item.text !== 'Lower Bound',
          }
        },
        tooltip: {
          ...tooltipDefaults(),
          filter: item => item.dataset.label !== 'Upper Bound' && item.dataset.label !== 'Lower Bound',
          callbacks: {
            label: ctx => {
              if (ctx.parsed.y === null) return null;
              return ` ${ctx.dataset.label}: ${fmtValue(ctx.parsed.y, metric)}`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          border: { display: false },
          grid: { color: BORDER },
          ticks: { callback: v => fmtValue(v, metric) }
        }
      }
    }
  });
}
