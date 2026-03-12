import * as fs from 'fs';

const content = fs.readFileSync('i18n/i18n.tsx', 'utf8');

// Extract the translationsData object
const start = content.indexOf('const translationsData: Translations = {');
const end = content.lastIndexOf('};');

if (start === -1 || end === -1) {
    throw new Error("Could not find translationsData object");
}

const translationsObjectStr = content.substring(start + 'const translationsData: Translations = {'.length, end);

// Parse the object manually (it's a bit tricky because of the duplicate keys)
// I will split by key, then consolidate.
const keys: any = {};
const keyRegex = /"([^"]+)":\s*\{([\s\S]*?)\},/g;

let match;
while ((match = keyRegex.exec(translationsObjectStr)) !== null) {
    const key = match[1];
    const content = match[2];
    
    // Parse the content of the object
    const langRegex = /"([a-z]{2})":\s*"([^"]*)"/g;
    let langMatch;
    const langs: any = {};
    while ((langMatch = langRegex.exec(content)) !== null) {
        langs[langMatch[1]] = langMatch[2];
    }
    keys[key] = langs;
}

// Now consolidate and find missing translations
const languages = ['en', 'ar', 'fr', 'tr', 'zh', 'ku', 'ru'];
const missing: any = {};

for (const key in keys) {
    for (const lang of languages) {
        if (!keys[key][lang]) {
            if (!missing[key]) missing[key] = [];
            missing[key].push(lang);
        }
    }
}

console.log("Missing translations:", JSON.stringify(missing, null, 2));

// Generate the consolidated object
const consolidated: any = {};
for (const key in keys) {
    consolidated[key] = {};
    for (const lang of languages) {
        consolidated[key][lang] = keys[key][lang] || keys[key]['en'] || "";
    }
}

// Generate the new file content
let newContent = content.substring(0, start + 'const translationsData: Translations = {'.length);
for (const key in consolidated) {
    newContent += `\n  "${key}": { ${languages.map(lang => `"${lang}": "${consolidated[key][lang].replace(/"/g, '\\"')}"`).join(', ')} },`;
}
newContent += '\n};';
newContent += content.substring(end + 2);

fs.writeFileSync('i18n/i18n_consolidated.tsx', newContent);
console.log("Consolidated file written to i18n/i18n_consolidated.tsx");
