#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

function usage() {
  console.error("Usage: shuffle.mjs <on|off|toggle>");
  process.exit(2);
}

const args = process.argv.slice(2);
const mode = args[0]?.toLowerCase();

if (!mode || !["on", "off", "toggle"].includes(mode)) {
  usage();
}

try {
  let state;

  if (mode === "toggle") {
    const current = await spotifyRequest("/me/player");
    state = !current.shuffle_state;
  } else {
    state = mode === "on";
  }

  await spotifyRequest(`/me/player/shuffle?state=${state}`, {
    method: "PUT",
  });
  console.log(`🔀 Shuffle ${state ? "enabled" : "disabled"}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
