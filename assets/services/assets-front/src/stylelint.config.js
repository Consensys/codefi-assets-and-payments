module.exports = {
  extends: 'stylelint-config-standard',
  ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  rules: {
    'max-empty-lines': 2,
    'value-list-comma-newline-after': null,
    'declaration-colon-newline-after': null,
    'no-descending-specificity': null,
    'rule-empty-line-before': [
      'always',
      { ignore: ['after-comment', 'first-nested', 'inside-block'] },
    ],
  },
};
