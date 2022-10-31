const path = require('path');

module.exports = {
    extends: 'trendmicro',
    parser: 'babel-eslint',
    env: {
        browser: true,
        node: true
    },
    settings: {
        'import/resolver': {
            webpack: {
                config: {
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
                    }
                }
            }
        }
    },
    rules: {
        'max-lines-per-function': [1, {
            max: 512,
            skipBlankLines: true,
            skipComments: true
        }],
        'react/jsx-no-bind': [1, {
            allowArrowFunctions: true
        }],
        'react/prefer-stateless-function': 0,
        'react/no-access-state-in-setstate': 0,
        'react/jsx-indent': 1,
        "react/prop-types": 0
    }
};
