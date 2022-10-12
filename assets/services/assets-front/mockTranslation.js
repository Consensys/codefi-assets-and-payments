const fs = require('fs');

const rawdata = fs.readFileSync('defaults-keys.json');
const keys = JSON.parse(rawdata);
Object.keys(keys).forEach(key => {
  keys[key] = `M_${keys[key]}`;
});
fs.writeFileSync('./src/mocked-keys.json', JSON.stringify(keys));
console.log("🔥 Translations mocked 🔥 - switch to mocked translations in src/common/i18n/I18nProvider.tsx line 112 & 113")