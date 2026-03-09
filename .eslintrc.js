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
            node: {
                paths: [
                    path.resolve(__dirname, 'src'),
                    'node_modules'
                ],
                extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
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
        "react/prop-types": 0,
        "import/order": 0
    }
};
