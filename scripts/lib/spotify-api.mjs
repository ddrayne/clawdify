#!/usr/bin/env node

/**
 * Shared Spotify API client library.
 * Handles authentication, token refresh, and API requests.
 */

import fs from "node:fs";
import path from "node:path";

const AUTH_PROFILES_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".clawdbot",
  "auth-profiles.json",
);

const SPOTIFY_PROFILE_ID = "spotify:default";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

/**
 * Load OAuth credentials from auth-profiles.json
 */
export function loadCredentials() {
  if (!fs.existsSync(AUTH_PROFILES_PATH)) {
    throw new Error(
      "No auth credentials found. Run OAuth flow first to authenticate.",
    );
  }

  const raw = fs.readFileSync(AUTH_PROFILES_PATH, "utf8");
  const store = JSON.parse(raw);
  const profile = store.profiles[SPOTIFY_PROFILE_ID];

  if (!profile || profile.type !== "oauth" || profile.provider !== "spotify") {
    throw new Error(
      "Spotify OAuth profile not found. Run OAuth flow first to authenticate.",
    );
  }

  return profile;
}

/**
 * Save updated credentials back to auth-profiles.json
 */
export function saveCredentials(updated) {
  const raw = fs.readFileSync(AUTH_PROFILES_PATH, "utf8");
  const store = JSON.parse(raw);
  store.profiles[SPOTIFY_PROFILE_ID] = {
    ...store.profiles[SPOTIFY_PROFILE_ID],
    ...updated,
  };
  fs.writeFileSync(
    AUTH_PROFILES_PATH,
    JSON.stringify(store, null, 2),
    "utf8",
  );
}

/**
 * Refresh access token if expired
 */
export async function refreshTokenIfNeeded(credentials, clientId, clientSecret) {
  const now = Date.now();

  // Add 5min buffer
  if (credentials.expires && now < credentials.expires - 5 * 60 * 1000) {
    return credentials.access;
  }

  // Refresh token
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: credentials.refresh,
    }),
  });

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await resp.json();
  const expiresAt = Date.now() + data.expires_in * 1000;

  // Save updated credentials
  saveCredentials({
    access: data.access_token,
    expires: expiresAt,
    // Keep existing refresh token if not provided
    refresh: data.refresh_token || credentials.refresh,
  });

  return data.access_token;
}

/**
 * Get client credentials from environment variables
 */
export function getClientCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.",
    );
  }

  return { clientId, clientSecret };
}

/**
 * Make authenticated Spotify API request
 */
export async function spotifyRequest(endpoint, options = {}) {
  const credentials = loadCredentials();
  const { clientId, clientSecret } = getClientCredentials();
  const accessToken = await refreshTokenIfNeeded(
    credentials,
    clientId,
    clientSecret,
  );

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!resp.ok) {
    const contentType = resp.headers.get("content-type");
    let error;

    if (contentType?.includes("application/json")) {
      const errorData = await resp.json();
      error = errorData.error?.message || JSON.stringify(errorData);
    } else {
      error = await resp.text();
    }

    throw new Error(`Spotify API error (${resp.status}): ${error}`);
  }

  // Handle 204 No Content responses
  if (resp.status === 204) {
    return null;
  }

  return resp.json();
}
