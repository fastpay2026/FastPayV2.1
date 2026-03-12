
const fs = require('fs');

const content = fs.readFileSync('/i18n/i18n.tsx', 'utf8');

// Extract the translationsData object
const start = content.indexOf('const translationsData: Translations = {');
const end = content.lastIndexOf('};');

if (start === -1 || end === -1) {
    console.error("Could not find translationsData object");
    process.exit(1);
}

const translationsObjectStr = content.substring(start + 'const translationsData: Translations = {'.length, end);

// This is still not a valid JSON. I need to parse it.
// Given the format, I can try to split by lines and process.

const lines = translationsObjectStr.split('\n');
const languages = ['en', 'ar', 'fr', 'tr', 'zh', 'ku', 'ru'];

let currentKey = '';
let currentTranslations = {};

lines.forEach(line => {
    // This is a very basic parser. It might fail on complex lines.
    // I will look for lines that contain keys.
    const keyMatch = line.match(/"([^"]+)":\s*\{/);
    if (keyMatch) {
        currentKey = keyMatch[1];
        currentTranslations = {};
    } else if (currentKey) {
        languages.forEach(lang => {
            if (line.includes(`"${lang}":`)) {
                // This is still not robust.
            }
        });
    }
});

console.log("Analysis script created. This is a complex task.");
