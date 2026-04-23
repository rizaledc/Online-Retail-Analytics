/**
 * advanced.js — Advanced Analytics pages
 * Market Basket, Cohort, Churn Risk, Revenue Pareto,
 * Product Trend Heatmap, Sales Funnel, CLV Analysis
 */

import { createChart, fmtCurrency, fmtNum } from './charts.js';

/* ── PALETTE ─────────────────────────────────────── */
const C_MAROON = '#800000';
const C_ACCENT = '#c0392b';
const C_LIGHT  = '#f5e6e6';
const C_BORDER = '#e8e8e8';
const PALETTE  = ['#800000','#9b1b1b','#b52c2c','#c0392b','#cc5555','#d47777','#e0a0a0','#edc8c8'];

function tip() {
  return {
    backgroundColor:'#1a1a1a', titleColor:'#ffffff', bodyColor:'#cccccc',
    borderWidth:0, padding:{x:14,y:10}, cornerRadius:6, displayColors:false,
    titleFont:{family:"'Inter',sans-serif",size:13,weight:'600'},
    bodyFont:{family:"'Inter',sans-serif",size:12},
  };
}
const axX = (e={}) => ({grid:{display:false},border:{display:false},...e});
const axY = (e={}) => ({border:{display:false},grid:{color:C_BORDER},...e});

