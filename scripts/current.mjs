#!/usr/bin/env node

import { spotifyRequest } from "./lib/spotify-api.mjs";

try {
  const data = await spotifyRequest("/me/player/currently-playing");

  if (!data || !data.item) {
    console.log("Nothing currently playing.");
    process.exit(0);
  }

  const track = data.item;
  const artists = track.artists.map((a) => a.name).join(", ");
  const progress = Math.floor(data.progress_ms / 1000);
  const duration = Math.floor(track.duration_ms / 1000);
  const device = data.device?.name || "Unknown device";

  console.log(`🎵 ${track.name}`);
  console.log(`   ${artists}`);
  console.log(`   ${track.album.name}`);
  console.log(`   ${formatTime(progress)} / ${formatTime(duration)}`);
  console.log(`   ${device} | ${data.is_playing ? "Playing" : "Paused"}`);

  if (data.is_playing && data.device?.volume_percent !== undefined) {
    console.log(`   Volume: ${data.device.volume_percent}%`);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
