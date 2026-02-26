module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                useBuiltIns: 'entry',
                corejs: 3,
            }
        ],
        '@babel/preset-react'
    ],
    plugins: [
        // 'lodash', // Removed - causes deprecation warnings and modern bundlers handle tree-shaking
        '@babel/plugin-transform-optional-chaining',
        // Stage 0
        '@babel/plugin-proposal-function-bind',
        // Stage 1
        '@babel/plugin-proposal-export-default-from',
        '@babel/plugin-proposal-logical-assignment-operators',
        ['@babel/plugin-proposal-pipeline-operator', { 'proposal': 'minimal' }],
        ['@babel/plugin-proposal-nullish-coalescing-operator', { 'loose': false }],
        '@babel/plugin-proposal-do-expressions',
        // Stage 2
        '@babel/plugin-proposal-function-sent',
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-proposal-numeric-separator',
        '@babel/plugin-proposal-throw-expressions',
        // Stage 3
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-syntax-import-meta',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-json-strings'
    ],
    overrides: [
        {
            test: /\.tsx?$/,
            presets: [
                ['@babel/preset-typescript', { allowDeclareFields: true }]
            ],
            plugins: [
                ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
                // 'lodash', // Removed - causes deprecation warnings and modern bundlers handle tree-shaking
                '@babel/plugin-transform-optional-chaining',
                // Stage 0
                '@babel/plugin-proposal-function-bind',
                // Stage 1
                '@babel/plugin-proposal-export-default-from',
                '@babel/plugin-proposal-logical-assignment-operators',
                ['@babel/plugin-proposal-pipeline-operator', { 'proposal': 'minimal' }],
                ['@babel/plugin-proposal-nullish-coalescing-operator', { 'loose': false }],
                '@babel/plugin-proposal-do-expressions',
                // Stage 2
                '@babel/plugin-proposal-function-sent',
                '@babel/plugin-proposal-export-namespace-from',
                '@babel/plugin-proposal-numeric-separator',
                '@babel/plugin-proposal-throw-expressions',
                // Stage 3
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-syntax-import-meta',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-json-strings'
            ]
        }
    ]
};
