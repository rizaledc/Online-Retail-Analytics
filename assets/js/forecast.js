/**
 * forecast.js — Prophet forecast chart with confidence interval band & annotations
 */

import { fmtCurrency, fmtNum, createChart, annoVLine, annoHLine } from './charts.js';

const C_MAROON = '#800000';
const C_ACCENT = '#c0392b';
const C_BORDER = '#e8e8e8';

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

function fmtValue(v, metric) {
  if (v === null || v === undefined) return '—';
  if (metric === 'revenue') return fmtCurrency(v);
  return fmtNum(v);
}

export function renderForecast(data, metric = 'revenue') {
  const fc          = data.forecast[metric];
  const isCurrency  = metric === 'revenue';

  /* ── Title ── */
  const titleMap = {
    revenue:      'Revenue Forecast (Dec 2011 – May 2012)',
    quantity:     'Quantity Forecast (Dec 2011 – May 2012)',
    transactions: 'Transactions Forecast (Dec 2011 – May 2012)',
  };
  const titleEl = document.getElementById('forecastChartTitle');
  if (titleEl) titleEl.textContent = titleMap[metric];

  /* ── Accuracy badges ── */
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

  /* ── Build unified timeline ── */
  const actualMonths = data.monthly_trends.months;
  const actualValues = data.monthly_trends[metric];
  const fcMonths     = fc.months;

  const allLabels = [...actualMonths];
  fcMonths.forEach(m => { if (!allLabels.includes(m)) allLabels.push(m); });

  const series = (months, values) =>
    allLabels.map(m => {
      const i = months.indexOf(m);
      return i !== -1 ? values[i] : null;
    });

  const actualSeries   = series(actualMonths, actualValues);
  const forecastSeries = series(fcMonths, fc.forecast);
  const upperSeries    = series(fcMonths, fc.upper);
  const lowerSeries    = series(fcMonths, fc.lower);

  /* ── Annotations ── */
  const actualValuesFiltered = actualSeries.filter(v => v !== null);
  const avgActual = actualValuesFiltered.reduce((a,b)=>a+b,0) / actualValuesFiltered.length;
  
  const annos = [
    annoVLine(fcMonths[0], 'Mulai proyeksi'),
    annoHLine(avgActual, `Rata-rata aktual ${isCurrency ? fmtCurrency(avgActual) : fmtNum(avgActual)}`)
  ];

  /* ── Chart ── */
  createChart('chartForecast', {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        { label: 'Upper CI', data: upperSeries, borderColor: 'transparent', backgroundColor: 'rgba(128,0,0,0.10)', pointRadius: 0, fill: '+1', tension: 0.35, order: 4 },
        { label: 'Lower CI', data: lowerSeries, borderColor: 'transparent', backgroundColor: 'rgba(128,0,0,0.10)', pointRadius: 0, fill: false, tension: 0.35, order: 5 },
        { label: 'Forecast', data: forecastSeries, borderColor: C_ACCENT, backgroundColor: 'transparent', borderWidth: 2.5, borderDash: [6,4], pointBackgroundColor: C_ACCENT, pointRadius: 5, pointHoverRadius: 7, fill: false, tension: 0.35, order: 2 },
        { label: 'Actual',   data: actualSeries,   borderColor: C_MAROON, backgroundColor: 'transparent', borderWidth: 2.5, pointBackgroundColor: C_MAROON, pointRadius: 4, pointHoverRadius: 6, fill: false, tension: 0.35, order: 1 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { filter: item => item.text !== 'Upper CI' && item.text !== 'Lower CI' }
        },
        annotation: { annotations: annos },
        tooltip: {
          ...tip(),
          filter: item => item.dataset.label !== 'Upper CI' && item.dataset.label !== 'Lower CI',
          callbacks: {
            title: ctx => `Bulan: ${ctx[0].label}`,
            label: ctx => {
              if (ctx.parsed.y === null) return null;
              const v = fmtValue(ctx.parsed.y, metric);
              if (ctx.dataset.label === 'Actual')   return `  Aktual   : ${v}`;
              if (ctx.dataset.label === 'Forecast') return `  Forecast : ${v}`;
              return null;
            },
            afterBody: ctx => {
              const fcCtx = ctx.find(c => c.dataset.label === 'Forecast' && c.parsed.y !== null);
              if (!fcCtx) return [];
              const i     = fcCtx.dataIndex;
              const lbl   = allLabels[i];
              const fcIdx = fc.months.indexOf(lbl);
              if (fcIdx === -1) return [];
              return [
                ``,
                `  Batas Bawah: ${fmtValue(fc.lower[fcIdx], metric)}`,
                `  Batas Atas : ${fmtValue(fc.upper[fcIdx], metric)}`,
                `  Akurasi    : MAPE ${fc.mape}%`,
              ];
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { border: { display: false }, grid: { color: C_BORDER }, ticks: { callback: v => fmtValue(v, metric) } }
      }
    }
  });
}

