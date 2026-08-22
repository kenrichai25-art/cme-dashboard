import fs from 'fs';
import Papa from 'papaparse';

async function run() {
  console.log("Fetching official DfE CME CSV from api.education.gov.uk...");
  const res = await fetch("https://api.education.gov.uk/statistics/v1/data-sets/019bb854-d8d5-707a-bc53-e0de9ac70891/csv");
  const csvText = await res.text();
  
  // Save dataset to disk for persistence & offline availability
  fs.writeFileSync("cme_census_official.csv", csvText);
  console.log("Saved cme_census_official.csv (" + Math.round(csvText.length / 1024) + " KB)");

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  console.log("Parsed rows:", parsed.data.length);

  const timePeriods = new Set();
  const geoLevels = new Set();
  const topics = new Set();
  const reasons = new Set();
  const durations = new Set();
  const sex = new Set();
  const yearGroups = new Set();
  const las = new Map();

  for (const row of parsed.data) {
    const tp = `${row.time_period} (${row.time_identifier})`;
    timePeriods.add(tp);
    geoLevels.add(row.geographic_level);
    topics.add(row.breakdown_topic);

    if (row.geographic_level === 'Local authority') {
      las.set(row.new_la_code, { code: row.new_la_code, name: row.la_name, region: row.region_name });
    }

    if (row.breakdown_topic === 'Reason') reasons.add(row.breakdown);
    if (row.breakdown_topic === 'Duration') durations.add(row.breakdown);
    if (row.breakdown_topic === 'Sex') sex.add(row.breakdown);
    if (row.breakdown_topic === 'Year group') yearGroups.add(row.breakdown);
  }

  console.log("\n--- TIME PERIODS IN DATASET ---");
  console.log([...timePeriods]);

  console.log("\n--- GEOGRAPHIC LEVELS ---");
  console.log([...geoLevels]);

  console.log("\n--- BREAKDOWN TOPICS ---");
  console.log([...topics]);

  console.log("\n--- EXACT DfE REASONS (" + reasons.size + ") ---");
  console.log([...reasons].sort());

  console.log("\n--- EXACT DfE DURATIONS (" + durations.size + ") ---");
  console.log([...durations].sort());

  console.log("\n--- TOTAL LAs ---", las.size);
}

run().catch(console.error);
