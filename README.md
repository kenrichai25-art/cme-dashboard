# CME Compliance Dashboard

A dashboard for analysing Department for Education (DfE) published statistics on
Children Missing Education (CME), built to support HMRC Child Benefit compliance
targeting. It reads DfE's official CME statistics (published via the Explore
Education Statistics API) at the National, Regional, and Local Authority level,
and surfaces recovery yield, scope tiers, and outcome tracking on top of that
published data.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Figures are estimates where noted

Any figure derived from scope-tier assumptions (rather than read directly from a
published DfE table) is marked with an `Est` badge — see `src/data/cmeScope.ts`
for the tiers, thresholds, and estimation method behind those numbers.
