module.exports = {
    extends: '@trendmicro/babel-config',
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
        'lodash',
        '@babel/plugin-transform-optional-chaining'
    ]
};
