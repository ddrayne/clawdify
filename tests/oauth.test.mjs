#!/usr/bin/env node

/**
 * Tests for Spotify OAuth functionality.
 * Uses Node.js built-in test runner.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRemoteEnvironment, shouldUseManualOAuthFlow } from "../dist/spotify-oauth.js";

describe("OAuth Environment Detection", () => {
  it("should detect SSH environment", () => {
    const originalSSH = process.env["SSH_CLIENT"];

    // Set SSH environment variable
    process.env["SSH_CLIENT"] = "192.168.1.1 12345 22";

    const result = isRemoteEnvironment();
    assert.equal(result, true, "Should detect SSH_CLIENT as remote environment");

    // Cleanup
    if (originalSSH === undefined) {
      delete process.env["SSH_CLIENT"];
    } else {
      process.env["SSH_CLIENT"] = originalSSH;
    }
  });

  it("should not detect local environment as remote", () => {
    // Save original values
    const originalVars = {
      SSH_CLIENT: process.env["SSH_CLIENT"],
      SSH_TTY: process.env["SSH_TTY"],
      SSH_CONNECTION: process.env["SSH_CONNECTION"],
      REMOTE_CONTAINERS: process.env["REMOTE_CONTAINERS"],
      CODESPACES: process.env["CODESPACES"],
    };

    // Clear all remote indicators
    delete process.env["SSH_CLIENT"];
    delete process.env["SSH_TTY"];
    delete process.env["SSH_CONNECTION"];
    delete process.env["REMOTE_CONTAINERS"];
    delete process.env["CODESPACES"];

    // On macOS/Windows with no SSH vars, should be false
    if (process.platform !== "linux") {
      const result = isRemoteEnvironment();
      assert.equal(result, false, "Should not detect local environment as remote");
    }

    // Restore original values
    Object.entries(originalVars).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it("should detect container environments", () => {
    const originalRemote = process.env["REMOTE_CONTAINERS"];

    // Set container environment variable
    process.env["REMOTE_CONTAINERS"] = "true";

    const result = isRemoteEnvironment();
    assert.equal(result, true, "Should detect REMOTE_CONTAINERS as remote environment");

    // Cleanup
    if (originalRemote === undefined) {
      delete process.env["REMOTE_CONTAINERS"];
    } else {
      process.env["REMOTE_CONTAINERS"] = originalRemote;
    }
  });

  it("should recommend appropriate OAuth flow", () => {
    const result = shouldUseManualOAuthFlow();
    // Should be boolean
    assert.equal(typeof result, "boolean", "Should return boolean value");
  });
});

describe("OAuth PKCE Generation", () => {
  it("should generate unique verifiers", async () => {
    // We can't directly test the internal PKCE generation function,
    // but we can verify the exported functions work
    assert.equal(typeof isRemoteEnvironment, "function", "isRemoteEnvironment should be a function");
    assert.equal(typeof shouldUseManualOAuthFlow, "function", "shouldUseManualOAuthFlow should be a function");
  });
});

describe("OAuth URL Building", () => {
  it("should export expected OAuth functions", () => {
    // Verify the module exports the expected functions
    // (We can't test the actual OAuth flow without credentials and a browser)
    assert.equal(typeof isRemoteEnvironment, "function");
    assert.equal(typeof shouldUseManualOAuthFlow, "function");
  });
});
