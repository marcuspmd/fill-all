const fs = require("fs");
const data = fs.readFileSync(".coverage/unit/coverage-final.json", "utf8");
const cov = JSON.parse(data);

// Show uncovered branches for a specific file
const args = process.argv.slice(2);
if (args[0]) {
  const key = Object.keys(cov).find((k) => k.includes(args[0]));
  if (!key) { console.log("Not found:", args[0]); process.exit(1); }
  const f = cov[key];
  Object.entries(f.b).forEach(([id, counts]) => {
    if (counts.some((c) => c === 0)) {
      const loc = f.branchMap[id];
      console.log("Branch", id, "type:", loc.type, "line:", loc.loc.start.line, "counts:", counts);
    }
  });
  process.exit(0);
}
const results = [];
for (const [path, file] of Object.entries(cov)) {
  let total = 0, covered = 0;
  for (const branch of Object.values(file.b)) {
    total += branch.length;
    covered += branch.filter((x) => x > 0).length;
  }
  if (total > 0) {
    const pct = Math.round((covered * 100) / total);
    const rel = path.replace("/Users/marcusp/fill-all/src/", "");
    results.push({ pct, total, covered, unc: total - covered, rel });
  }
}
results.sort((a, b) => a.unc - b.unc).reverse();
const tb = results.reduce((s, r) => s + r.total, 0);
const cb = results.reduce((s, r) => s + r.covered, 0);
console.log("TOTAL:", cb, "/", tb, "=", Math.round((cb * 100) / tb) + "%");
console.log("Need to cover to reach 85%:", Math.ceil(tb * 0.85) - cb);
console.log("\nTop 20 by uncovered branches:");
results.slice(0, 20).forEach((r) =>
  console.log(r.pct + "%", "(" + r.covered + "/" + r.total + ")", r.unc + "unc", r.rel)
);
