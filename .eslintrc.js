module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'max-lines': [
      'error',
      { max: 250, skipBlankLines: true, skipComments: true },
    ],
    'max-lines-per-function': [
      'error',
      { max: 40, skipBlankLines: true, skipComments: true },
    ],
    'max-depth': ['error', 3],
  },
};
