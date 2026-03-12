import * as fs from 'fs';

function parseTranslations(content: string) {
    const start = content.indexOf('const translationsData: Translations = {');
    const end = content.lastIndexOf('};');
    
    if (start === -1 || end === -1) {
        throw new Error("Could not find translationsData object");
    }
    
    const translationsObjectStr = content.substring(start + 'const translationsData: Translations = {'.length, end);
    
    const keys: any = {};
    
    // Regex to find each key: "key": { ... }
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
    
    return keys;
}

const content = fs.readFileSync('i18n/i18n.tsx', 'utf8');
const translations = parseTranslations(content);

console.log(JSON.stringify(translations, null, 2));
