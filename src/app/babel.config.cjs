module.exports = {
    presets: [
        '@babel/preset-env',
        ['@babel/preset-react', { runtime: 'automatic' }],
        {
            targets: {
                node: 'current',
            },
        },
    ],
};
