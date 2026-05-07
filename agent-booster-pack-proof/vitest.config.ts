import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@mariozechner/pi-tui": fileURLToPath(new URL("./test/support/pi-tui.ts", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["eval/**", "node_modules/**"],
  },
});
