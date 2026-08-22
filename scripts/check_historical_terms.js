import fs from 'fs';
import Papa from 'papaparse';

const csvText = fs.readFileSync("cme_census_official.csv", "utf8");
const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

const terms = [
  '202223 (Autumn term)', '202223 (Spring term)', '202223 (Summer term)',
  '202324 (Autumn term)', '202324 (Spring term)', '202324 (Summer term)',
  '202425 (Autumn term)', '202425 (Spring term)', '202425 (Summer term)',
  '202526 (Autumn term)'
];

for (const t of terms) {
  const [tp, tidWithParens] = t.split(' ');
  const tid = tidWithParens.replace('(', '').replace(')', '') + ' term';
  const filtered = parsed.data.filter(r => r.time_period === tp && r.time_identifier.includes(tid.split(' ')[0]));
  const nat = filtered.find(r => r.geographic_level === 'National' && r.breakdown_topic === 'Total');
  const laRows = filtered.filter(r => r.geographic_level === 'Local authority' && r.breakdown_topic === 'Total');
  let laSum = 0;
  laRows.forEach(r => { if (r.child_count && !isNaN(Number(r.child_count))) laSum += Number(r.child_count); });
  console.log(`${tp} ${tid}: National=${nat ? nat.child_count : 'N/A'}, LA Rows=${laRows.length}, Sum of LA Numbers=${laSum}`);
}
