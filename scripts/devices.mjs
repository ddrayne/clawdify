#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

try {
  const data = await spotifyRequest("/me/player/devices");

  if (!data.devices || data.devices.length === 0) {
    console.log("No devices found. Open Spotify on a device.");
    process.exit(0);
  }

  console.log("Available devices:\n");
  for (const device of data.devices) {
    const active = device.is_active ? "✓" : " ";
    const type = device.type.toLowerCase();
    const volume =
      device.volume_percent !== null ? `${device.volume_percent}%` : "N/A";
    console.log(`[${active}] ${device.name}`);
    console.log(`    Type: ${type} | Volume: ${volume}`);
    console.log(`    ID: ${device.id}\n`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
