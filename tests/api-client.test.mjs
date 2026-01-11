#!/usr/bin/env node

/**
 * Tests for Spotify API client library.
 * Uses Node.js built-in test runner.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the API client functions
import {
  getClientCredentials,
  loadCredentials,
  saveCredentials,
  refreshTokenIfNeeded,
  spotifyRequest,
} from "../scripts/lib/spotify-api.mjs";

describe("API Client - Credentials", () => {
  it("should have getClientCredentials function", () => {
    assert.equal(typeof getClientCredentials, "function", "getClientCredentials should be a function");
  });

  it("should throw error when credentials are missing", () => {
    const originalId = process.env["SPOTIFY_CLIENT_ID"];
    const originalSecret = process.env["SPOTIFY_CLIENT_SECRET"];

    delete process.env["SPOTIFY_CLIENT_ID"];
    delete process.env["SPOTIFY_CLIENT_SECRET"];

    assert.throws(
      () => getClientCredentials(),
      /Missing Spotify credentials/,
      "Should throw error when credentials are missing"
    );

    // Restore
    if (originalId) process.env["SPOTIFY_CLIENT_ID"] = originalId;
    if (originalSecret) process.env["SPOTIFY_CLIENT_SECRET"] = originalSecret;
  });

  it("should return credentials when environment variables are set", () => {
    process.env["SPOTIFY_CLIENT_ID"] = "test-client-id";
    process.env["SPOTIFY_CLIENT_SECRET"] = "test-client-secret";

    const creds = getClientCredentials();
    assert.equal(creds.clientId, "test-client-id");
    assert.equal(creds.clientSecret, "test-client-secret");

    // Cleanup
    delete process.env["SPOTIFY_CLIENT_ID"];
    delete process.env["SPOTIFY_CLIENT_SECRET"];
  });
});

describe("API Client - Auth Profiles", () => {
  it("should have loadCredentials function", () => {
    assert.equal(typeof loadCredentials, "function", "loadCredentials should be a function");
  });

  it("should have saveCredentials function", () => {
    assert.equal(typeof saveCredentials, "function", "saveCredentials should be a function");
  });

  it("should throw error when auth-profiles.json is missing", () => {
    // This will throw if the file doesn't exist, which is expected
    const authPath = path.join(
      process.env["HOME"] || process.env["USERPROFILE"],
      ".clawdbot",
      "auth-profiles.json"
    );

    if (!fs.existsSync(authPath)) {
      assert.throws(
        () => loadCredentials(),
        /No auth credentials found/,
        "Should throw error when auth-profiles.json is missing"
      );
    }
  });
});

describe("API Client - Token Refresh", () => {
  it("should have refreshTokenIfNeeded function", () => {
    assert.equal(typeof refreshTokenIfNeeded, "function", "refreshTokenIfNeeded should be a function");
  });

  it("should not refresh token if not expired", async () => {
    const mockCredentials = {
      access: "mock-token",
      refresh: "mock-refresh-token",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
    };

    const result = await refreshTokenIfNeeded(mockCredentials, "client-id", "client-secret");
    assert.equal(result, "mock-token", "Should return existing token if not expired");
  });
});

describe("API Client - Spotify Request", () => {
  it("should have spotifyRequest function", () => {
    assert.equal(typeof spotifyRequest, "function", "spotifyRequest should be a function");
  });

  it("should throw error when credentials are not available", async () => {
    // This test assumes no valid credentials exist
    const authPath = path.join(
      process.env["HOME"] || process.env["USERPROFILE"],
      ".clawdbot",
      "auth-profiles.json"
    );

    if (!fs.existsSync(authPath)) {
      await assert.rejects(
        async () => await spotifyRequest("/me/player"),
        /No auth credentials found/,
        "Should throw error when credentials are not available"
      );
    }
  });
});

describe("API Client - Integration", () => {
  it("should handle API request building", () => {
    // Test that the module can be imported and has expected structure
    assert.ok(getClientCredentials, "Should export getClientCredentials");
    assert.ok(loadCredentials, "Should export loadCredentials");
    assert.ok(saveCredentials, "Should export saveCredentials");
    assert.ok(refreshTokenIfNeeded, "Should export refreshTokenIfNeeded");
    assert.ok(spotifyRequest, "Should export spotifyRequest");
  });
});
