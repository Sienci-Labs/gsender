const crypto = require('crypto');
const path = require('path');
const boolean = require('boolean');
const dotenv = require('dotenv');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const babelConfig = require('./babel.config');
const pkg = require('./package.json');

dotenv.config({
    path: path.resolve('webpack.config.server.production.env')
});

const USE_ESLINT_LOADER = boolean(process.env.USE_ESLINT_LOADER);
const USE_TERSER_PLUGIN = boolean(process.env.USE_TERSER_PLUGIN);

// Use publicPath for production
const payload = pkg.version;
const publicPath = ((payload) => {
    const algorithm = 'sha1';
    const buf = String(payload);
    const hash = crypto.createHash(algorithm).update(buf).digest('hex');
    return '/' + hash.substr(0, 8) + '/'; // 8 digits
})(payload);
const buildVersion = pkg.version;

module.exports = {
    mode: 'production',
    devtool: 'source-map',
    // devtool: 'cheap-module-source-map',
    target: 'node', // ignore built-in modules like path, fs, etc.
    context: path.resolve(__dirname, 'src/server'),
    entry: {
        index: [
            './index.js'
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist/gsender/server'),
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },
    optimization: {
        minimizer: [
            USE_TERSER_PLUGIN && (
                new TerserPlugin()
            ),
        ].filter(Boolean)
    },
    plugins: [new webpack.DefinePlugin({
        'global.NODE_ENV': JSON.stringify('production'),
        'global.PUBLIC_PATH': JSON.stringify(publicPath),
        'global.BUILD_VERSION': JSON.stringify(buildVersion),
        'global.METRICS_ENDPOINT': JSON.stringify(process.env.METRICS_ENDPOINT),
    }), sentryWebpackPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
    })],
    module: {
        rules: [
            USE_ESLINT_LOADER && {
                test: /\.jsx?$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                exclude: /node_modules/
            },
            {
                test: /\.hex$/,
                loader: 'file-loader'
            },
            {
                test: /\.hex$/,
                loader: 'file-loader',
                include: [
                    path.resolve(__dirname, 'src/server/lib/Firmware/Flashing')
                ]
            },
            {
                test: /\.hex$/,
                loader: 'raw-loader'
            },
            {
                test: /\.hex$/,
                loader: 'raw-loader',
                include: [
                    path.resolve(__dirname, 'src/server/lib/Firmware/Flashing')
                ]
            },
            {
                test: /\.txt$/,
                loader: 'file-loader'
            },
            {
                test: /\.txt$/,
                loader: 'raw-loader',
                include: [
                    path.resolve(__dirname, 'src/server/lib/Firmware/Flashing')
                ]
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                options: babelConfig,
                exclude: /node_modules/
            }
        ].filter(Boolean)
    },
    externals: [nodeExternals()], // ignore all modules in node_modules folder
    resolve: {
        modules: [
            path.resolve(__dirname, 'src'),
            'node_modules'
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            // Alias paths so that e.g. "../../components/File" becomes "Components/File"
            Actions: path.resolve(__dirname, './src/app/actions'),
            Atoms: path.resolve(__dirname, './src/app/atoms'),
            APIs: path.resolve(__dirname, './src/app/apis'),
            Components: path.resolve(__dirname, './src/app/components'),
            Containers: path.resolve(__dirname, './src/app/containers'),
            Constants: path.resolve(__dirname, './src/app/constants'),
            Contexts: path.resolve(__dirname, './src/app/contexts'),
            Hooks: path.resolve(__dirname, './src/app/hooks'),
            Images: path.resolve(__dirname, './src/app/images'),
            Models: path.resolve(__dirname, './src/app/models'),
            Reducers: path.resolve(__dirname, './src/app/reducers'),
            Routes$: path.resolve(__dirname, './src/app/routes'),
            Styles: path.resolve(__dirname, './src/app/styles'),
            Types: path.resolve(__dirname, './src/app/types'),
            Utils: path.resolve(__dirname, './src/app/utils'),
            Views: path.resolve(__dirname, './src/app/views')
        }
    },
    resolveLoader: {
        modules: [
            path.resolve(__dirname, 'node_modules')
        ]
    },
    node: {
        console: true,
        global: true,
        process: true,
        Buffer: true,
        __filename: true, // Use relative path
        __dirname: true, // Use relative path
        setImmediate: true
    }
};
