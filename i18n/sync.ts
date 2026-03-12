import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'i18n.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Extract the translationsData object
const start = content.indexOf('const translationsData: Translations = {');
const end = content.lastIndexOf('};');

if (start === -1 || end === -1) {
    console.error("Could not find translationsData object");
    process.exit(1);
}

const header = content.substring(0, start + 'const translationsData: Translations = {'.length);
const footer = content.substring(end);
const translationsObjectStr = content.substring(start + 'const translationsData: Translations = {'.length, end);

const lines = translationsObjectStr.split('\n');
const languages = ['en', 'ar', 'fr', 'tr', 'zh', 'ku', 'ru'];
const translations = {};

lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine === '};') return;

    // Extract the key
    const keyMatch = trimmedLine.match(/"([^"]+)":\s*\{/);
    if (keyMatch) {
        const key = keyMatch[1];
        translations[key] = {};
        
        languages.forEach(lang => {
            const langMatch = trimmedLine.match(new RegExp(`"${lang}":\\s*"([^"]*)"`));
            if (langMatch) {
                translations[key][lang] = langMatch[1];
            } else {
                translations[key][lang] = ""; // Placeholder
            }
        });
    }
});

// Now I have the translations object.
// Let's check for missing translations.
let missingCount = 0;
for (const key in translations) {
    languages.forEach(lang => {
        if (!translations[key][lang]) {
            console.log(`Missing translation for key: ${key}, language: ${lang}`);
            missingCount++;
            // Fill with English translation if available
            if (translations[key]['en']) {
                translations[key][lang] = translations[key]['en'];
            } else {
                translations[key][lang] = "TODO";
            }
        }
    });
}

// Reconstruct the file
let newContent = header + '\n';
for (const key in translations) {
    newContent += `  "${key}": { `;
    newContent += languages.map(lang => `"${lang}": "${translations[key][lang]}"`).join(', ');
    newContent += ' },\n';
}
newContent = newContent.slice(0, -2) + '\n' + footer;

fs.writeFileSync(filePath, newContent);
console.log(`Sync complete. Filled ${missingCount} missing translations.`);
