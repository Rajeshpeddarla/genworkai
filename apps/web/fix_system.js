const fs = require('fs');

const files = [
  'apps/web/app/api/upload/route.ts',
  'apps/web/app/api/research/route.ts',
  'apps/web/app/api/quizzes/generate/route.ts',
  'apps/web/app/api/automation/generate-plan/route.ts',
  'apps/web/app/api/ai/route.ts'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace:
    // messages: [ { role: "system", content: systemPrompt }, ... ]
    // with:
    // system: systemPrompt, messages: [ ... ]
    
    // Generic regex to catch the pattern
    const regex = /messages\s*:\s*\[\s*\{\s*role\s*:\s*["']system["']\s*,\s*content\s*:\s*([a-zA-Z0-9_]+)\s*\}\s*,?/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, 'system: $1, messages: [');
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    } else {
      console.log('Pattern not found in', file);
    }
  } catch (err) {
    console.error('Error reading', file, err.message);
  }
}
