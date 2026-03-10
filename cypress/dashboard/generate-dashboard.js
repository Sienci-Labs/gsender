const fs   = require('fs');
const path = require('path');

const DATA_FILE      = path.join(__dirname, 'dashboard-data.json');
const OUTPUT_DIR     = path.join(__dirname, 'report');
const OUTPUT_FILE    = path.join(OUTPUT_DIR, 'index.html');
const CYPRESS_REPORT = path.join(__dirname, '..', 'reports', 'mochawesome', 'index.json');

// ── Load coverage data ─────
if (!fs.existsSync(DATA_FILE)) {
  console.error('ERROR: dashboard-data.json not found');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ── Load Cypress test results ────
let cypress = null;
let cypressAvailable = false;

if (fs.existsSync(CYPRESS_REPORT)) {
  try {
    const raw   = JSON.parse(fs.readFileSync(CYPRESS_REPORT, 'utf8'));
    const stats = raw.stats || {};
    const failures = [];

    function walkSuites(suites, specFile) {
      if (!suites) return;
      suites.forEach(suite => {
        const name = specFile || suite.file || suite.title || 'Unknown Spec';
        if (suite.tests) {
          suite.tests.forEach(test => {
            if (test.fail || test.state === 'failed') {
              failures.push({
                spec:     path.basename(name),
                suite:    suite.title || '',
                test:     test.title  || 'Unnamed test',
                error:    (test.err && test.err.message) ? test.err.message : 'Unknown error',
                stack:    (test.err && test.err.estack)  ? test.err.estack.split('\n').slice(0,3).join('\n') : '',
                duration: test.duration || 0
              });
            }
          });
        }
        if (suite.suites) walkSuites(suite.suites, name);
      });
    }

    if (raw.results) raw.results.forEach(r => walkSuites(r.suites, r.file || r.fullFile));
    else if (raw.suites) walkSuites(raw.suites, raw.file);

    const bySpec = {};
    failures.forEach(f => { if (!bySpec[f.spec]) bySpec[f.spec] = []; bySpec[f.spec].push(f); });

    const duration = stats.duration ? Math.round(stats.duration / 1000) : 0;
    cypress = {
      date:     stats.end ? new Date(stats.end).toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' }) : 'Unknown',
      total:    stats.tests    || 0,
      passed:   stats.passes   || 0,
      failed:   stats.failures || 0,
      pending:  stats.pending  || 0,
      duration: Math.floor(duration/60) + 'm ' + (duration%60) + 's',
      passRate: stats.tests > 0 ? Math.round((stats.passes / stats.tests) * 100) : 0,
      failures, bySpec
    };
    cypressAvailable = true;
    console.log('Cypress report found: ' + cypress.total + ' tests, ' + cypress.failed + ' failures');
  } catch(e) {
    console.warn('Could not parse Cypress report:', e.message);
  }
} else {
  console.warn('No Cypress report at: ' + CYPRESS_REPORT);
  console.warn('Run tests first: npm run cy:run');
}

// ── Coverage calculations ──────────────────────────────────────────────────
function calc(mod) {
  const total   = mod.features.length;
  const created = mod.features.filter(f => f.status === 'created').length;
  return { total, created, pending: total - created, pct: total > 0 ? Math.round(created/total*100) : 0 };
}
const mods = data.modules.map(m => ({ ...m, ...calc(m) }));
const g    = mods.reduce((a,m) => ({ total: a.total+m.total, created: a.created+m.created }), { total:0, created:0 });
g.pending  = g.total - g.created;
g.pct      = g.total > 0 ? Math.round(g.created/g.total*100) : 0;

const colors = {
  green:  { bar:'#4ade80', pct:'#4ade80', bg:'rgba(74,222,128,0.12)',  bd:'rgba(74,222,128,0.25)'  },
  orange: { bar:'#f97316', pct:'#f97316', bg:'rgba(249,115,22,0.12)',  bd:'rgba(249,115,22,0.25)'  },
  blue:   { bar:'#60a5fa', pct:'#60a5fa', bg:'rgba(96,165,250,0.12)',  bd:'rgba(96,165,250,0.25)'  },
  purple: { bar:'#a78bfa', pct:'#a78bfa', bg:'rgba(167,139,250,0.12)', bd:'rgba(167,139,250,0.25)' },
};

function featureRows(features) {
  return features.map(f => {
    const yes = f.status === 'created';
    return '<div class="fr"><span class="fn">' + f.name + '</span>'
      + '<span class="fs ' + (yes?'fy':'fn2') + '">' + (yes?'Created':'Pending') + '</span></div>';
  }).join('');
}

function moduleCard(m) {
  const c = colors[m.color] || colors.green;
  return '<div class="mc">'
    + '<div class="mh" style="border-left:4px solid ' + c.bar + '">'
    + '<div><div class="mn">' + m.name + '</div><div class="mm">' + m.created + ' of ' + m.total + ' test cases created</div></div>'
    + '<div class="mb" style="color:' + c.pct + ';border-color:' + c.bd + ';background:' + c.bg + '">' + m.pct + '%</div>'
    + '</div>'
    + '<div class="mpr"><span class="plb">Coverage</span>'
    + '<div class="pb"><div class="pf" style="width:' + m.pct + '%;background:' + c.bar + '"></div></div>'
    + '<span class="pp" style="color:' + c.pct + '">' + m.pct + '%</span></div>'
    + '<div>' + featureRows(m.features) + '</div></div>';
}

function summaryRows() {
  return mods.map(m => {
    const c = colors[m.color] || colors.green;
    return '<div class="sr"><span class="sn">' + m.name + '</span>'
      + '<div class="sb"><div class="sf" style="width:' + m.pct + '%;background:' + c.bar + '"></div></div>'
      + '<span class="sc2">' + m.created + '/' + m.total + '</span>'
      + '<span class="sp" style="color:' + c.pct + '">' + m.pct + '%</span></div>';
  }).join('');
}

function buildTestResults() {
  if (!cypressAvailable) {
    return '<div class="no-results">'
      + '<div class="nr-icon"></div>'
      + '<div class="nr-title">No Test Results Available</div>'
      + '<div class="nr-sub">Run <code>npm run cy:run</code> then regenerate: <code>npm run dashboard:generate</code></div>'
      + '</div>';
  }

  const prColor = cypress.passRate >= 90 ? '#4ade80' : cypress.passRate >= 70 ? '#f97316' : '#ef4444';

  let html = '<div class="ts-grid">'
    + '<div class="ts-card"><div class="ts-label">Total Tests</div><div class="ts-val">' + cypress.total + '</div></div>'
    + '<div class="ts-card passed"><div class="ts-label">Passed</div><div class="ts-val tpass">' + cypress.passed + '</div></div>'
    + '<div class="ts-card failed"><div class="ts-label">Failed</div><div class="ts-val tfail">' + cypress.failed + '</div></div>'
    + '<div class="ts-card skip"><div class="ts-label">Skipped</div><div class="ts-val tskip">' + cypress.pending + '</div></div>'
    + '<div class="ts-card"><div class="ts-label">Duration</div><div class="ts-val tdur">' + cypress.duration + '</div></div>'
    + '<div class="ts-card"><div class="ts-label">Pass Rate</div><div class="ts-val" style="color:' + prColor + '">' + cypress.passRate + '%</div></div>'
    + '</div>';

  html += '<div class="pr-wrap">'
    + '<div class="pr-labels"><span>Pass Rate</span><span style="color:' + prColor + ';font-weight:700">' + cypress.passRate + '%</span></div>'
    + '<div class="pr-bg"><div class="pr-fill" style="width:' + cypress.passRate + '%;background:' + prColor + '"></div></div>'
    + '</div>';

  if (cypress.failed === 0) {
    html += '<div class="all-passed"><span></span> All ' + cypress.total + ' tests passed! No failures to report.</div>';
  } else {
    html += '<div class="fail-title">Full Failure Breakdown <span class="fail-count">' + cypress.failed + ' failure' + (cypress.failed!==1?'s':'') + '</span></div>';
    Object.keys(cypress.bySpec).forEach(spec => {
      const tests = cypress.bySpec[spec];
      html += '<div class="spec-block">'
        + '<div class="spec-header">'
        + '<span class="spec-icon">📄</span>'
        + '<span class="spec-name">' + spec + '</span>'
        + '<span class="spec-badge">' + tests.length + ' failure' + (tests.length!==1?'s':'') + '</span>'
        + '</div><div class="fail-table">';

      tests.forEach((t, i) => {
        html += '<div class="fail-row">'
          + '<div class="fail-num">' + (i+1) + '</div>'
          + '<div class="fail-detail">'
          + '<div class="fail-test">' + t.test + '</div>'
          + (t.suite ? '<div class="fail-suite">Suite: ' + t.suite + '</div>' : '')
          + '<div class="fail-error">' + t.error.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>'
          + (t.stack ? '<div class="fail-stack">' + t.stack.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>' : '')
          + '</div>'
          + '<div class="fail-dur">' + (t.duration ? (t.duration/1000).toFixed(1)+'s' : '-') + '</div>'
          + '</div>';
      });
      html += '</div></div>';
    });
  }
  return html;
}

// ── Build HTML ─────────
const today   = new Date().toLocaleDateString('en-CA', { year:'numeric', month:'long', day:'numeric' });
const lastRun = cypressAvailable ? cypress.date : 'No run yet';

const CSS = `
:root{--bg:#0d0f14;--s:#13161e;--s2:#1a1e2a;--bd:#252a38;--ac:#4ade80;--tx:#e8eaf0;--mu:#6b7280;--yes:#4ade80;--no:#9ca3af;--fail:#ef4444;--pass:#4ade80;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;padding:36px;}
.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid var(--bd);}
.pl{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--ac);margin-bottom:6px;}
.pn{font-size:38px;font-weight:700;letter-spacing:-1px;}
.ps{font-size:13px;color:var(--mu);margin-top:6px;}
.hr{text-align:right;}
.rd,.rv{font-family:'Space Mono',monospace;font-size:10px;color:var(--mu);margin-top:4px;}
.pbtn{display:inline-block;margin-top:12px;padding:8px 18px;background:var(--ac);color:#000;font-family:'Space Mono',monospace;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:6px;cursor:pointer;}
.sec-title{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--mu);margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--bd);}
.sec-wrap{margin-bottom:36px;}
.ss{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
.sc{background:var(--s);border:1px solid var(--bd);border-radius:10px;padding:20px;position:relative;overflow:hidden;}
.sc::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--ac);}
.sc.or::after{background:#f97316;}.sc.bl::after{background:#60a5fa;}
.sl{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:8px;}
.sv{font-size:32px;font-weight:700;line-height:1;}
.sv small{font-size:13px;font-weight:400;color:var(--mu);margin-left:2px;}
.ob{background:var(--s);border:1px solid var(--bd);border-radius:10px;padding:22px 26px;margin-bottom:24px;}
.bt{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:16px;}
.ow{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
.obg{flex:1;height:12px;background:var(--s2);border-radius:99px;overflow:hidden;border:1px solid var(--bd);}
.obf{height:100%;background:linear-gradient(90deg,#4ade80,#22d3ee);border-radius:99px;}
.op{font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:var(--ac);min-width:50px;text-align:right;}
.sr{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
.sr:last-child{margin-bottom:0;}
.sn{font-size:12px;font-weight:600;min-width:60px;color:var(--tx);}
.sb{flex:1;height:6px;background:var(--s2);border-radius:99px;overflow:hidden;}
.sf{height:100%;border-radius:99px;}
.sc2{font-family:'Space Mono',monospace;font-size:10px;color:var(--mu);min-width:44px;text-align:right;}
.sp{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;min-width:34px;text-align:right;}
.mg{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
.mc{background:var(--s);border:1px solid var(--bd);border-radius:10px;overflow:hidden;}
.mh{padding:16px 20px 12px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;}
.mn{font-size:16px;font-weight:700;}
.mm{font-size:11px;color:var(--mu);margin-top:2px;}
.mb{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;border:1px solid;}
.mpr{display:flex;align-items:center;gap:10px;padding:9px 20px;border-bottom:1px solid var(--bd);}
.plb{font-family:'Space Mono',monospace;font-size:9px;text-transform:uppercase;color:var(--mu);min-width:50px;}
.pb{flex:1;height:6px;background:var(--s2);border-radius:99px;overflow:hidden;}
.pf{height:100%;border-radius:99px;}
.pp{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;min-width:32px;text-align:right;}
.fr{display:flex;align-items:center;padding:7px 20px;border-bottom:1px solid var(--bd);transition:background 0.1s;}
.fr:last-child{border-bottom:none;}
.fr:hover{background:var(--s2);}
.fn{flex:1;font-size:12px;color:var(--tx);}
.fs{font-family:'Space Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1px;padding:3px 8px;border-radius:4px;text-transform:uppercase;}
.fy{background:rgba(74,222,128,0.12);color:var(--yes);border:1px solid rgba(74,222,128,0.25);}
.fn2{background:var(--s2);color:var(--no);border:1px solid var(--bd);}
.trb{background:var(--s);border:1px solid var(--bd);border-radius:10px;padding:24px 26px;}
.ts-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;}
.ts-card{background:var(--s2);border:1px solid var(--bd);border-radius:8px;padding:14px 16px;position:relative;overflow:hidden;}
.ts-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--mu);}
.ts-card.passed::after{background:var(--pass);}
.ts-card.failed::after{background:var(--fail);}
.ts-card.skip::after{background:#f97316;}
.ts-label{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--mu);margin-bottom:6px;}
.ts-val{font-size:24px;font-weight:700;line-height:1;}
.tpass{color:var(--pass);}.tfail{color:var(--fail);}.tskip{color:#f97316;}.tdur{font-size:18px;}
.pr-wrap{margin-bottom:22px;}
.pr-labels{display:flex;justify-content:space-between;font-size:12px;color:var(--mu);margin-bottom:8px;}
.pr-bg{height:10px;background:var(--s2);border-radius:99px;overflow:hidden;border:1px solid var(--bd);}
.pr-fill{height:100%;border-radius:99px;}
.no-results{text-align:center;padding:40px;color:var(--mu);}
.nr-icon{font-size:32px;margin-bottom:12px;}
.nr-title{font-size:16px;font-weight:600;color:var(--tx);margin-bottom:8px;}
.nr-sub{font-size:13px;}
.nr-sub code{background:var(--s2);padding:2px 8px;border-radius:4px;font-family:'Space Mono',monospace;font-size:11px;}
.all-passed{display:flex;align-items:center;gap:12px;padding:20px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:8px;font-size:14px;font-weight:600;color:var(--pass);}
.fail-title{font-size:14px;font-weight:700;color:var(--tx);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
.fail-count{font-family:'Space Mono',monospace;font-size:10px;background:rgba(239,68,68,0.15);color:var(--fail);border:1px solid rgba(239,68,68,0.3);padding:3px 10px;border-radius:99px;}
.spec-block{margin-bottom:14px;border:1px solid var(--bd);border-radius:8px;overflow:hidden;}
.spec-block:last-child{margin-bottom:0;}
.spec-header{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--s2);border-bottom:1px solid var(--bd);}
.spec-icon{font-size:14px;}
.spec-name{flex:1;font-family:'Space Mono',monospace;font-size:11px;color:var(--tx);font-weight:700;}
.spec-badge{font-family:'Space Mono',monospace;font-size:9px;background:rgba(239,68,68,0.15);color:var(--fail);border:1px solid rgba(239,68,68,0.3);padding:2px 8px;border-radius:99px;}
.fail-row{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--bd);}
.fail-row:last-child{border-bottom:none;}
.fail-row:hover{background:rgba(239,68,68,0.04);}
.fail-num{font-family:'Space Mono',monospace;font-size:10px;color:var(--fail);font-weight:700;min-width:20px;padding-top:2px;}
.fail-detail{flex:1;}
.fail-test{font-size:13px;font-weight:600;color:var(--tx);margin-bottom:4px;}
.fail-suite{font-size:11px;color:var(--mu);margin-bottom:4px;}
.fail-error{font-size:12px;color:#fca5a5;background:rgba(239,68,68,0.08);border-left:2px solid var(--fail);padding:6px 10px;border-radius:0 4px 4px 0;margin-bottom:4px;}
.fail-stack{font-family:'Space Mono',monospace;font-size:9px;color:var(--mu);white-space:pre;overflow-x:auto;padding:6px 8px;background:var(--s2);border-radius:4px;}
.fail-dur{font-family:'Space Mono',monospace;font-size:10px;color:var(--mu);min-width:36px;text-align:right;padding-top:2px;}
.ft{border-top:1px solid var(--bd);padding-top:20px;display:flex;justify-content:space-between;align-items:center;margin-top:32px;}
.fl{font-family:'Space Mono',monospace;font-size:9px;color:var(--mu);letter-spacing:1px;}
.lg{display:flex;gap:16px;}
.li{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mu);}
.ld{width:8px;height:8px;border-radius:2px;}
@media print{
  body{background:#fff!important;color:#111!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .pbtn{display:none!important;}
  :root{--bg:#fff;--s:#f8f9fa;--s2:#f0f1f3;--bd:#e0e0e0;--tx:#111;--mu:#666;--yes:#16a34a;--no:#666;--fail:#dc2626;--pass:#16a34a;}
  .mc,.spec-block{break-inside:avoid;}
}`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${data.project} - Test Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>${CSS}</style>
</head>
<body>

<div class="hd">
  <div>
    <div class="pl">Test Coverage Dashboard</div>
    <div class="pn">${data.project}</div>
    <div class="ps">${data.team} &nbsp;·&nbsp; Cypress E2E &nbsp;·&nbsp; ${data.modules.length} Modules</div>
  </div>
  <div class="hr">
    <div class="rd">Generated: ${today}</div>
    <div class="rv">v${data.version} &nbsp;·&nbsp; Last Run: ${lastRun}</div>
    <button class="pbtn" onclick="window.print()">Export PDF</button>
  </div>
</div>

<div class="sec-wrap">
  <div class="sec-title">01 &nbsp;— Feature Test Coverage</div>
  <div class="ss">
    <div class="sc"><div class="sl">Total Features</div><div class="sv">${g.total}</div></div>
    <div class="sc"><div class="sl">Tests Created</div><div class="sv">${g.created} <small>/ ${g.total}</small></div></div>
    <div class="sc or"><div class="sl">Tests Pending</div><div class="sv">${g.pending} <small>/ ${g.total}</small></div></div>
    <div class="sc bl"><div class="sl">Coverage</div><div class="sv">${g.pct}<small>%</small></div></div>
  </div>
  <div class="ob">
    <div class="bt">Coverage by Module</div>
    <div class="ow"><div class="obg"><div class="obf" style="width:${g.pct}%"></div></div><div class="op">${g.pct}%</div></div>
    ${summaryRows()}
  </div>
  <div class="mg">${mods.map(moduleCard).join('')}</div>
</div>

<div class="sec-wrap">
  <div class="sec-title">02 &nbsp;— Cypress Test Run Results</div>
  <div class="trb">${buildTestResults()}</div>
</div>

<div class="ft">
  <div class="fl">${data.project} &nbsp;·&nbsp; ${data.team} &nbsp;·&nbsp; ${today}</div>
  <div class="lg">
    <div class="li"><div class="ld" style="background:#4ade80"></div> Created</div>
    <div class="li"><div class="ld" style="background:#4b5563"></div> Pending</div>
    <div class="li"><div class="ld" style="background:#4ade80"></div> Passed</div>
    <div class="li"><div class="ld" style="background:#ef4444"></div> Failed</div>
  </div>
</div>

</body>
</html>`;

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

console.log('\n  Dashboard generated!\n');
console.log('   Coverage : ' + g.created + '/' + g.total + ' features (' + g.pct + '%)');
if (cypressAvailable) {
  console.log('   Tests    : ' + cypress.passed + ' passed, ' + cypress.failed + ' failed (' + cypress.passRate + '% pass rate)');
  console.log('   Duration : ' + cypress.duration);
} else {
  console.log('   Tests    : No Cypress report — run npm run cy:run first');
}
console.log('');
mods.forEach(m => {
  const bar = '█'.repeat(Math.round(m.pct/10)) + '░'.repeat(10 - Math.round(m.pct/10));
  console.log('   ' + m.name.padEnd(10) + '  ' + bar + '  ' + m.pct + '%  (' + m.created + '/' + m.total + ')');
});
console.log('\n   Output: cypress/dashboard/report/index.html\n');