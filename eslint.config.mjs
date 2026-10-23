import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import jestPlugin from 'eslint-plugin-jest'

export default defineConfig([
  // Ignore generated Vite production build files.
  { ignores: ["dist/**"] },

  {
    files: ["**/*.{js,mjs,cjs}", '**/*.test.js'],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node, },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', '**/makeMockRes.js'], 
    ...jestPlugin.configs['flat/recommended'],
    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
  },
]);
