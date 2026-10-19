import { defineConfig } from 'vitest/config';

// Unit tests cover pure playback logic only (no DOM); browser behaviour stays
// with the manual golden path described in AGENTS.md.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
