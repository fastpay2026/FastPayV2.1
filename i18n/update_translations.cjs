const fs = require('fs');
const data = fs.readFileSync('i18n/i18n.tsx', 'utf8');

const updatedData = data.replace(/"en": "([^"]*)",\s*"ar": "([^"]*)",\s*"fr": "([^"]*)"/g, '"en": "$1", "ar": "$2", "fr": "$3", "tr": "$1", "zh": "$1", "ku": "$1", "ru": "$1"');

fs.writeFileSync('i18n/i18n.tsx', updatedData);
console.log('Updated translations');
