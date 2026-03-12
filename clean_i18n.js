import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'i18n/i18n.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// This is a very simplistic approach, but given the file structure, it might work.
// We want to keep the first occurrence of each key.

const lines = content.split('\n');
const seenKeys = new Set();
const newLines = [];
let insideTranslations = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.trim().startsWith('const translationsData: Translations = {')) {
    insideTranslations = true;
    newLines.push(line);
    continue;
  }
  
  if (insideTranslations && line.trim() === '};') {
    insideTranslations = false;
    newLines.push(line);
    continue;
  }
  
  if (insideTranslations) {
    const match = line.match(/^\s*"([^"]+)":/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        // Skip this duplicate, but we need to handle the object closing
        // This is tricky because the object can span multiple lines
        // Let's just skip until the next key or closing brace
        continue;
      } else {
        seenKeys.add(key);
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  } else {
    newLines.push(line);
  }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('Duplicates removed.');
