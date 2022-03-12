/* eslint-env node */
module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "linebreak-style": ["off"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "eol-last": ["error", "always"],
        "no-unused-vars": "warn",
        "indent": ["error", 4, { "SwitchCase": 1 }]
    }
};
