import {dirname} from "path";
import {fileURLToPath} from "url";
import {FlatCompat} from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // ...compat.extends("next/core-web-vitals", "next/typescript"),
    ...compat.config({
        extends: ['next', 'next/core-web-vitals', 'next/typescript'],
        rules: {
            'react/no-unescaped-entities': 'off',
            '@next/next/no-page-custom-font': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    }),
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ],
    },
];

export default eslintConfig;
