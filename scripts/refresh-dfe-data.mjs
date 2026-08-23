#!/usr/bin/env node
/**
 * refresh-dfe-data.mjs
 *
 * Pulls the Children Missing Education census data set directly from the DfE
 * Explore Education Statistics (EES) API, validates it, and regenerates
 * src/data/officialDfeData.json.
 *
 * Usage:
 *   node scripts/refresh-dfe-data.mjs            # discover data set, fetch, validate, write
 *   node scripts/refresh-dfe-data.mjs --dry-run  # fetch and validate only, write nothing
 *
 * Nothing is written unless every validation gate passes. This is deliberate:
 * a truncated or partial download must fail loudly rather than silently
 * replacing good data with bad.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const API = 'https://api.education.gov.uk/statistics/v1';
const PUBLICATION_SEARCH = 'children missing education';

// The data set we expect. Discovery will confirm this rather than trust it.
const EXPECTED_DATA_SET_TITLE = /children missing education at census date/i;

const CSV_PATH = path.join(ROOT, 'cme_census.csv');
const JSON_PATH = path.join(ROOT, 'src', 'data', 'officialDfeData.json');
const PROVENANCE_PATH = path.join(ROOT, 'src', 'data', 'dfe-provenance.json');

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Expectations. Update these deliberately when DfE publish a new term.
// ---------------------------------------------------------------------------
const EXPECT = {
  minRows: 60_000,
  minLocalAuthorities: 150,
  requiredBreakdownTopics: ['Total', 'Reason', 'Duration', 'Sex', 'Year group'],
  // The 20 published reason categories. If DfE add or rename one, this fails
  // on purpose so the change is reviewed rather than absorbed silently.
  requiredReasons: [
    'Believed to have moved to another country',
    'Believed to have moved to another local authority',
    'Challenging school attendance order',
    'Did not apply for school place at compulsory school age',
    'Did not get school preference',
    'Difficulty accessing suitable school place',
    'Mental health',
    'Moved in from another country',
    'Moved in from another local authority',
    'Not recorded',
    'Offered school place but not yet accepted',
    'Other',
    'Parental decision not to register at school',
    'Physical health',
    'School application awaiting outcome',
    'School dissatisfaction SEND',
    'School dissatisfaction general',
    'Unknown',
    'Unsuitable elective home education',
    'Waiting school start',
  ],
  requiredDurations: [
    'Less than 2 weeks',
    '2 to 4 weeks',
    '4 to 8 weeks',
    '8 to 12 weeks',
    '12 to 26 weeks',
    '26 to 52 weeks',
    'Over 52 weeks',
    'Unknown',
  ],
};

// ---------------------------------------------------------------------------

const log = (...a) => console.log('[dfe]', ...a);
const fail = (msg) => {
  console.error('\n[dfe] REFRESH ABORTED — nothing was written.');
  console.error('[dfe] ' + msg + '\n');
  process.exit(1);
};

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) fail(`GET ${url} returned ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Find the CME publication and its census data set, so the data set ID is
 * discovered from the API rather than hardcoded and left to rot.
 */
async function discoverDataSet() {
  log('Searching publications for:', PUBLICATION_SEARCH);
  const pubs = await getJson(
    `${API}/publications?search=${encodeURIComponent(PUBLICATION_SEARCH)}`
  );
  const results = pubs.results || [];
  if (!results.length) {
    fail(
      'No publication matched. The CME data set may not be exposed through ' +
      'the API — check the EES data catalogue.'
    );
  }

  const pub = results[0];
  log(`Publication: ${pub.title} (${pub.id})`);

  const sets = await getJson(`${API}/publications/${pub.id}/data-sets`);
  const candidates = sets.results || [];
  if (!candidates.length) fail('Publication exposes no data sets via the API.');

  log('Data sets available:');
  candidates.forEach((d) => log(`  - ${d.title} [${d.id}]`));

  const match =
    candidates.find((d) => EXPECTED_DATA_SET_TITLE.test(d.title)) || candidates[0];

  log(`Selected: ${match.title}`);
  return match;
}

async function fetchCsv(dataSetId) {
  const url = `${API}/data-sets/${dataSetId}/csv`;
  log('Downloading CSV:', url);
  const res = await fetch(url);
  if (!res.ok) fail(`CSV download returned ${res.status} ${res.statusText}`);
  const text = await res.text();
  log(`Received ${(text.length / 1024 / 1024).toFixed(1)} MB`);
  return text;
}

/**
 * Validation gates. Each one exists because of a way this has actually
 * gone wrong before.
 */
