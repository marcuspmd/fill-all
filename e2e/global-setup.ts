/// <reference types="node" />
import fs from "fs";
import path from "path";

const E2E_COVERAGE_DIR = path.join(process.cwd(), ".coverage", "e2e");

export default function globalSetup(): void {
  if (fs.existsSync(E2E_COVERAGE_DIR)) {
    fs.rmSync(E2E_COVERAGE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(E2E_COVERAGE_DIR, { recursive: true });
}
