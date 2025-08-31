import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["**/node_modules/**", ".next/**", "out/**", "dist/**", "public/**"]
  },
  js.configs.recommended,
  next,
  prettier,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
          "alphabetize": { "order": "asc", "caseInsensitive": true }
        }
      ],
      "react/react-in-jsx-scope": "off"
    }
  }
];
