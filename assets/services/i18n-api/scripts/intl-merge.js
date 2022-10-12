/* eslint-disable @typescript-eslint/no-var-requires */
const { writeFileSync } = require('fs')
const jsonMerger = require('json-merger')

const result = jsonMerger.mergeFiles([
  'locales/defaults.json',
  'locales/tmp.json',
])

writeFileSync('locales/defaults.json', JSON.stringify(result, null, 2))
