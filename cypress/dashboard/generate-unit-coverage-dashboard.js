#!/usr/bin/env node
/**
 * generate-coverage-dashboard.js
 * Run after: npx jest --coverage --coverageReporters=json
 * Reads: coverage/coverage-summary.json
 * Outputs: cypress/dashboard/coverage-report/index.html
 */

const fs   = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const COVERAGE_FILE  = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const OUTPUT_DIR     = path.join(__dirname, 'coverage-report');
const OUTPUT_FILE    = path.join(OUTPUT_DIR, 'index.html');

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error('ERROR: coverage/coverage-summary.json not found.');
  console.error('Run: npx jest --coverage --coverageReporters=json');
  process.exit(1);
}

const raw     = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
const total   = raw.total;

// ── Parse per-file data ───────────────────────────────────────────────────────
const files = Object.entries(raw)
  .filter(([k]) => k !== 'total')
  .map(([filePath, d]) => {
    // Normalize path separators and strip cwd prefix
    const rel = filePath
      .replace(/\\/g, '/')
      .replace(process.cwd().replace(/\\/g, '/') + '/', '');

    // Derive a friendly module name from the path
    const parts   = rel.split('/');
    const fileName = parts[parts.length - 1];

    // Find feature folder (e.g. "Jogging", "JobControl", "DRO")
    const featureIdx = parts.findIndex(p => p === 'features');
    const module = featureIdx >= 0 && parts[featureIdx + 1]
      ? parts[featureIdx + 1]
      : parts.includes('components') ? 'components'
      : parts.includes('lib') ? 'lib'
      : parts.includes('store') ? 'store'
      : parts.includes('hooks') ? 'hooks'
      : 'other';

    return {
      filePath: rel,
      fileName,
      module,
      stmts:    d.statements.pct,
      branch:   d.branches.pct,
      funcs:    d.functions.pct,
      lines:    d.lines.pct,
      stmtsCovered:  d.statements.covered,
      stmtsTotal:    d.statements.total,
      branchCovered: d.branches.covered,
      branchTotal:   d.branches.total,
      funcsCovered:  d.functions.covered,
      funcsTotal:    d.functions.total,
      linesCovered:  d.lines.covered,
      linesTotal:    d.lines.total,
    };
  })
  .sort((a, b) => a.stmts - b.stmts); // lowest coverage first

// ── Group by module ───────────────────────────────────────────────────────────
const moduleMap = {};
files.forEach(f => {
  if (!moduleMap[f.module]) moduleMap[f.module] = [];
  moduleMap[f.module].push(f);
});

const modules = Object.entries(moduleMap).map(([name, mFiles]) => {
  const avg = arr => arr.length ? Math.round(arr.reduce((s,v) => s+v, 0) / arr.length) : 0;
  return {
    name,
    files: mFiles,
    stmts:  avg(mFiles.map(f => f.stmts)),
    branch: avg(mFiles.map(f => f.branch)),
    funcs:  avg(mFiles.map(f => f.funcs)),
    lines:  avg(mFiles.map(f => f.lines)),
    count:  mFiles.length,
  };
}).sort((a, b) => b.count - a.count);

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' });

function grade(pct) {
  if (pct >= 90) return { label:'Excellent', color:'#4ade80' };
  if (pct >= 75) return { label:'Good',      color:'#a3e635' };
  if (pct >= 50) return { label:'Fair',       color:'#f97316' };
  return               { label:'Low',         color:'#ef4444' };
}