/* ── SORTABLE TABLE (standalone) ─────────────────── */
export function renderSortableTable(containerId, columns, data, defaultSortBy=null, defaultSortAsc=false) {
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
      if (sortCol === col.id) { sortAsc = !sortAsc; } else { sortCol = col.id; sortAsc = false; }
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
    currentData.sort((a,b) => {
      let va=a[sortCol], vb=b[sortCol];
      if (typeof va === 'string') { const c=va.localeCompare(vb); return sortAsc?c:-c; }
      return sortAsc ? va-vb : vb-va;
    });
    thead.querySelectorAll('th').forEach((th,i) => {
      th.className = columns[i].align==='right' ? 'align-right' : 'align-left';
      if (columns[i].id === sortCol) th.classList.add(sortAsc?'sort-asc':'sort-desc');
    });
    tbody.innerHTML = '';
    currentData.forEach(row => {
      const tr = document.createElement('tr');
      columns.forEach(col => {
        const td = document.createElement('td');
        td.className = col.align==='right' ? 'align-right' : 'align-left';
        td.innerHTML = col.render ? col.render(row[col.id], row) : (row[col.id] ?? '—');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  render();
}

/* ── HEATMAP COLOR HELPER ────────────────────────── */
function heatColor(value, max) {
  if (value === null || value === undefined) return '#f0f0f0';
  const t = Math.max(0, Math.min(1, value / max));
  const r = Math.round(245 - (245 - 128) * t);
  const g = Math.round(230 - 230 * t);
  const b = Math.round(230 - 230 * t);
  return `rgb(${r},${g},${b})`;
}
function textColorForBg(t) {
  return t > 0.55 ? '#ffffff' : '#1a1a1a';
}

/* ==================================================================
   1. MARKET BASKET ANALYSIS
================================================================== */
export function renderMarketBasket(ext) {
  const rules = ext.market_basket.top_rules;

  /* Scatter: support × confidence, colored by lift */
  const maxLift = Math.max(...rules.map(r => r.lift));
  const scatterData = rules.map(r => ({
    x: +(r.support * 100).toFixed(3),
    y: +(r.confidence * 100).toFixed(1),
    lift: r.lift,
    ant: r.antecedents,
    con: r.consequents,
  }));

  /* Color gradient by lift */
  const colors = scatterData.map(p => {
    const t = p.lift / maxLift;
    const r = Math.round(245 - (245-128)*t);
    const g = Math.round(230 - 230*t);
    const b = Math.round(230 - 230*t);
    return `rgba(${r},${g},${b},0.85)`;
  });

  createChart('chartBasketScatter', {
    type: 'bubble',
    data: { datasets: [{ label: 'Association Rule',
      data: scatterData.map((p,i) => ({x:p.x,y:p.y,r:Math.max(5,p.lift/maxLift*18)})),
      backgroundColor: colors, borderColor: colors.map(c=>c.replace('0.85','1')), borderWidth:1 }]},
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {
        legend:{display:false},
        tooltip:{...tip(), callbacks:{
          title: ctx => {
            const d=scatterData[ctx[0].dataIndex];
            return `${d.ant} → ${d.con}`;
          },
          label: ctx => {
            const d=scatterData[ctx[0].dataIndex];
            return [`  Support: ${d.x.toFixed(2)}%`, `  Confidence: ${d.y.toFixed(1)}%`, `  Lift: ${d.lift.toFixed(2)}`];
          }
        }}
      },
      scales:{
        x:{...axX({title:{display:true,text:'Support (%)',font:{size:11}}}), ticks:{callback:v=>v+'%'}},
        y:{...axY({title:{display:true,text:'Confidence (%)',font:{size:11}}}), ticks:{callback:v=>v+'%'}}
      }
    }
  });

  /* Stats */
  const statsEl = document.getElementById('basketStats');
  if (statsEl) {
    const mb = ext.market_basket;
    statsEl.innerHTML = [
      {label:'Total Rules', value: mb.total_rules},
      {label:'Avg Lift', value: mb.avg_lift.toFixed(2)},
      {label:'Max Lift', value: mb.max_lift.toFixed(2)},
      {label:'Avg Confidence', value: (mb.avg_confidence*100).toFixed(1)+'%'},
    ].map(s=>`<div class="stat-card"><p class="stat-card__label">${s.label}</p><p class="stat-card__value">${s.value}</p></div>`).join('');
  }

  /* Table */
  const tableData = rules.map((r,i) => ({
    rank: i+1,
    antecedents: r.antecedents,
    consequents: r.consequents,
    support: r.support,
    confidence: r.confidence,
    lift: r.lift,
  }));
  renderSortableTable('tableBasket', [
    {id:'rank', label:'#', align:'right'},
    {id:'antecedents', label:'Antecedents', align:'left'},
    {id:'consequents', label:'Consequents', align:'left'},
    {id:'support', label:'Support', align:'right', render:v=>(v*100).toFixed(2)+'%'},
    {id:'confidence', label:'Confidence', align:'right', render:v=>(v*100).toFixed(1)+'%'},
    {id:'lift', label:'Lift', align:'right', render:v=>`<strong>${v.toFixed(2)}</strong>`},
  ], tableData, 'lift', false);
}

/* ==================================================================
   2. COHORT ANALYSIS
================================================================== */
export function renderCohort(ext) {
  const co = ext.cohort;
  const cohorts = co.cohort_detail;
  const monthKeys = Object.keys(cohorts[0].retention); // month_0 .. month_11

  /* Build heatmap HTML table */
  const heatEl = document.getElementById('cohortHeatmap');
  if (heatEl) {
    const maxVal = 100;
    let html = '<div class="heatmap-scroll"><table class="cohort-table"><thead><tr>';
    html += '<th>Cohort</th>';
    monthKeys.forEach(k => {
      const idx = k.replace('month_','');
      html += `<th>M+${idx}</th>`;
    });
    html += '</tr></thead><tbody>';
    cohorts.forEach(c => {
      html += `<tr><td class="cohort-label">${c.cohort}</td>`;
      monthKeys.forEach(k => {
        const v = c.retention[k];
        const bg = heatColor(v, maxVal);
        const t = v !== null ? Math.max(0,Math.min(1,v/maxVal)) : 0;
        const fg = textColorForBg(t);
        if (v === null) {
          html += `<td style="background:#f8f8f8;color:#ccc;">—</td>`;
        } else {
          html += `<td style="background:${bg};color:${fg};">${v.toFixed(1)}%</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    heatEl.innerHTML = html;
  }

  /* Line chart: avg retention */
  const avgRet = co.avg_retention;
  const avgLabels = Object.keys(avgRet).map(k => 'M+' + k.replace('month_',''));
  const avgVals   = Object.values(avgRet);

  createChart('chartCohortLine', {
    type: 'line',
    data: { labels: avgLabels, datasets: [{
      label: 'Avg Retention Rate',
      data: avgVals,
      borderColor: C_MAROON, backgroundColor:'rgba(128,0,0,0.07)',
      pointBackgroundColor: C_MAROON, pointRadius:4, pointHoverRadius:7,
      fill:true, tension:0.35, borderWidth:2.5
    }]},
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{...tip(), callbacks:{
          title: ctx => `Month Index: ${ctx[0].label}`,
          label: ctx => `  Avg Retention: ${ctx.parsed.y.toFixed(1)}%`
        }}
      },
      scales:{x:axX(), y:axY({min:0,max:105,ticks:{callback:v=>v+'%'}})}
    }
  });
}

/* ==================================================================
   3. CHURN RISK SCORING
================================================================== */
export function renderChurnRisk(ext) {
  const ch = ext.churn;
  const segments = Object.keys(ch.summary);
  const counts   = segments.map(s => ch.summary[s].count);
  const revenues = segments.map(s => ch.summary[s].total_revenue);
  // Monochromatic red palette (Low -> Medium -> High Risk)
  const colors   = ['#e0a0a0', '#b52c2c', '#800000'];

  /* Stats row */
  const statsEl = document.getElementById('churnStats');
  if (statsEl) {
    const totalCustomers = counts.reduce((a,b)=>a+b,0);
    const highRisk = ch.summary['High Risk'];
    statsEl.innerHTML = [
      {label:'Total Customers', value: fmtNum(totalCustomers)},
      {label:'High Risk Count', value: fmtNum(highRisk.count)},
      {label:'High Risk %', value: (highRisk.count/totalCustomers*100).toFixed(1)+'%'},
      {label:'Avg High Risk Recency', value: highRisk.avg_recency.toFixed(0)+' days'},
    ].map(s=>`<div class="stat-card"><p class="stat-card__label">${s.label}</p><p class="stat-card__value">${s.value}</p></div>`).join('');
  }

  /* Bar: count */
  createChart('chartChurnCount', {
    type:'bar',
    data:{labels:segments, datasets:[{label:'Customers', data:counts,
      backgroundColor:colors, borderRadius:4, borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{...tip(),callbacks:{
        title:ctx=>ctx[0].label,
        label:ctx=>`  Customers: ${fmtNum(ctx.parsed.y)}`
      }}},
      scales:{x:axX(),y:axY({ticks:{callback:v=>fmtNum(v)}})}
    }
  });

  /* Bar: revenue */
  createChart('chartChurnRevenue', {
    type:'bar',
    data:{labels:segments, datasets:[{label:'Revenue (£)', data:revenues,
      backgroundColor:colors, borderRadius:4, borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{...tip(),callbacks:{
        title:ctx=>ctx[0].label,
        label:ctx=>`  Revenue: ${fmtCurrency(ctx.parsed.y)}`
      }}},
      scales:{x:axX(),y:axY({ticks:{callback:v=>fmtCurrency(v)}})}
    }
  });

  /* Table: top high risk */
  const tableData = ch.top_high_risk.map((r,i) => ({
    rank: i+1,
    customer_id: String(r.customer_id),
    recency: r.recency,
    frequency: r.frequency,
    monetary: r.monetary,
    churn_score: r.churn_score,
  }));
  renderSortableTable('tableChurn', [
    {id:'rank', label:'#', align:'right'},
    {id:'customer_id', label:'Customer ID', align:'left'},
    {id:'recency', label:'Recency (days)', align:'right'},
    {id:'frequency', label:'Frequency', align:'right'},
    {id:'monetary', label:'Monetary (£)', align:'right', render:v=>fmtCurrency(v)},
    {id:'churn_score', label:'Churn Score', align:'right',
     render:v=>`<span style="color:${v>=70?'#c0392b':v>=40?'#e67e22':'#27ae60'};font-weight:700;">${v.toFixed(1)}</span>`},
  ], tableData, 'churn_score', false);
}

/* ==================================================================
   4. REVENUE PARETO
================================================================== */
export function renderPareto(ext) {
  const p = ext.pareto;
  const curve = p.curve;
  const custPcts  = curve.map(c => c.customer_pct);
  const revPcts   = curve.map(c => c.revenue_pct);

  /* Pareto line chart */
  createChart('chartPareto', {
    type:'line',
    data:{labels: custPcts.map(v=>v.toFixed(1)+'%'), datasets:[
      {label:'Cumulative Revenue %', data:revPcts,
       borderColor:C_MAROON, backgroundColor:'rgba(128,0,0,0.08)',
       fill:true, tension:0.4, borderWidth:2.5,
       pointRadius:0, pointHoverRadius:5, pointBackgroundColor:C_MAROON},
      {label:'Diagonal (Equal Distribution)', data:custPcts.map((v,i)=>custPcts[custPcts.length-1]>0?(v/custPcts[custPcts.length-1]*100):0),
       borderColor:'#aaaaaa', borderDash:[6,4], borderWidth:1.5,
       pointRadius:0, fill:false}
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{position:'bottom'},
        annotation:{annotations:{
          line80:{type:'line',scaleID:'y',value:80,borderColor:'#c0392b',borderWidth:1.5,borderDash:[6,4],
            label:{display:true,content:`80% Revenue = ${p.pct_customer_for_80pct_revenue.toFixed(1)}% Customers`,
              backgroundColor:'#800000',color:'#fff',font:{size:11},position:'center',yAdjust:-14}},
        }},
        tooltip:{...tip(),mode:'index',intersect:false,callbacks:{
          title:ctx=>`Top ${ctx[0].label} Customers`,
          label:ctx=>ctx.datasetIndex===0?`  Cumulative Revenue: ${ctx.parsed.y.toFixed(1)}%`:null
        }}
      },
      scales:{
        x:{...axX({ticks:{maxTicksLimit:10}}), title:{display:true,text:'Cumulative % of Customers',font:{size:11}}},
        y:{...axY({min:0,max:100,ticks:{callback:v=>v+'%'}}), title:{display:true,text:'Cumulative % of Revenue',font:{size:11}}}
      }
    }
  });

  /* Bar: top 20 customers */
  const top20 = p.top20_customers.slice(0,20);
  createChart('chartParetoTop20', {
    type:'bar',
    data:{labels:top20.map(c=>'#'+c.customer_id), datasets:[{
      label:'Revenue (£)', data:top20.map(c=>c.revenue),
      backgroundColor:C_MAROON, borderRadius:4, borderSkipped:false
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{...tip(),callbacks:{
        title:ctx=>`Customer ${ctx[0].label}`,
        label:ctx=>`  Revenue: ${fmtCurrency(ctx.parsed.y)}`
      }}},
      scales:{
        x:{...axX({ticks:{font:{size:10},maxRotation:45}})},
        y:{...axY({ticks:{callback:v=>fmtCurrency(v)}})}
      }
    }
  });

  /* Table */
  const tableData = top20.map((c,i) => ({
    rank: i+1,
    customer_id: String(c.customer_id),
    revenue: c.revenue,
    cum_pct: c.cum_pct,
  }));
  renderSortableTable('tablePareto', [
    {id:'rank', label:'Rank', align:'right'},
    {id:'customer_id', label:'Customer ID', align:'left'},
    {id:'revenue', label:'Revenue (£)', align:'right', render:v=>fmtCurrency(v)},
    {id:'cum_pct', label:'Cumulative Revenue %', align:'right', render:v=>v.toFixed(2)+'%'},
  ], tableData, 'revenue', false);
}

/* ==================================================================
   5. PRODUCT TREND HEATMAP
================================================================== */
export function renderProductTrend(ext) {
  const ph = ext.product_heatmap;
  const months = ph.months;
  const cats   = ph.categories;

  function buildHeatmapHTML(containerId, key, label) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const allVals = cats.flatMap(c => months.map(m => c.monthly[m]?.[key] ?? 0));
    const maxVal  = Math.max(...allVals);

    let html = '<div class="heatmap-scroll"><table class="cohort-table"><thead><tr>';
    html += `<th>${label}</th>`;
    months.forEach(m => { html += `<th>${m.replace('20','').replace('-','/')}</th>`; });
    html += '<th>Type</th></tr></thead><tbody>';

    cats.forEach(c => {
      html += `<tr><td class="cohort-label" style="min-width:90px">${c.category}</td>`;
      months.forEach(m => {
        const v = c.monthly[m]?.[key] ?? null;
        const bg = heatColor(v, maxVal);
        const t  = v !== null ? Math.max(0,Math.min(1,v/maxVal)) : 0;
        const fg = textColorForBg(t);
        const disp = key==='quantity' ? (v!=null?fmtNum(v):'—') : (v!=null?v.toFixed(0)+'%':'—');
        html += `<td style="background:${bg};color:${fg};white-space:nowrap;">${disp}</td>`;
      });
      const typeBg = c.type==='Seasonal' ? '#c0392b' : '#27ae60';
      html += `<td><span style="background:${typeBg};color:#fff;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;">${c.type}</span></td>`;
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  buildHeatmapHTML('heatAbsolute', 'quantity', 'Category');
  buildHeatmapHTML('heatRelative', 'relative', 'Category');
}

/* ==================================================================
   6. SALES FUNNEL
================================================================== */
export function renderSalesFunnel(ext) {
  const stages = ext.funnel.stages;
  const maxVal = stages[0].value;

  const el = document.getElementById('funnelContainer');
  if (!el) return;

  const palette = ['#800000','#9b1b1b','#b52c2c','#c0392b','#cc5555'];
  
  const SVG_W = 1000;
  const SVG_H = 480;
  const N = stages.length;
  const H = SVG_H / N;

  let paths = '';
  let labels = '';

  // Prevent funnel from becoming too narrow at the bottom
  const minW = SVG_W * 0.40; 
  const rangeW = SVG_W - minW;

  stages.forEach((s, i) => {
    const topW = minW + ((s.value / maxVal) * rangeW);
    // Taper the very last stage slightly so it looks like a funnel end
    const nextVal = stages[i+1] ? stages[i+1].value : (s.value * 0.90);
    const botW = minW + ((nextVal / maxVal) * rangeW);

    const L_top = (SVG_W - topW) / 2;
    const R_top = L_top + topW;
    const L_bot = (SVG_W - botW) / 2;
    const R_bot = L_bot + botW;

    const Y_top = i * H;
    const Y_bot = (i + 1) * H;
    
    // Smooth bezier curve for trumpet shape (0.4 curvature prevents excessive bulging)
    const path = `M ${L_top} ${Y_top} 
                  C ${L_top} ${Y_top + H*0.4}, ${L_bot} ${Y_bot - H*0.4}, ${L_bot} ${Y_bot}
                  L ${R_bot} ${Y_bot}
                  C ${R_bot} ${Y_bot - H*0.4}, ${R_top} ${Y_top + H*0.4}, ${R_top} ${Y_top}
                  Z`;
                  
    paths += `<path d="${path}" fill="${palette[i] || '#edc8c8'}" stroke="#ffffff" stroke-width="3"/>`;

    // Labels overlay
    labels += `
      <div class="trumpet-label-container" style="top:${(i / N) * 100}%; height:${100 / N}%;">
        <span class="trumpet-label-stage">${s.stage}</span>
        <span class="trumpet-label-value">${fmtNum(s.value)}</span>
        ${i > 0 ? `<span class="trumpet-label-conv">&darr; ${(s.conv_from_prev || 0).toFixed(1)}% conversion</span>` : ''}
      </div>
    `;
  });

  el.innerHTML = `
    <div class="trumpet-funnel-wrapper">
      <svg viewBox="0 0 ${SVG_W} ${SVG_H}" preserveAspectRatio="none" class="trumpet-funnel-svg" aria-label="Sales Funnel Chart">
        ${paths}
      </svg>
      <div class="trumpet-funnel-labels">
        ${labels}
      </div>
    </div>
  `;

  /* Bar chart also */
  createChart('chartFunnelBar', {
    type:'bar',
    data:{labels:stages.map(s=>s.stage), datasets:[{
      label:'Count', data:stages.map(s=>s.value),
      backgroundColor:palette, borderRadius:4, borderSkipped:false
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{...tip(),callbacks:{
        title:ctx=>ctx[0].label,
        label:ctx=>{
          const s=stages[ctx.dataIndex];
          const lines=[`  Count: ${fmtNum(ctx.parsed.y)}`];
          if(s.conv_from_prev<100) lines.push(`  Conversion: ${(s.conv_from_prev || 0).toFixed(1)}%`);
          return lines;
        }
      }}},
      scales:{x:{...axX({ticks:{font:{size:10}}})},y:{...axY({ticks:{callback:v=>fmtNum(v)}})}}
    }
  });
}

/* ==================================================================
   7. CLV ANALYSIS
================================================================== */
export function renderClv(ext) {
  const clv = ext.clv;
  const segs = clv.segments;
  const labels = segs.map(s=>s.segment);
  const avgClvs = segs.map(s=>s.avg_clv);
  const counts  = segs.map(s=>s.count);

  /* Bar: avg CLV per segment */
  createChart('chartClvBar', {
    type:'bar',
    data:{labels, datasets:[{
      label:'Avg CLV (£)', data:avgClvs,
      backgroundColor:PALETTE.slice(0,4), borderRadius:4, borderSkipped:false
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{...tip(),callbacks:{
        title:ctx=>`Segment: ${ctx[0].label}`,
        label:ctx=>{
          const s=segs[ctx.dataIndex];
          return[`  Avg CLV: ${fmtCurrency(ctx.parsed.y)}`,`  Customers: ${fmtNum(s.count)}`,`  Total CLV: ${fmtCurrency(s.total_clv)}`];
        }
      }}},
      scales:{x:axX(),y:{...axY({ticks:{callback:v=>fmtCurrency(v)}})}}
    }
  });

  /* Bar: customer count */
  createChart('chartClvCount', {
    type:'bar',
    data:{labels, datasets:[{
      label:'Customers', data:counts,
      backgroundColor:PALETTE.slice(0,4).map(c=>c+'cc'), borderRadius:4, borderSkipped:false
    }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{...tip(),callbacks:{
        title:ctx=>`Segment: ${ctx[0].label}`,
        label:ctx=>`  Customers: ${fmtNum(ctx.parsed.y)}`
      }}},
      scales:{x:axX(),y:{...axY({ticks:{callback:v=>fmtNum(v)}})}}
    }
  });

  /* Model metrics card */
  const mp = clv.model_performance;
  const metricsEl = document.getElementById('clvMetrics');
  if (metricsEl) {
    metricsEl.innerHTML = `
      <div class="clv-metrics-card">
        <div class="metric-badge">
          <span class="metric-badge__label">MAE</span>
          <span class="metric-badge__value">${fmtCurrency(mp.mae)}</span>
        </div>
        <div class="metric-badge">
          <span class="metric-badge__label">MAPE</span>
          <span class="metric-badge__value">${mp.mape.toFixed(2)}%</span>
        </div>
        <div class="metric-badge">
          <span class="metric-badge__label">R&sup2;</span>
          <span class="metric-badge__value">${mp.r2.toFixed(4)}</span>
        </div>
      </div>`;
  }

  /* Table */
  const tableData = segs.map(s => ({
    segment: s.segment, count: s.count, avg_clv: s.avg_clv,
    total_clv: s.total_clv, avg_freq: s.avg_frequency, avg_recency: s.avg_recency
  }));
  renderSortableTable('tableClv', [
    {id:'segment', label:'Segment', align:'left'},
    {id:'count', label:'Customers', align:'right', render:v=>fmtNum(v)},
    {id:'avg_clv', label:'Avg CLV (£)', align:'right', render:v=>fmtCurrency(v)},
    {id:'total_clv', label:'Total CLV (£)', align:'right', render:v=>fmtCurrency(v)},
    {id:'avg_freq', label:'Avg Frequency', align:'right', render:v=>v.toFixed(2)+'x'},
    {id:'avg_recency', label:'Avg Recency (days)', align:'right', render:v=>v.toFixed(0)},
  ], tableData, 'avg_clv', false);
}
