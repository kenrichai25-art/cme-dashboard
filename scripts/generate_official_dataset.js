import fs from 'fs';
import Papa from 'papaparse';

const csvText = fs.readFileSync("cme_census_official.csv", "utf8");
const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

console.log("Processing", parsed.data.length, "official rows...");

// Unique terms ordered chronologically
const termOrder = [
  { id: '202223_Autumn', year: '2022/23', term: 'Autumn term', label: '2022/23 Autumn', shortLabel: 'Aut 22' },
  { id: '202223_Spring', year: '2022/23', term: 'Spring term', label: '2022/23 Spring', shortLabel: 'Spr 23' },
  { id: '202223_Summer', year: '2022/23', term: 'Summer term', label: '2022/23 Summer', shortLabel: 'Sum 23' },
  { id: '202324_Autumn', year: '2023/24', term: 'Autumn term', label: '2023/24 Autumn', shortLabel: 'Aut 23' },
  { id: '202324_Spring', year: '2023/24', term: 'Spring term', label: '2023/24 Spring', shortLabel: 'Spr 24' },
  { id: '202324_Summer', year: '2023/24', term: 'Summer term', label: '2023/24 Summer', shortLabel: 'Sum 24' },
  { id: '202425_Autumn', year: '2024/25', term: 'Autumn term', label: '2024/25 Autumn', shortLabel: 'Aut 24' },
  { id: '202425_Spring', year: '2024/25', term: 'Spring term', label: '2024/25 Spring', shortLabel: 'Spr 25' },
  { id: '202425_Summer', year: '2024/25', term: 'Summer term', label: '2024/25 Summer', shortLabel: 'Sum 25' },
  { id: '202526_Autumn', year: '2025/26', term: 'Autumn term', label: '2025/26 Autumn', shortLabel: 'Aut 25 (Latest)' }
];

// Let us organize by Geographic Level: National, Regional, Local Authority
const nationalByTerm = {};
const regionsByTerm = {}; // regionName -> termId -> data
const laMap = new Map(); // laCode -> { code, name, region, oldCode, terms: { termId -> data } }

for (const row of parsed.data) {
  const tp = row.time_period;
  const tid = row.time_identifier;
  const termObj = termOrder.find(t => t.year.replace('/', '') === tp && t.term === tid);
  if (!termObj) continue;
  const termId = termObj.id;

  if (row.geographic_level === 'National') {
    if (!nationalByTerm[termId]) {
      nationalByTerm[termId] = {
        termId,
        termLabel: termObj.label,
        total: 0,
        totalRaw: '0',
        ratePer100: null,
        reasons: {},
        durations: {},
        sex: {},
        yearGroups: {}
      };
    }
    const target = nationalByTerm[termId];
    if (row.breakdown_topic === 'Total') {
      target.totalRaw = row.child_count;
      target.total = isNaN(Number(row.child_count)) ? 0 : Number(row.child_count);
      target.ratePer100 = row.rate_per_100;
    } else if (row.breakdown_topic === 'Reason') {
      target.reasons[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Duration') {
      target.durations[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Sex') {
      target.sex[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Year group') {
      target.yearGroups[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    }
  } else if (row.geographic_level === 'Regional') {
    const regName = row.region_name;
    if (!regionsByTerm[regName]) regionsByTerm[regName] = {};
    if (!regionsByTerm[regName][termId]) {
      regionsByTerm[regName][termId] = {
        termId,
        regionName: regName,
        regionCode: row.region_code,
        total: 0,
        totalRaw: '0',
        ratePer100: null,
        reasons: {},
        durations: {},
        sex: {},
        yearGroups: {}
      };
    }
    const target = regionsByTerm[regName][termId];
    if (row.breakdown_topic === 'Total') {
      target.totalRaw = row.child_count;
      target.total = isNaN(Number(row.child_count)) ? 0 : Number(row.child_count);
      target.ratePer100 = row.rate_per_100;
    } else if (row.breakdown_topic === 'Reason') {
      target.reasons[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Duration') {
      target.durations[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Sex') {
      target.sex[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Year group') {
      target.yearGroups[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    }
  } else if (row.geographic_level === 'Local authority') {
    const code = row.new_la_code;
    if (!code) continue;
    if (!laMap.has(code)) {
      laMap.set(code, {
        code,
        name: row.la_name,
        region: row.region_name,
        oldCode: row.old_la_code,
        terms: {}
      });
    }
    const la = laMap.get(code);
    if (!la.terms[termId]) {
      la.terms[termId] = {
        termId,
        total: 0,
        totalRaw: '0',
        ratePer100: null,
        reasons: {},
        durations: {},
        sex: {},
        yearGroups: {}
      };
    }
    const target = la.terms[termId];
    if (row.breakdown_topic === 'Total') {
      target.totalRaw = row.child_count;
      target.total = isNaN(Number(row.child_count)) ? 0 : Number(row.child_count);
      target.ratePer100 = row.rate_per_100;
    } else if (row.breakdown_topic === 'Reason') {
      target.reasons[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Duration') {
      target.durations[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Sex') {
      target.sex[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    } else if (row.breakdown_topic === 'Year group') {
      target.yearGroups[row.breakdown] = { count: row.child_count, percent: row.child_percent };
    }
  }
}

console.log("National terms processed:", Object.keys(nationalByTerm).length);
console.log("Regions processed:", Object.keys(regionsByTerm).length);
console.log("Local authorities processed:", laMap.size);

const finalPayload = {
  metadata: {
    datasetId: "019bb854-d8d5-707a-bc53-e0de9ac70891",
    datasetTitle: "Children missing education at census date",
    publicationTitle: "Children missing education",
    source: "Department for Education (DfE) Explore Education Statistics (EES) Official Data API",
    sourceUrl: "https://api.education.gov.uk/statistics/v1/data-sets/019bb854-d8d5-707a-bc53-e0de9ac70891",
    lastPublished: "2026-01-29T14:54:38Z",
    syncedAt: new Date().toISOString(),
    termsCount: termOrder.length,
    terms: termOrder,
    totalRecords: parsed.data.length,
    isMandatoryCollectionSince: "Autumn 2024",
    reasonsList: [
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
      'Waiting school start'
    ],
    durationsList: [
      'Less than 2 weeks',
      '2 to 4 weeks',
      '4 to 8 weeks',
      '8 to 12 weeks',
      '12 to 26 weeks',
      '26 to 52 weeks',
      'Over 52 weeks',
      'Unknown'
    ]
  },
  national: nationalByTerm,
  regions: regionsByTerm,
  localAuthorities: Array.from(laMap.values())
};

fs.writeFileSync("src/data/officialDfeData.json", JSON.stringify(finalPayload, null, 2));
console.log("Successfully wrote src/data/officialDfeData.json (" + Math.round(fs.statSync("src/data/officialDfeData.json").size / 1024) + " KB)");