function validate(csvText) {
  const problems = [];

  // A truncated download usually ends mid-line rather than with a newline.
  if (!/\n$/.test(csvText) && csvText.split('\n').pop().split(',').length < 5) {
    problems.push('File appears truncated — last line is incomplete.');
  }

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;
  log(`Parsed ${rows.length.toLocaleString()} rows`);

  if (parsed.errors.length) {
    problems.push(`CSV parse errors: ${parsed.errors.slice(0, 3).map((e) => e.message).join('; ')}`);
  }

  if (rows.length < EXPECT.minRows) {
    problems.push(
      `Only ${rows.length} rows — expected at least ${EXPECT.minRows}. ` +
      'A short file means a partial download or a filtered export.'
    );
  }

  const topics = new Set(rows.map((r) => r.breakdown_topic));
  for (const t of EXPECT.requiredBreakdownTopics) {
    if (!topics.has(t)) problems.push(`Missing breakdown topic: ${t}`);
  }

  const las = new Set(
    rows.filter((r) => r.geographic_level === 'Local authority').map((r) => r.la_name)
  );
  if (las.size < EXPECT.minLocalAuthorities) {
    problems.push(`Only ${las.size} local authorities — expected ${EXPECT.minLocalAuthorities}+.`);
  }

  // Terms. Guards against the "one term of data behind a ten-term chart" problem.
  const terms = new Set(
    rows.map((r) => `${r.time_period} ${r.time_identifier}`)
  );
  log(`Terms present: ${terms.size}`);
  [...terms].sort().forEach((t) => log(`  - ${t}`));

  // A malformed term label ("Autumn ter") indicates a truncated field.
  for (const t of terms) {
    if (!/(Autumn|Spring|Summer) term$/.test(t)) {
      problems.push(`Malformed term label: "${t}" — suggests a truncated field.`);
    }
  }

  const reasons = new Set(
    rows.filter((r) => r.breakdown_topic === 'Reason').map((r) => r.breakdown)
  );
  const missingReasons = EXPECT.requiredReasons.filter((r) => !reasons.has(r));
  const newReasons = [...reasons].filter((r) => !EXPECT.requiredReasons.includes(r));
  if (missingReasons.length) {
    problems.push(`Reason categories missing: ${missingReasons.join(', ')}`);
  }
  if (newReasons.length) {
    problems.push(
      `New reason categories not in the expected list: ${newReasons.join(', ')}. ` +
      'DfE have changed the taxonomy — review before accepting, and check any ' +
      'chart that compares reasons across terms.'
    );
  }

  const durations = new Set(
    rows.filter((r) => r.breakdown_topic === 'Duration').map((r) => r.breakdown)
  );
  const missingDurations = EXPECT.requiredDurations.filter((d) => !durations.has(d));
  if (missingDurations.length) {
    problems.push(`Duration bands missing: ${missingDurations.join(', ')}`);
  }

  // National totals must be present — the app reads these directly rather than
  // summing LAs (LA figures are not uprated for non-response, so they will not
  // and should not reconcile to the national figure).
  const nationalTotals = rows.filter(
    (r) => r.geographic_level === 'National' && r.breakdown_topic === 'Total'
  );
  if (!nationalTotals.length) {
    problems.push('No National-level Total rows found.');
  } else {
    log('National totals by term:');
    nationalTotals.forEach((r) =>
      log(`  ${r.time_period} ${r.time_identifier}: ${r.child_count}`)
    );
  }

  return { problems, rows };
}

// ---------------------------------------------------------------------------

async function main() {
  const dataSet = await discoverDataSet();
  const summary = await getJson(`${API}/data-sets/${dataSet.id}`);
  const version = summary.latestVersion?.version || 'unknown';
  const published = summary.latestVersion?.published || 'unknown';
  log(`Version ${version}, published ${published}`);

  const csvText = await fetchCsv(dataSet.id);
  const { problems } = validate(csvText);

  if (problems.length) {
    console.error('\n[dfe] Validation failed:');
    problems.forEach((p) => console.error('  ✗ ' + p));
    fail(`${problems.length} problem(s) found.`);
  }
  log('All validation gates passed.');

  if (DRY_RUN) {
    log('Dry run — nothing written.');
    return;
  }

  fs.writeFileSync(CSV_PATH, csvText, 'utf8');
  log('Wrote', path.relative(ROOT, CSV_PATH));

  // Regenerate the app's data file using the existing generator.
  log('Regenerating officialDfeData.json...');
  execFileSync('node', [path.join(__dirname, 'generate_official_dataset.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  // Confirm the generated JSON actually parses. This is the check that would
  // have caught the truncated file.
  try {
    const generated = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const laCount = generated.localAuthorities?.length || 0;
    const termCount = Object.keys(generated.national || {}).length;
    if (laCount < EXPECT.minLocalAuthorities) {
      fail(`Generated JSON has only ${laCount} local authorities.`);
    }
    log(`Generated JSON valid: ${laCount} authorities, ${termCount} national terms.`);
  } catch (err) {
    fail(`Generated JSON is not valid: ${err.message}`);
  }

  fs.writeFileSync(
    PROVENANCE_PATH,
    JSON.stringify(
      {
        source: 'DfE Explore Education Statistics API',
        endpoint: `${API}/data-sets/${dataSet.id}/csv`,
        dataSetId: dataSet.id,
        dataSetTitle: dataSet.title,
        dataSetVersion: version,
        dfePublished: published,
        retrievedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    'utf8'
  );
  log('Wrote provenance to', path.relative(ROOT, PROVENANCE_PATH));
  log('Done.');
}

main().catch((err) => fail(err.stack || String(err)));
