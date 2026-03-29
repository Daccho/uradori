import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          ADMIN_KEY: "test-admin-key",
          HACKATHON_API_KEY: "test-hackathon-key",
          HACKATHON_API_URL: "https://hackathon.example.com",
          ELEVENLABS_API_KEY: "test-elevenlabs-key",
          ELEVENLABS_VOICE_ID_SORAJIRO: "voice-sorajiro-test",
          ELEVENLABS_VOICE_ID_AUDIENCE: "voice-audience-test",
        },
      },
    }),
  ],
  test: {
    globals: true,
  },
});
