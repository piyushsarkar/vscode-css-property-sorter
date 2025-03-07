// @ts-check
import tsEslint from "typescript-eslint";
import eslint from "@eslint/js";
import globals from "globals";

export default tsEslint.config(
  { files: ["**/*.{ts,js}"] },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    extends: [eslint.configs.recommended, ...tsEslint.configs.recommended],
  }
);
