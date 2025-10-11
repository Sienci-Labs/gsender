const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const pkg = require('./package.json');

// Load environment variables based on target
function loadEnv(target) {
    const envFile = target === 'production'
        ? 'webpack.config.server.production.env'
        : 'webpack.config.server.development.env';

    dotenv.config({ path: path.resolve(__dirname, envFile) });
}

// Plugin to handle webpack's !file-loader! syntax and .hex files
// Plugin to resolve paths from 'src' directory (like webpack's modules config)
const srcResolverPlugin = {
    name: 'src-resolver',
    setup(build) {
        const resolveFromSrc = async (importPath) => {
            const basePath = path.resolve(__dirname, 'src', importPath);

            // Try exact path first
            if (fs.existsSync(basePath)) {
                return basePath;
            }

            // Try with .js extension
            if (fs.existsSync(basePath + '.js')) {
                return basePath + '.js';
            }

            // Try with .ts extension
            if (fs.existsSync(basePath + '.ts')) {
                return basePath + '.ts';
            }

            // Try as directory with index.js
            if (fs.existsSync(path.join(basePath, 'index.js'))) {
                return path.join(basePath, 'index.js');
            }

            // Try as directory with index.ts
            if (fs.existsSync(path.join(basePath, 'index.ts'))) {
                return path.join(basePath, 'index.ts');
            }

            return basePath; // Return original if nothing found
        };

        // Resolve imports like 'server/...' from 'src/' directory
        build.onResolve({ filter: /^server\// }, async (args) => {
            const resolved = await resolveFromSrc(args.path);
            return { path: resolved };
        });

        build.onResolve({ filter: /^app\// }, async (args) => {
            const resolved = await resolveFromSrc(args.path);
            return { path: resolved };
        });

        build.onResolve({ filter: /^electron-app\// }, async (args) => {
            const resolved = await resolveFromSrc(args.path);
            return { path: resolved };
        });
    },
};

function createHexFilePlugin(target) {
    const isDev = target === 'development';
    const baseOutDir = isDev ? 'output' : 'dist/gsender';

    return {
        name: 'hex-file-loader',
        setup(build) {
            // Intercept JS files that might have webpack loader syntax
            build.onLoad({ filter: /\.js$/ }, async (args) => {
                const source = await fs.promises.readFile(args.path, 'utf8');

                // Check if file contains webpack file-loader syntax
                if (!source.includes('!file-loader!')) {
                    return null; // Let esbuild handle it normally
                }

                // Transform webpack loader syntax to regular imports
                const transformed = source.replace(
                    /(['"])!file-loader!([^'"]+\.hex)\1/g,
                    (match, quote, hexPath) => `${quote}${hexPath}${quote}`
                );

                return {
                    contents: transformed,
                    loader: 'js',
                };
            });

            // Handle .hex file imports
            build.onLoad({ filter: /\.hex$/ }, async (args) => {
                const contents = await fs.promises.readFile(args.path, 'utf8');

                // Determine output path relative to src/server
                const serverDir = path.join(__dirname, 'src/server');
                const relativePath = path.relative(serverDir, args.path);
                const outputPath = path.join(__dirname, baseOutDir, 'server', relativePath);

                // Ensure output directory exists
                await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
                // Copy the .hex file to output
                await fs.promises.writeFile(outputPath, contents);

                // Return the path to the copied file (relative to where it will be required from)
                const relativeToOutput = path.relative(
                    path.join(__dirname, baseOutDir, 'server'),
                    outputPath
                );

                return {
                    contents: `module.exports = ${JSON.stringify('./' + relativeToOutput.replace(/\\/g, '/'))}`,
                    loader: 'js',
                };
            });
        },
    };
}

// Helper to copy static directories
async function copyStaticFiles(target) {
    const serverDirs = ['i18n', 'views'];
    const outputDir = target === 'production'
        ? path.join(__dirname, 'dist/gsender/server')
        : path.join(__dirname, 'output/server');

    for (const dir of serverDirs) {
        const srcDir = path.join(__dirname, 'src/server', dir);
        const destDir = path.join(outputDir, dir);

        if (fs.existsSync(srcDir)) {
            await fs.promises.mkdir(destDir, { recursive: true });
            await copyDir(srcDir, destDir);
        }
    }
}

async function copyDir(src, dest) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }
}

// Calculate public path hash
const payload = pkg.version;
const algorithm = 'sha1';
const buf = String(payload);
const hash = crypto.createHash(algorithm).update(buf).digest('hex');
const publicPath = '/' + hash.substr(0, 8) + '/';
const buildVersion = pkg.version;

