const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Extract the translationsData object
const start = content.indexOf('const translationsData: Translations = {');
const end = content.lastIndexOf('};');

if (start === -1 || end === -1) {
    console.error("Could not find translationsData object");
    process.exit(1);
}

// Extract the string representation of the object
const translationsObjectStr = content.substring(start + 'const translationsData: Translations = {'.length, end);

// This is not valid JSON, it's a JS object.
// I can try to use a regex to extract all the key-value pairs.
// Or I can try to parse it more robustly.
// Given the format, it's a series of lines like:
// "key": { "en": "...", "ar": "...", ... },

const lines = translationsObjectStr.split('\n');
const languages = ['en', 'ar', 'fr', 'tr', 'zh', 'ku', 'ru'];
const missingTranslations = [];

lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine === '};') return;

    // Extract the key
    const keyMatch = trimmedLine.match(/"([^"]+)":\s*\{/);
    if (keyMatch) {
        const key = keyMatch[1];
        
        languages.forEach(lang => {
            if (!trimmedLine.includes(`"${lang}":`)) {
                missingTranslations.push({ key, lang });
            }
        });
    }
});

if (missingTranslations.length > 0) {
    console.log("Missing translations found:");
    missingTranslations.forEach(m => console.log(`Key: ${m.key}, Language: ${m.lang}`));
} else {
    console.log("All translations present.");
}
