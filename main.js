/**
 * main.js — Entry point
 * Fetches dashboard_data.json, populates KPIs, renders all charts,
 * wires up filter buttons and navbar scroll behavior.
 */

import {
  renderPriceBar, renderPriceDonut, renderPriceStats,
  renderCountryRevenue, renderCountryTx, renderUkPie, renderCountryAov,
  renderCustCount, renderCustRevenue, renderOrderDist,
  renderMonthlyTrend,
  renderTopProducts,
  renderRfmCount, renderRfmMonetary, renderRfmRadar,
  renderClusterCount, renderClusterRfm,
  renderCancelTrend, renderCancelCountry, renderAnomalyStats,
} from './charts.js';

import { renderForecast } from './forecast.js';

/* ── DATA FETCH ─────────────────────────────────────────── */
async function loadData() {
  try {
    const res = await fetch('./dashboard_data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load dashboard_data.json:', err);
    document.body.insertAdjacentHTML('afterbegin',
      `<div style="padding:24px;background:#fff0f0;color:#800000;font-family:sans-serif;border-bottom:2px solid #800000">
        ⚠️ Could not load <code>dashboard_data.json</code>. Please serve this directory via a local web server.
      </div>`
    );
    return null;
  }
}

/* ── KPI CARDS ──────────────────────────────────────────── */
function renderKpis(data) {
  const kpi = data.kpi;
  const cards = [
    {
      icon: 'trending-up',
      label: 'Total Revenue',
      value: formatCurrency(kpi.total_revenue),
      sub: 'Dec 2010 – Nov 2011',
    },
    {
      icon: 'receipt',
      label: 'Total Transactions',
      value: kpi.total_transactions.toLocaleString(),
      sub: 'Invoices processed',
    },
    {
      icon: 'users',
      label: 'Total Customers',
      value: kpi.total_customers.toLocaleString(),
      sub: 'Unique customer IDs',
    },
    {
      icon: 'package',
      label: 'Total Products',
      value: kpi.total_products.toLocaleString(),
      sub: 'Unique SKUs',
    },
    {
      icon: 'globe',
      label: 'Countries',
      value: kpi.total_countries,
      sub: 'Markets served',
    },
    {
      icon: 'shopping-cart',
      label: 'Avg Order Value',
      value: '£' + kpi.avg_order_value.toFixed(2),
      sub: 'Per invoice',
    },
    {
      icon: 'x-circle',
      label: 'Cancellation Rate',
      value: kpi.cancellation_rate.toFixed(2) + '%',
      sub: 'Of all invoices',
    },
    {
      icon: 'repeat',
      label: 'Repeat Customer Rate',
      value: kpi.repeat_customer_rate.toFixed(2) + '%',
      sub: 'Customers >1 purchase',
    },
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

  // Re-render Lucide icons after dynamic DOM injection
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function formatCurrency(v) {
  if (v >= 1_000_000) return '£' + (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000)     return '£' + (v / 1_000).toFixed(1) + 'K';
  return '£' + v.toFixed(2);
}

/* ── MONTHLY TREND FILTER ───────────────────────────────── */
function initTrendFilter(data) {
  const buttons = document.querySelectorAll('[data-metric]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      renderMonthlyTrend(data, btn.dataset.metric);
    });
  });
}

/* ── FORECAST FILTER ────────────────────────────────────── */
function initForecastFilter(data) {
  const buttons = document.querySelectorAll('[data-fc]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      renderForecast(data, btn.dataset.fc);
    });
  });
}

/* ── NAVBAR MOBILE TOGGLE ───────────────────────────────── */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ── ACTIVE NAV HIGHLIGHT ON SCROLL ─────────────────────── */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');
  const OFFSET    = 80;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: `-${OFFSET}px 0px -60% 0px`, threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ── MAIN ───────────────────────────────────────────────── */
async function init() {
  const data = await loadData();
  if (!data) return;

  // KPIs
  renderKpis(data);

  // Section 2 — Unit Price
  renderPriceStats(data);
  renderPriceBar(data);
  renderPriceDonut(data);

  // Section 3 — Country
  renderCountryRevenue(data);
  renderCountryTx(data);
  renderUkPie(data);
  renderCountryAov(data);

  // Section 4 — Customer Behavior
  renderCustCount(data);
  renderCustRevenue(data);
  renderOrderDist(data);

  // Section 5 — Monthly Trends
  renderMonthlyTrend(data, 'revenue');
  initTrendFilter(data);

  // Section 6 — Top Products
  renderTopProducts(data);

  // Section 7 — RFM
  renderRfmCount(data);
  renderRfmMonetary(data);
  renderRfmRadar(data);

  // Section 8 — Clustering
  renderClusterCount(data);
  renderClusterRfm(data);

  // Section 9 — Anomaly
  renderAnomalyStats(data);
  renderCancelTrend(data);
  renderCancelCountry(data);

  // Section 10 — Forecast
  renderForecast(data, 'revenue');
  initForecastFilter(data);

  // Nav
  initNavToggle();
  initScrollSpy();
}

document.addEventListener('DOMContentLoaded', init);
