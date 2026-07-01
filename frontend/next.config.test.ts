import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const tracingRoot = path.join(projectDir, "..");
const tracingRootForGlob = tracingRoot.replaceAll("\\", "/");
const sourceMapPattern = "./node_modules/.pnpm/next@*/node_modules/next/dist/compiled/source-map/**/*";

describe("nextConfig", () => {
  it("traces stories runtime dependencies from the monorepo root without using symlinked package paths", () => {
    expect(nextConfig.outputFileTracingRoot).toBe(tracingRoot);
    expect(nextConfig.outputFileTracingIncludes).toEqual({
      "/stories": [sourceMapPattern],
      "/stories/[id]": [sourceMapPattern],
    });

    const matchedFiles = globSync(sourceMapPattern, {
      cwd: tracingRootForGlob,
    });

    expect(matchedFiles.some((file) => file.endsWith("source-map.js"))).toBe(true);
  });
});
