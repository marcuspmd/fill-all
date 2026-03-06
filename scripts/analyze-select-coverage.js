const fs = require('fs');
const cov = JSON.parse(fs.readFileSync('.coverage/unit/coverage-final.json', 'utf8'));
const key = Object.keys(cov).find(k => k.includes('antd-select-adapter'));
if (!key) { console.log('not found'); process.exit(); }
const file = cov[key];
const branches = file.b;
const bMap = file.branchMap;
const stmts = file.s;
const sMap = file.statementMap;
console.log('=== UNCOVERED BRANCHES ===');
Object.entries(bMap).forEach(([id, info]) => {
  const counts = branches[id];
  const uncovered = counts.map((c,i) => c === 0 ? i : -1).filter(i => i >= 0);
  if (uncovered.length > 0) {
    console.log('Branch', id, 'loc:', JSON.stringify(info.loc), 'type:', info.type, 'uncovered arms:', uncovered, 'counts:', counts);
  }
});
console.log('=== UNCOVERED STATEMENTS ===');
Object.entries(sMap).forEach(([id, loc]) => {
  if (stmts[id] === 0) {
    console.log('Stmt', id, JSON.stringify(loc));
  }
});
