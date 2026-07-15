import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

/** ESLint 10 flat config: eslint-config-next still pulls eslint-plugin-react
 *  which crashes on ESLint 10 (context.getFilename removed). Use Next + TS rules directly. */
const eslintConfig = [
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/**",
    ],
  },
];

export default eslintConfig;
