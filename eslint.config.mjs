import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tailwind from "eslint-plugin-tailwindcss";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  ...nextVitals,
  ...tailwind.configs["flat/recommended"],
  {
    settings: {
      tailwindcss: {
        callees: ["cn", "clsx", "cva"],
        config: path.join(__dirname, "./src/app/globals.css"),
      },
    },
    rules: {
      // Keep canonicalization out of save-time ESLint fixes.
      "tailwindcss/enforces-shorthand": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    "tsconfig.typecheck.tsbuildinfo"
  ])
]);
