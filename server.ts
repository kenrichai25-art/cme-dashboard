import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DFE_DATASET_ID = "019bb854-d8d5-707a-bc53-e0de9ac70891";
const DFE_CSV_URL = `https://api.education.gov.uk/statistics/v1/data-sets/${DFE_DATASET_ID}/csv`;
const DFE_META_URL = `https://api.education.gov.uk/statistics/v1/data-sets/${DFE_DATASET_ID}/meta`;

const DATA_FILE_PATH = path.join(__dirname, "src", "data", "officialDfeData.json");

// In-memory cached dataset
let officialDataCache: any = null;

// Term ids the dashboard actually displays. Must match ACADEMIC_TERMS in
// src/data/cmeData.ts — duration breakdowns are only published from 2024/25.
const ACTIVE_TERM_IDS = ["202526_Autumn", "202425_Autumn", "202425_Spring", "202425_Summer"];

/**
 * Number of distinct authorities the dashboard presents.
 *
 * The raw file holds 156 rows, but three are abolished county councils
 * (Cumbria, North Yorkshire, Somerset) that carry data only for 2022/23 —
 * North Yorkshire and Somerset also appear again under their new ONS codes.
 * Counting raw rows reported 156 against a dashboard showing 153, so the
 * header read "156 / 153". Count only authorities with a record for a term
 * that is actually displayed, which is the same rule the client applies.
 */
function countActiveAuthorities(): number {
  const las = officialDataCache?.localAuthorities;
  if (!Array.isArray(las)) return 0;
  return las.filter((la: any) =>
    Object.keys(la?.terms || {}).some((id) => ACTIVE_TERM_IDS.includes(id))
  ).length;
}

function loadDataFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      officialDataCache = JSON.parse(raw);
      console.log(`[DfE Server] Loaded official DfE dataset (${countActiveAuthorities()} LAs, ${ACTIVE_TERM_IDS.length} terms)`);
    }
  } catch (err: any) {
    console.error("[DfE Server] Failed to load data from disk:", err.message);
  }
}

// Initial load
loadDataFromDisk();

async function processAndCacheCsv(csvText: string) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  console.log(`[DfE Sync] Parsed ${parsed.data.length} rows from official DfE stream.`);

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

  const nationalByTerm: Record<string, any> = {};
  const regionsByTerm: Record<string, any> = {};
  const laMap = new Map<string, any>();

  for (const row of parsed.data as any[]) {
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

  officialDataCache = {
    metadata: {
      datasetId: DFE_DATASET_ID,
      datasetTitle: "Children missing education at census date",
      publicationTitle: "Children missing education",
      source: "Department for Education (DfE) Explore Education Statistics (EES) Official Data API",
      sourceUrl: `https://api.education.gov.uk/statistics/v1/data-sets/${DFE_DATASET_ID}`,
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

  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(officialDataCache, null, 2));
  console.log(`[DfE Sync] Saved fresh official dataset to ${DATA_FILE_PATH}`);
  return officialDataCache;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // --- Real DfE API Endpoints ---

  // Health / Status
  app.get("/api/dfe/status", async (req, res) => {
    try {
      res.json({
        status: "connected",
        apiEndpoint: "https://api.education.gov.uk/statistics/v1",
        datasetId: DFE_DATASET_ID,
        title: "Children missing education at census date",
        totalRecords: officialDataCache?.metadata?.totalRecords || 73710,
        termsCount: ACTIVE_TERM_IDS.length,
        latestTerm: "2025/26 Autumn",
        isLive: true,
        lastSynced: officialDataCache?.metadata?.syncedAt || new Date().toISOString(),
        authoritiesCount: countActiveAuthorities(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get full structured dataset
  app.get("/api/dfe/data", (req, res) => {
    if (!officialDataCache) {
      loadDataFromDisk();
    }
    if (!officialDataCache) {
      return res.status(503).json({ error: "DfE Data not loaded yet" });
    }
    res.json(officialDataCache);
  });

  // Sync / Re-fetch live from DfE EES API
  app.post("/api/dfe/sync", async (req, res) => {
    try {
      console.log(`[DfE Sync] Fetching live stream from ${DFE_CSV_URL}...`);
      const response = await fetch(DFE_CSV_URL, {
        headers: {
          "Accept": "text/csv,application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`DfE API returned status ${response.status}: ${response.statusText}`);
      }
      const csvText = await response.text();
      const updated = await processAndCacheCsv(csvText);
      res.json({
        success: true,
        message: "Successfully synchronized live data directly from api.education.gov.uk",
        records: updated.metadata.totalRecords,
        syncedAt: updated.metadata.syncedAt,
        terms: updated.metadata.terms.map((t: any) => t.label)
      });
    } catch (err: any) {
      console.error("[DfE Sync] Error syncing with DfE:", err.message);
      res.status(502).json({
        success: false,
        error: `Failed to connect to DfE API: ${err.message}. Using locally cached official dataset.`
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] CME Official Dashboard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
