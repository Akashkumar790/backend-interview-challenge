const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [{
    files: ["src/**/*.ts"],

    languageOptions: {
        parser: tsParser, // <-- must be the actual parser object
        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    plugins: {
        "@typescript-eslint": tsPlugin,
    },

    rules: {
        "no-unused-vars": "warn",
        "no-console": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",
    },
}, ];
// const tsParser = require("@typescript-eslint/parser");
// const tsPlugin = require("@typescript-eslint/eslint-plugin");

// module.exports = [{
//     files: ["src/**/*.ts"],

//     languageOptions: {
//         parser: tsParser,
//         parserOptions: {
//             project: "./tsconfig.json",
//         },
//     },

//     plugins: {
//         "@typescript-eslint": tsPlugin,
//     },

//     rules: {
//         // General JS/TS rules
//         "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // ignore variables starting with _
//         "no-console": "warn",

//         // TypeScript rules
//         "@typescript-eslint/no-explicit-any": "warn",
//         "@typescript-eslint/explicit-function-return-type": "off",
//         "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
//         "@typescript-eslint/strict-boolean-expressions": "off",

//         // Prettier integration
//         "prettier/prettier": "warn"
//     },

//     ignores: ["node_modules/**", "dist/**"]
// }, ];