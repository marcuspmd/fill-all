/// <reference types="node" />
import { createCoverageMap } from "istanbul-lib-coverage";
import type { CoverageMapData } from "istanbul-lib-coverage";
import { createContext } from "istanbul-lib-report";
import * as reports from "istanbul-reports";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const UNIT_DIR = path.join(ROOT, ".coverage", "unit");
const E2E_DIR = path.join(ROOT, ".coverage", "e2e");
const OUTPUT_DIR = path.join(ROOT, "coverage");

function loadJsonFiles(dir: string): CoverageMapData[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map(
      (f) =>
        JSON.parse(
          fs.readFileSync(path.join(dir, f), "utf-8"),
        ) as CoverageMapData,
    );
}

const merged = createCoverageMap({});

for (const data of [...loadJsonFiles(UNIT_DIR), ...loadJsonFiles(E2E_DIR)]) {
  merged.merge(data);
}

if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

const context = createContext({ dir: OUTPUT_DIR, coverageMap: merged });

reports.create("html").execute(context);
reports.create("text").execute(context);
reports.create("lcov").execute(context);

console.log(`\nMerged coverage report → ${OUTPUT_DIR}/index.html`);