// Sentry plugin for esbuild (optional - only in production)
function getSentryPlugin() {
    if (process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
        try {
            const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');
            return sentryEsbuildPlugin({
                authToken: process.env.SENTRY_AUTH_TOKEN,
                org: process.env.SENTRY_ORG,
                project: process.env.SENTRY_PROJECT,
            });
        } catch (error) {
            console.warn('⚠️  Sentry plugin not available, skipping source map upload');
            return null;
        }
    }
    return null;
}

// Shared configuration
const createConfig = (target, entry, outdir, additionalOptions = {}) => {
    const isDev = target === 'development';
    const isProd = target === 'production';

    const plugins = additionalOptions.plugins || [];
    if (isProd) {
        const sentryPlugin = getSentryPlugin();
        if (sentryPlugin) {
            plugins.push(sentryPlugin);
        }
    }

    return {
        entryPoints: [entry],
        bundle: true,
        platform: 'node',
        target: 'node18',
        outdir,
        sourcemap: isProd ? true : 'inline',
        minify: isProd && process.env.USE_TERSER_PLUGIN === 'true',
        define: {
            'global.NODE_ENV': JSON.stringify(target),
            'global.PUBLIC_PATH': JSON.stringify(publicPath),
            'global.BUILD_VERSION': JSON.stringify(buildVersion),
            'global.METRICS_ENDPOINT': JSON.stringify(process.env.METRICS_ENDPOINT || ''),
        },
        // External packages are handled by 'packages: external' option
        // Don't add local files to external, only node_modules should be external
        // .hex files are handled by the hexFilePlugin
        loader: {
            '.txt': 'copy',
        },
        logLevel: 'info',
        ...additionalOptions,
        plugins,
    };
};

// Build server
async function buildServer(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output/server')
        : path.join(__dirname, 'dist/gsender/server');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/server/index.js'),
        outdir,
        {
            packages: 'external', // Don't bundle any node_modules
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        await copyStaticFiles(target);
        console.log('✅ Server build complete');
    } catch (error) {
        console.error('❌ Server build failed:', error);
        process.exit(1);
    }
}

// Build electron main process
async function buildElectron(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/main.js'),
        outdir,
        {
            packages: 'external', // Don't bundle any node_modules
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        console.log('✅ Electron main build complete');
    } catch (error) {
        console.error('❌ Electron main build failed:', error);
        process.exit(1);
    }
}

// Build server-cli
async function buildServerCli(target) {
    loadEnv(target);

    const isDev = target === 'development';
    const outdir = isDev
        ? path.join(__dirname, 'output')
        : path.join(__dirname, 'dist/gsender');

    const config = createConfig(
        target,
        path.join(__dirname, 'src/server-cli.js'),
        outdir,
        {
            packages: 'external',
            outExtension: { '.js': '.js' },
            plugins: [srcResolverPlugin, createHexFilePlugin(target)],
        }
    );

    try {
        await esbuild.build(config);
        console.log('✅ Server CLI build complete');
    } catch (error) {
        console.error('❌ Server CLI build failed:', error);
        process.exit(1);
    }
}

// Watch mode for development
async function watchServer() {
    loadEnv('development');

    const outdir = path.join(__dirname, 'output/server');

    const config = createConfig(
        'development',
        path.join(__dirname, 'src/server/index.js'),
        outdir,
        {
            packages: 'external',
            plugins: [srcResolverPlugin, createHexFilePlugin('development')],
        }
    );

    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('👀 Watching server files...');

    // Copy static files initially
    await copyStaticFiles('development');
}

// Main build function
async function build() {
    const args = process.argv.slice(2);
    const target = args.includes('--production') ? 'production' : 'development';
    const watch = args.includes('--watch');
    const buildTarget = args.find(arg => arg.startsWith('--target='))?.split('=')[1] || 'all';

    console.log(`🔨 Building for ${target}...`);

    if (watch && target === 'development') {
        await watchServer();
        return;
    }

    try {
        if (buildTarget === 'all' || buildTarget === 'server') {
            await buildServer(target);
        }
        if (buildTarget === 'all' || buildTarget === 'electron') {
            await buildElectron(target);
        }
        if (buildTarget === 'all' || buildTarget === 'server-cli') {
            await buildServerCli(target);
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = {
    buildServer,
    buildElectron,
    buildServerCli,
    createConfig,
};

// Run if called directly
if (require.main === module) {
    build();
}
