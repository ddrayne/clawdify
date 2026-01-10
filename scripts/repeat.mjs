#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: repeat.mjs <track|context|off>");
  process.exit(2);
}

const args = process.argv.slice(2);
const mode = args[0]?.toLowerCase();

if (!mode || !["track", "context", "off"].includes(mode)) {
  usage();
}

try {
  await spotifyRequest(`/me/player/repeat?state=${mode}`, {
    method: "PUT",
  });

  const msg =
    mode === "track"
      ? "Repeat track"
      : mode === "context"
        ? "Repeat playlist/album"
        : "Repeat off";
  console.log(`🔁 ${msg}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
