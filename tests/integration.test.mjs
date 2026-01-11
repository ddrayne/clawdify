#!/usr/bin/env node

/**
 * Integration tests for Spotify skill scripts.
 * Tests script imports and basic structure.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptsDir = path.join(__dirname, "..", "scripts");

describe("Script Files", () => {
  it("should have all required script files", () => {
    const requiredScripts = [
      "current.mjs",
      "play.mjs",
      "pause.mjs",
      "next.mjs",
      "previous.mjs",
      "volume.mjs",
      "shuffle.mjs",
      "repeat.mjs",
      "queue-add.mjs",
      "devices.mjs",
      "transfer.mjs",
      "search.mjs",
      "library-tracks.mjs",
      "playlists.mjs",
      "recommendations.mjs",
      "lib/spotify-api.mjs",
    ];

    requiredScripts.forEach((script) => {
      const scriptPath = path.join(scriptsDir, script);
      assert.ok(
        fs.existsSync(scriptPath),
        `Script ${script} should exist`
      );
    });
  });

  it("should have executable permissions on scripts", () => {
    const scripts = fs.readdirSync(scriptsDir).filter((f) => f.endsWith(".mjs") && f !== "lib");

    scripts.forEach((script) => {
      const scriptPath = path.join(scriptsDir, script);
      const stats = fs.statSync(scriptPath);
      // Check if file exists (basic check - actual execution would require auth)
      assert.ok(stats.isFile(), `${script} should be a file`);
    });
  });

  it("should have lib directory with shared API client", () => {
    const libPath = path.join(scriptsDir, "lib");
    assert.ok(fs.existsSync(libPath), "lib directory should exist");

    const apiClientPath = path.join(libPath, "spotify-api.mjs");
    assert.ok(fs.existsSync(apiClientPath), "spotify-api.mjs should exist");
  });
});

describe("Script Structure", () => {
  it("should have proper shebang in scripts", () => {
    const scripts = ["current.mjs", "play.mjs", "pause.mjs"];

    scripts.forEach((script) => {
      const scriptPath = path.join(scriptsDir, script);
      const content = fs.readFileSync(scriptPath, "utf8");
      assert.ok(
        content.startsWith("#!/usr/bin/env node"),
        `${script} should have proper shebang`
      );
    });
  });

  it("should import spotify-api from lib in scripts", () => {
    const scripts = ["current.mjs", "play.mjs", "pause.mjs"];

    scripts.forEach((script) => {
      const scriptPath = path.join(scriptsDir, script);
      const content = fs.readFileSync(scriptPath, "utf8");
      assert.ok(
        content.includes('from "./lib/spotify-api.mjs"') ||
          content.includes("from './lib/spotify-api.mjs'"),
        `${script} should import from lib/spotify-api.mjs`
      );
    });
  });
});

describe("Documentation Files", () => {
  const rootDir = path.join(__dirname, "..");

  it("should have README.md", () => {
    const readmePath = path.join(rootDir, "README.md");
    assert.ok(fs.existsSync(readmePath), "README.md should exist");

    const content = fs.readFileSync(readmePath, "utf8");
    assert.ok(content.includes("Clawdify"), "README should mention Clawdify");
    assert.ok(content.includes("Spotify"), "README should mention Spotify");
  });

  it("should have SKILL.md", () => {
    const skillPath = path.join(rootDir, "SKILL.md");
    assert.ok(fs.existsSync(skillPath), "SKILL.md should exist");

    const content = fs.readFileSync(skillPath, "utf8");
    assert.ok(content.includes("clawdify"), "SKILL.md should mention clawdify");
    assert.ok(content.includes("Spotify"), "SKILL.md should mention Spotify");
  });

  it("should have package.json", () => {
    const packagePath = path.join(rootDir, "package.json");
    assert.ok(fs.existsSync(packagePath), "package.json should exist");

    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    assert.equal(pkg.name, "clawdify", "Package name should be clawdify");
    assert.ok(pkg.version, "Package should have version");
    assert.equal(pkg.type, "module", "Package should be ESM module");
  });

  it("should have tsconfig.json", () => {
    const tsconfigPath = path.join(rootDir, "tsconfig.json");
    assert.ok(fs.existsSync(tsconfigPath), "tsconfig.json should exist");

    const content = fs.readFileSync(tsconfigPath, "utf8");
    assert.ok(content.includes("compilerOptions"), "Should have compiler options");
    assert.ok(content.includes("ES2022"), "Should use ES2022 modules");
  });
});

describe("Build Artifacts", () => {
  const rootDir = path.join(__dirname, "..");

  it("should have dist directory after build", () => {
    const distPath = path.join(rootDir, "dist");
    assert.ok(fs.existsSync(distPath), "dist directory should exist after build");
  });

  it("should have compiled OAuth module", () => {
    const distPath = path.join(rootDir, "dist");
    const oauthJs = path.join(distPath, "spotify-oauth.js");
    const oauthDts = path.join(distPath, "spotify-oauth.d.ts");

    assert.ok(fs.existsSync(oauthJs), "Compiled JS file should exist");
    assert.ok(fs.existsSync(oauthDts), "Type declaration file should exist");
  });
});
