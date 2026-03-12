
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

// This is not valid JSON. I will try to make it valid JSON by adding quotes around keys if missing, etc.
// This is too complex. I will just read the file and process it in chunks.
console.log("File read successfully, size:", content.length);
