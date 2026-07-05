const fs = require('fs');

const files = [
  'apps/web/app/(app)/automation-studio/AutomationDashboard.tsx',
  'apps/web/app/(app)/knowledge/page.tsx',
  'apps/web/app/(app)/file-studio/page.tsx',
  'apps/web/app/(app)/mcp-builder/page.tsx'
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  c = c.replaceAll('bg-[#0a0a0a]', 'bg-background');
  c = c.replaceAll('bg-[#111]', 'bg-card');
  c = c.replaceAll('bg-gray-900', 'bg-card');
  c = c.replaceAll('bg-black', 'bg-background');
  c = c.replaceAll('bg-[#1a1a1a]', 'bg-muted');
  
  // Borders
  c = c.replaceAll('border-gray-800', 'border-border');
  c = c.replaceAll('border-[#333]', 'border-border');
  c = c.replaceAll('border-gray-700', 'border-border');

  // Text
  // Careful with text-white, sometimes it's for buttons. Let's rely on specific contexts if possible.
  // We'll replace text-white only if it's generally used for body text. Actually, let's just do text-foreground.
  c = c.replaceAll('text-white', 'text-foreground');
  c = c.replaceAll('text-gray-200', 'text-foreground');
  c = c.replaceAll('text-gray-300', 'text-muted-foreground');
  c = c.replaceAll('text-gray-400', 'text-muted-foreground');
  c = c.replaceAll('text-gray-500', 'text-muted-foreground');
  
  // Hover states
  c = c.replaceAll('hover:bg-gray-800', 'hover:bg-accent hover:text-accent-foreground');
  c = c.replaceAll('hover:bg-gray-700', 'hover:bg-accent hover:text-accent-foreground');
  
  // Special for File Studio: sometimes bg-white is hardcoded if they built it for light mode only, 
  // but looking at the screenshot File Studio buttons are invisible because they are white text on white bg!
  // Wait, if it was dark mode originally, then buttons were maybe bg-gray-800 text-white. 
  // If we changed hover:bg-gray-800, we also need to change bg-gray-800 to bg-secondary or bg-muted.
  c = c.replaceAll('bg-gray-800', 'bg-muted');
  c = c.replaceAll('hover:text-white', 'hover:text-foreground');

  fs.writeFileSync(file, c);
  console.log('Fixed', file);
}
