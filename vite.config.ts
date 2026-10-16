import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-vercel";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(process.env.APP_PORT || env.APP_PORT) || 3005;

  return {
    plugins: [
      sveltekit({
        adapter: adapter(),
        inlineStyleThreshold: Infinity,
      }),
      tailwindcss(),
      svelteTesting(),
    ],

    server: {
      port,
    },

    preview: {
      port,
    },

    build: {
      chunkSizeWarningLimit: 1500,
      sourcemap: true,
    },

    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || "http://localhost:8000/api/v1",
      ),
    },

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",

      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],

        include: ["src/**/*.{js,ts,svelte}"],

        exclude: [
          "src/app.d.ts",
          "src/env.d.ts",
          "src/setupTests.ts",
          "src/test-utils.ts",
          "**/*.test.{js,ts}",
          "node_modules/**",
          ".svelte-kit/**",
          ".docs/**",
        ],

        thresholds: {
          lines: 99.5,
          functions: 99,
          branches: 95,
          statements: 99.5,
        },
      },
    },
  };
});