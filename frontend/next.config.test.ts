import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

const projectDir = path.dirname(fileURLToPath(import.meta.url));

describe("nextConfig", () => {
  it("traces stories runtime dependencies from the monorepo root", () => {
    expect(nextConfig.outputFileTracingRoot).toBe(path.join(projectDir, ".."));
    expect(nextConfig.outputFileTracingIncludes).toEqual({
      "/stories": ["./node_modules/next/dist/compiled/source-map/**/*"],
      "/stories/[id]": ["./node_modules/next/dist/compiled/source-map/**/*"],
    });
  });
});