function bar(pct, color) {
  return `<div class="bar-wrap"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

function pctBadge(pct) {
  const g = grade(pct);
  return `<span class="pct-badge" style="color:${g.color};border-color:${g.color}20;background:${g.color}12">${pct}%</span>`;
}

function metricCell(covered, total, pct) {
  const g = grade(pct);
  return `<td class="metric-cell">
    <span class="metric-pct" style="color:${g.color}">${pct}%</span>
    <span class="metric-sub">${covered}/${total}</span>
  </td>`;
}

// ── Build file table rows ─────────────────────────────────────────────────────
function buildFileRows(mFiles) {
  return mFiles.map(f => {
    const g = grade(f.stmts);
    const icon = f.stmts >= 90 ? '✔' : f.stmts >= 50 ? '◑' : '✘';
    const iconClass = f.stmts >= 90 ? 'ic-pass' : f.stmts >= 50 ? 'ic-mid' : 'ic-fail';
    return `<tr class="file-row">
      <td class="file-name-cell">
        <span class="${iconClass}">${icon}</span>
        <span class="file-name" title="${f.filePath}">${f.fileName}</span>
        <span class="file-path">${f.filePath.replace(f.fileName, '')}</span>
      </td>
      ${metricCell(f.stmtsCovered, f.stmtsTotal, f.stmts)}
      ${metricCell(f.branchCovered, f.branchTotal, f.branch)}
      ${metricCell(f.funcsCovered, f.funcsTotal, f.funcs)}
      ${metricCell(f.linesCovered, f.linesTotal, f.lines)}
      <td class="bar-cell">${bar(f.stmts, g.color)}</td>
    </tr>`;
  }).join('');
}

// ── Build module cards ────────────────────────────────────────────────────────
function buildModuleCards() {
  return modules.map(m => {
    const g = grade(m.stmts);
    return `
    <div class="mod-card">
      <div class="mod-header" style="border-left:3px solid ${g.color}">
        <div>
          <div class="mod-name">${m.name}</div>
          <div class="mod-sub">${m.count} file${m.count !== 1 ? 's' : ''}</div>
        </div>
        <div class="mod-pct" style="color:${g.color}">${m.stmts}%</div>
      </div>
      <div class="mod-metrics">
        <div class="mod-metric"><span class="mm-label">Stmts</span>${pctBadge(m.stmts)}</div>
        <div class="mod-metric"><span class="mm-label">Branch</span>${pctBadge(m.branch)}</div>
        <div class="mod-metric"><span class="mm-label">Funcs</span>${pctBadge(m.funcs)}</div>
        <div class="mod-metric"><span class="mm-label">Lines</span>${pctBadge(m.lines)}</div>
      </div>
      <div class="mod-bar-wrap">
        <div class="mod-bar-fill" style="width:${m.stmts}%;background:${g.color}"></div>
      </div>
      <details class="mod-details">
        <summary class="mod-summary">View ${m.count} file${m.count !== 1 ? 's' : ''} ▾</summary>
        <table class="file-table mod-file-table">
          <thead><tr>
            <th class="th-file">File</th>
            <th>Stmts</th><th>Branch</th><th>Funcs</th><th>Lines</th>
            <th class="th-bar">Coverage</th>
          </tr></thead>
          <tbody>${buildFileRows(m.files)}</tbody>
        </table>
      </details>
    </div>`;
  }).join('');
}

// ── Build summary donut data ──────────────────────────────────────────────────
function buildSummaryScript() {
  const metrics = [
    { label: 'Statements', pct: total.statements.pct, covered: total.statements.covered, tot: total.statements.total, color: '#4ade80' },
    { label: 'Branches',   pct: total.branches.pct,   covered: total.branches.covered,   tot: total.branches.total,   color: '#60a5fa' },
    { label: 'Functions',  pct: total.functions.pct,  covered: total.functions.covered,  tot: total.functions.total,  color: '#a78bfa' },
    { label: 'Lines',      pct: total.lines.pct,      covered: total.lines.covered,      tot: total.lines.total,      color: '#f97316' },
  ];
  return `
  <script>
  (function(){
    const metrics = ${JSON.stringify(metrics)};
    metrics.forEach((m, i) => {
      const canvas = document.getElementById('donut_' + i);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const cx = 60, cy = 60, r = 50, ri = 32;
      const pct = m.pct / 100;
      // background arc
      ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
      ctx.fillStyle = '#1a1e2a'; ctx.fill();
      // filled arc
      const start = -Math.PI/2;
      const end   = start + pct * 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end);
      ctx.closePath(); ctx.fillStyle = m.color; ctx.fill();
      // inner hole
      ctx.beginPath(); ctx.arc(cx,cy,ri,0,2*Math.PI);
      ctx.fillStyle = '#13161e'; ctx.fill();
      // text
      ctx.fillStyle = '#e8eaf0'; ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.pct + '%', cx, cy - 6);
      ctx.fillStyle = '#6b7280'; ctx.font = '9px monospace';
      ctx.fillText(m.covered + '/' + m.tot, cx, cy + 10);
    });
  })();
  </script>`;
}

function buildDonutCards() {
  const metrics = [
    { label: 'Statements', color: '#4ade80', id: 0 },
    { label: 'Branches',   color: '#60a5fa', id: 1 },
    { label: 'Functions',  color: '#a78bfa', id: 2 },
    { label: 'Lines',      color: '#f97316', id: 3 },
  ];
  return metrics.map(m => `
    <div class="donut-card">
      <canvas id="donut_${m.id}" width="120" height="120"></canvas>
      <div class="donut-label" style="color:${m.color}">${m.label}</div>
    </div>`).join('');
}

// ── Full HTML ─────────────────────────────────────────────────────────────────
const overallGrade = grade(total.statements.pct);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Unit Test Coverage Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap" rel="stylesheet"/>
<style>
:root{
  --bg:#0d0f14;--s:#13161e;--s2:#1a1e2a;--bd:#252a38;
  --tx:#e8eaf0;--mu:#6b7280;--ac:#4ade80;
  --pass:#4ade80;--fail:#ef4444;--mid:#f97316;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;padding:36px;min-height:100vh;}

/* Header */
.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid var(--bd);}
.pl{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ac);margin-bottom:6px;}
.pn{font-size:38px;font-weight:700;letter-spacing:-1px;}
.ps{font-size:13px;color:var(--mu);margin-top:6px;}
.hr2{text-align:right;}
.rd,.rv{font-family:'Space Mono',monospace;font-size:10px;color:var(--mu);margin-top:4px;}
.grade-badge{display:inline-block;margin-top:10px;padding:6px 16px;border-radius:6px;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1px;}
.pbtn{display:inline-block;margin-top:8px;margin-left:8px;padding:6px 16px;background:var(--ac);color:#000;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;border:none;border-radius:6px;cursor:pointer;}

/* Section */
.sec-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--bd);}
.sec-wrap{margin-bottom:40px;}

/* Donut cards */
.donut-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
.donut-card{background:var(--s);border:1px solid var(--bd);border-radius:12px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:10px;}
.donut-label{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1px;}

/* Summary stats row */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
.stat-card{background:var(--s);border:1px solid var(--bd);border-radius:10px;padding:18px 20px;position:relative;overflow:hidden;}
.stat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
.stat-card.sc-stmts::after{background:#4ade80;}
.stat-card.sc-branch::after{background:#60a5fa;}
.stat-card.sc-funcs::after{background:#a78bfa;}
.stat-card.sc-lines::after{background:#f97316;}
.stat-label{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:8px;}
.stat-val{font-size:32px;font-weight:700;line-height:1;}
.stat-sub{font-size:11px;color:var(--mu);margin-top:4px;font-family:'Space Mono',monospace;}

/* Overall bar */
.overall-bar-wrap{background:var(--s);border:1px solid var(--bd);border-radius:10px;padding:20px 24px;margin-bottom:28px;}
.ob-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:14px;}
.ob-row{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
.ob-row:last-child{margin-bottom:0;}
.ob-name{font-size:12px;font-weight:600;min-width:80px;color:var(--tx);}
.ob-bar{flex:1;height:8px;background:var(--s2);border-radius:99px;overflow:hidden;border:1px solid var(--bd);}
.ob-fill{height:100%;border-radius:99px;}
.ob-pct{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;min-width:42px;text-align:right;}

/* Module grid */
.mod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
.mod-card{background:var(--s);border:1px solid var(--bd);border-radius:10px;overflow:hidden;}
.mod-header{padding:16px 20px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;}
.mod-name{font-size:15px;font-weight:700;}
.mod-sub{font-size:11px;color:var(--mu);margin-top:2px;}
.mod-pct{font-family:'Space Mono',monospace;font-size:20px;font-weight:700;}
.mod-metrics{display:flex;gap:0;padding:10px 20px;border-bottom:1px solid var(--bd);}
.mod-metric{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
.mm-label{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--mu);}
.pct-badge{font-family:'Space Mono',monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;border:1px solid;}
.mod-bar-wrap{height:4px;background:var(--s2);}
.mod-bar-fill{height:100%;}

/* Details / file table */
.mod-details{padding:0;}
.mod-summary{padding:10px 20px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--mu);cursor:pointer;list-style:none;border-top:1px solid var(--bd);}
.mod-summary:hover{color:var(--tx);background:var(--s2);}
.file-table{width:100%;border-collapse:collapse;font-size:12px;}
.mod-file-table{font-size:11px;}
.file-table th{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:var(--mu);padding:8px 12px;text-align:left;border-bottom:1px solid var(--bd);background:var(--s2);}
.th-bar{width:120px;}
.th-file{width:40%;}
.file-row td{padding:8px 12px;border-bottom:1px solid var(--bd);}
.file-row:last-child td{border-bottom:none;}
.file-row:hover td{background:var(--s2);}
.file-name-cell{display:flex;align-items:center;gap:8px;}
.file-name{font-weight:600;color:var(--tx);}
.file-path{color:var(--mu);font-size:10px;font-family:'Space Mono',monospace;}
.ic-pass{color:var(--pass);font-size:11px;}
.ic-mid{color:var(--mid);font-size:11px;}
.ic-fail{color:var(--fail);font-size:11px;}
.metric-cell{text-align:center;vertical-align:middle;}
.metric-pct{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;display:block;}
.metric-sub{font-family:'Space Mono',monospace;font-size:9px;color:var(--mu);display:block;}
.bar-cell{width:100px;vertical-align:middle;}
.bar-wrap{height:6px;background:var(--s2);border-radius:99px;overflow:hidden;}
.bar-fill{height:100%;border-radius:99px;transition:width 0.3s;}

/* All files table */
.all-files-wrap{background:var(--s);border:1px solid var(--bd);border-radius:10px;overflow:hidden;margin-bottom:28px;}
.all-files-header{padding:14px 20px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;}
.aff-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);}
.aff-count{font-family:'Space Mono',monospace;font-size:10px;color:var(--mu);}

/* Footer */
.ft{border-top:1px solid var(--bd);padding-top:20px;display:flex;justify-content:space-between;align-items:center;margin-top:32px;}
.fl{font-family:'Space Mono',monospace;font-size:9px;color:var(--mu);letter-spacing:1px;}
.lg{display:flex;gap:16px;}
.li{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mu);}
.ld{width:8px;height:8px;border-radius:2px;}

@media print{
  body{background:#fff!important;color:#111!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .pbtn{display:none!important;}
  :root{--bg:#fff;--s:#f8f9fa;--s2:#f0f1f3;--bd:#e0e0e0;--tx:#111;--mu:#666;}
  .mod-card,.all-files-wrap{break-inside:avoid;}
}
</style>
</head>
<body>

<!-- Header -->
<div class="hd">
  <div>
    <div class="pl">Unit Test Coverage</div>
    <div class="pn">gSender</div>
    <div class="ps">Jest &nbsp;·&nbsp; ${files.length} files analysed &nbsp;·&nbsp; ${modules.length} modules</div>
  </div>
  <div class="hr2">
    <div class="rd">Generated: ${today}</div>
    <div class="rv">Overall: ${total.statements.pct}% statements &nbsp;·&nbsp; ${total.branches.pct}% branches</div>
    <span class="grade-badge" style="background:${overallGrade.color}18;color:${overallGrade.color};border:1px solid ${overallGrade.color}30">${overallGrade.label}</span>
    <button class="pbtn" onclick="window.print()">Export PDF</button>
  </div>
</div>

<!-- 01 Summary donuts -->
<div class="sec-wrap">
  <div class="sec-title">01 &nbsp;— Overall Coverage</div>
  <div class="donut-grid">${buildDonutCards()}</div>

  <!-- 4 metric stat cards -->
  <div class="stats-row">
    <div class="stat-card sc-stmts">
      <div class="stat-label">Statements</div>
      <div class="stat-val" style="color:#4ade80">${total.statements.pct}%</div>
      <div class="stat-sub">${total.statements.covered} / ${total.statements.total} covered</div>
    </div>
    <div class="stat-card sc-branch">
      <div class="stat-label">Branches</div>
      <div class="stat-val" style="color:#60a5fa">${total.branches.pct}%</div>
      <div class="stat-sub">${total.branches.covered} / ${total.branches.total} covered</div>
    </div>
    <div class="stat-card sc-funcs">
      <div class="stat-label">Functions</div>
      <div class="stat-val" style="color:#a78bfa">${total.functions.pct}%</div>
      <div class="stat-sub">${total.functions.covered} / ${total.functions.total} covered</div>
    </div>
    <div class="stat-card sc-lines">
      <div class="stat-label">Lines</div>
      <div class="stat-val" style="color:#f97316">${total.lines.pct}%</div>
      <div class="stat-sub">${total.lines.covered} / ${total.lines.total} covered</div>
    </div>
  </div>

  <!-- Overall bars -->
  <div class="overall-bar-wrap">
    <div class="ob-title">Coverage Breakdown</div>
    ${[
      { name:'Statements', pct: total.statements.pct, color:'#4ade80' },
      { name:'Branches',   pct: total.branches.pct,   color:'#60a5fa' },
      { name:'Functions',  pct: total.functions.pct,  color:'#a78bfa' },
      { name:'Lines',      pct: total.lines.pct,      color:'#f97316' },
    ].map(m => `
    <div class="ob-row">
      <span class="ob-name">${m.name}</span>
      <div class="ob-bar"><div class="ob-fill" style="width:${m.pct}%;background:${m.color}"></div></div>
      <span class="ob-pct" style="color:${m.color}">${m.pct}%</span>
    </div>`).join('')}
  </div>
</div>

<!-- 02 Module breakdown -->
<div class="sec-wrap">
  <div class="sec-title">02 &nbsp;— Coverage by Module</div>
  <div class="mod-grid">${buildModuleCards()}</div>
</div>

<!-- 03 All files table -->
<div class="sec-wrap">
  <div class="sec-title">03 &nbsp;— All Files</div>
  <div class="all-files-wrap">
    <div class="all-files-header">
      <span class="aff-title">File Coverage</span>
      <span class="aff-count">${files.length} files</span>
    </div>
    <table class="file-table">
      <thead><tr>
        <th class="th-file">File</th>
        <th>Stmts</th><th>Branch</th><th>Funcs</th><th>Lines</th>
        <th class="th-bar">Coverage</th>
      </tr></thead>
      <tbody>${buildFileRows(files)}</tbody>
    </table>
  </div>
</div>

<!-- Footer -->
<div class="ft">
  <div class="fl">gSender &nbsp;·&nbsp; Jest Unit Coverage &nbsp;·&nbsp; ${today}</div>
  <div class="lg">
    <div class="li"><div class="ld" style="background:#4ade80"></div> ≥90% Excellent</div>
    <div class="li"><div class="ld" style="background:#a3e635"></div> ≥75% Good</div>
    <div class="li"><div class="ld" style="background:#f97316"></div> ≥50% Fair</div>
    <div class="li"><div class="ld" style="background:#ef4444"></div> &lt;50% Low</div>
  </div>
</div>

${buildSummaryScript()}
</body>
</html>`;

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

console.log('\n   Coverage Dashboard generated!\n');
console.log('   Statements : ' + total.statements.pct + '% (' + total.statements.covered + '/' + total.statements.total + ')');
console.log('   Branches   : ' + total.branches.pct   + '% (' + total.branches.covered   + '/' + total.branches.total   + ')');
console.log('   Functions  : ' + total.functions.pct  + '% (' + total.functions.covered  + '/' + total.functions.total  + ')');
console.log('   Lines      : ' + total.lines.pct      + '% (' + total.lines.covered      + '/' + total.lines.total      + ')');
console.log('\n   Output: cypress/dashboard/coverage-report/index.html\n');
