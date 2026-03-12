
const fs = require('fs');

const content = fs.readFileSync('i18n/i18n.tsx', 'utf8');
const regex = /"([a-zA-Z0-9_]+)":/g;
let match;
const keys = [];

while ((match = regex.exec(content)) !== null) {
  keys.push(match[1]);
}

const counts = {};
keys.forEach(key => {
  counts[key] = (counts[key] || 0) + 1;
});

const duplicates = Object.keys(counts).filter(key => counts[key] > 1);
console.log('Duplicates:', duplicates);
duplicates.forEach(key => {
    console.log(`${key}: ${counts[key]}`);
});
