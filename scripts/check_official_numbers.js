import fs from 'fs';
import Papa from 'papaparse';

const csvText = fs.readFileSync("cme_census_official.csv", "utf8");
const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

// Check 202526 Autumn term
const aut25 = parsed.data.filter(r => r.time_period === '202526' && r.time_identifier === 'Autumn term');

const natTotal = aut25.find(r => r.geographic_level === 'National' && r.breakdown_topic === 'Total');
console.log("Published National Total (202526 Autumn):", natTotal.child_count, "Rate:", natTotal.rate_per_100);

const laTotals = aut25.filter(r => r.geographic_level === 'Local authority' && r.breakdown_topic === 'Total');
console.log("Total LA rows for 202526 Autumn:", laTotals.length);

let sumNumeric = 0;
let lowCount = 0;
let xCount = 0;
let zeroCount = 0;

for (const la of laTotals) {
  const c = la.child_count;
  if (c === 'low') {
    lowCount++;
  } else if (c === 'x' || c === 'z') {
    xCount++;
  } else {
    const num = Number(c);
    if (num === 0) zeroCount++;
    sumNumeric += num;
  }
}

console.log("Sum of numeric LA headline counts:", sumNumeric);
console.log("Number of 'low' LA headline rows:", lowCount);
console.log("Number of 0 LA headline rows:", zeroCount);
console.log("Number of 'x'/'z' LA headline rows:", xCount);

// Let's check reasons at national level
const natReasons = aut25.filter(r => r.geographic_level === 'National' && r.breakdown_topic === 'Reason');
console.log("\n--- National Reasons 202526 Autumn ---");
for (const r of natReasons) {
  console.log(`${r.breakdown}: count=${r.child_count}, percent=${r.child_percent}%`);
}

// Let's check durations at national level
const natDurations = aut25.filter(r => r.geographic_level === 'National' && r.breakdown_topic === 'Duration');
console.log("\n--- National Durations 202526 Autumn ---");
for (const r of natDurations) {
  console.log(`${r.breakdown}: count=${r.child_count}, percent=${r.child_percent}%`);
}
