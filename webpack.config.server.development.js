const crypto = require('crypto');
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const dotenv = require('dotenv');

const babelConfig = require('./babel.config');
const pkg = require('./package.json');

dotenv.config({
    path: path.resolve('webpack.config.server.development.env')
});

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
    mode: 'development',
    devtool: 'cheap-module-eval-source-map',
    target: 'node', // ignore built-in modules like path, fs, etc.
    context: path.resolve(__dirname, 'src/server'),
    entry: {
        index: [
            './index.js'
        ]
    },
    output: {
        path: path.resolve(__dirname, 'output/server'),
        filename: '[name].js',
        libraryTarget: 'commonjs2'
    },
    plugins: [
        new webpack.DefinePlugin({
            'global.NODE_ENV': JSON.stringify('development'),
            'global.PUBLIC_PATH': JSON.stringify(publicPath),
            'global.BUILD_VERSION': JSON.stringify(buildVersion),
            'global.METRICS_ENDPOINT': JSON.stringify(process.env.METRICS_ENDPOINT),
            'process.env': JSON.stringify(process.env),
        })
    ],
    module: {
        rules: [
            {
                test: /\.hex$/,
                loader: 'file-loader'
            },
            {
                test: /\.hex$/,
                loader: 'file-loader',
                include: [
                    path.resolve(__dirname, 'src/server/lib/FirmwareFlashing')
                ]
            },
            {
                test: /\.jsx?$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                exclude: /node_modules/
            },
            {
                test: /\.(jsx?|tsx?)$/,
                loader: 'babel-loader',
                options: babelConfig,
                exclude: /node_modules/
            }
        ]
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
