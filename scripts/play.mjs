#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: play.mjs [spotify:track:URI or spotify:album:URI]");
  process.exit(2);
}

const args = process.argv.slice(2);
const uri = args[0]; // Optional

try {
  const body = uri ? { uris: [uri] } : undefined;

  await spotifyRequest("/me/player/play", {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(uri ? `▶️  Playing: ${uri}` : "▶️  Playback resumed");
} catch (err) {
  if (err.message.includes("404")) {
    console.error("No active device found. Open Spotify on a device first.");
  } else {
    console.error(`Error: ${err.message}`);
  }
  process.exit(1);
}
